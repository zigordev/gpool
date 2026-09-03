import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Admin, Kafka, logLevel, Producer } from 'kafkajs';
import { kafkaLogCreator } from '../observability';

export interface NotificationEventEnvelope {
  messageId: string;
  idempotencyKey: string;
  sourceApp: string;
  channel: 'email';
  templateId: string;
  replyTo?: string;
  recipient: {
    email: string;
  };
  data: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  requestedAt: string;
}

@Injectable()
export class NotificationPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationPublisherService.name);
  private readonly topic: string;
  private readonly brokers: string[];
  private readonly clientId: string;
  private producer: Producer | null = null;
  private connectPromise: Promise<Producer> | null = null;

  /**
   * Whether the broker is currently reachable, for the health endpoint.
   *
   * `null` means not yet attempted. The producer connected lazily on first
   * publish, so a broker outage stayed invisible until someone happened to
   * trigger an email — and then only to that one request. Health had nothing
   * to report because nothing was connected to report on.
   */
  private kafkaUp: boolean | null = null;

  /**
   * A separate client just for the health probe.
   *
   * kafkajs gives a producer no way to ask "is the broker still there". Its
   * `DISCONNECT` event fires when *we* disconnect, not when the broker vanishes,
   * and the connection pool reconnects lazily on the next send — so a producer
   * that is not publishing never notices an outage at all. Verified: stopping
   * the broker left this flag reading `up` indefinitely. An admin client that
   * asks for cluster metadata on a timer is the only honest signal.
   */
  private admin: Admin | null = null;
  private probeTimer: ReturnType<typeof setInterval> | null = null;
  private probing = false;

  /** Long enough to be cheap, short enough that health is not stale news. */
  private static readonly PROBE_INTERVAL_MS = 15_000;

  constructor(private readonly configService: ConfigService) {
    this.topic = this.configService.get<string>(
      'NOTIFICATIONS_EMAIL_TOPIC',
      'notification.email.requested.v1',
    );
    this.brokers = (this.configService.get<string>('NOTIFICATIONS_KAFKA_BROKERS', '') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    this.clientId = this.configService.get<string>('OTEL_SERVICE_NAME', 'gpool-api');
  }

  async publishEmail(event: NotificationEventEnvelope): Promise<void> {
    if (this.brokers.length === 0) {
      throw new Error('NOTIFICATIONS_KAFKA_BROKERS is required');
    }

    const producer = await this.getProducer();
    try {
      await producer.send({
        topic: this.topic,
        messages: [
          {
            key: event.idempotencyKey,
            value: JSON.stringify(event),
            headers: {
              sourceApp: event.sourceApp,
              templateId: event.templateId,
              channel: event.channel,
            },
          },
        ],
      });
    } catch (error) {
      this.resetProducerState(producer);
      throw error;
    }
  }

  /**
   * Connect at boot rather than on first publish, so the broker's state is
   * known before anyone asks. Deliberately not awaited: Kafka being down must
   * not stop the API serving everything that has nothing to do with email.
   */
  onModuleInit(): void {
    if (this.brokers.length === 0) return;
    void this.getProducer().catch(() => undefined);

    void this.probeBroker();
    this.probeTimer = setInterval(
      () => void this.probeBroker(),
      NotificationPublisherService.PROBE_INTERVAL_MS,
    );
    // Never hold the process open for a health probe.
    this.probeTimer.unref?.();
  }

  /**
   * Ask the cluster for its metadata and record whether it answered.
   *
   * Retries are off and the timeouts are short on purpose: this is a probe, not
   * a request that matters. It should fail fast and report, not spend thirty
   * seconds retrying and leave health blocked behind it.
   */
  private async probeBroker(): Promise<void> {
    // A hung connect must not stack up probes behind it.
    if (this.probing) return;
    this.probing = true;
    try {
      const admin = await this.getAdmin();
      await admin.describeCluster();
      this.kafkaUp = true;
    } catch {
      this.kafkaUp = false;
      const admin = this.admin;
      this.admin = null;
      void admin?.disconnect().catch(() => undefined);
    } finally {
      this.probing = false;
    }
  }

  private async getAdmin(): Promise<Admin> {
    if (this.admin) return this.admin;

    const kafka = new Kafka({
      clientId: `${this.clientId}-health`,
      brokers: this.brokers,
      logLevel: logLevel.NOTHING,
      connectionTimeout: 3000,
      requestTimeout: 3000,
      retry: { retries: 0 },
    });

    const admin = kafka.admin();
    await admin.connect();
    this.admin = admin;
    return admin;
  }

  /** For the health endpoint. `null` until a connection is first attempted. */
  isKafkaUp(): boolean | null {
    return this.kafkaUp;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.probeTimer) {
      clearInterval(this.probeTimer);
      this.probeTimer = null;
    }
    if (this.admin) {
      const admin = this.admin;
      this.admin = null;
      await admin.disconnect().catch(() => undefined);
    }

    if (!this.producer) {
      return;
    }

    await this.producer.disconnect().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to disconnect Kafka producer cleanly: ${message}`);
    });
  }

  private async getProducer(): Promise<Producer> {
    if (this.producer) {
      return this.producer;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    const kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
      // kafkajs logs its own JSON shape with no `service` and no
      // trace context, which is exactly the wrong thing when a
      // broker disappears. Route it through the estate's logger.
      logCreator: kafkaLogCreator(),
    });

    const producer = kafka.producer({
      idempotent: true,
      allowAutoTopicCreation: true,
    });


    this.connectPromise = producer
      .connect()
      .then(() => {
        this.producer = producer;
        this.kafkaUp = true;
        this.logger.log(`Kafka producer connected to ${this.brokers.join(', ')}`);
        return producer;
      })
      .catch((error) => {
        this.resetProducerState(producer);
        throw error;
      });

    return this.connectPromise;
  }

  private resetProducerState(producer: Producer): void {
    this.kafkaUp = false;
    if (this.producer === producer) {
      this.producer = null;
    }
    if (this.connectPromise) {
      this.connectPromise = null;
    }
    void producer.disconnect().catch(() => undefined);
  }
}
