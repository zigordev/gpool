import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PostgresService } from '../database/postgres.service';
import { NotificationPublisherService } from '../notification/notification.publisher.service';
import { recordHealth } from '../observability';

/** Matches `OTEL_SERVICE_NAME`, so health, metrics, traces and logs all name
 *  this service identically. */
const SERVICE = 'gpool-api';

/**
 * One endpoint, reporting everything.
 *
 * `status` is `ok` when every component is up, `degraded` when an optional one
 * is down, and `error` (503) when a required one is. The distinction matters:
 * this service PRODUCES to Kafka rather than consuming from it, so a broker
 * outage stops emails being queued but leaves everything else working. Failing
 * the whole health check for that would take the service out of rotation over a
 * partial degradation.
 *
 * The database is required — without it there is nothing to serve.
 *
 * Note for the future: a single dependency-probing endpoint is fine as a Docker
 * healthcheck, which does not restart on failure. Used as a Kubernetes liveness
 * probe it would turn a database blip into a restart loop; a separate liveness
 * path would be needed then.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly postgres: PostgresService,
    private readonly publisher: NotificationPublisherService,
  ) {}

  @Get()
  async check(@Res({ passthrough: true }) res: Response) {
    let db = false;
    try {
      await this.postgres.ping();
      db = true;
    } catch {
      db = false;
    }

    const kafka = this.publisher.isKafkaUp();

    // `null` means no connection has been attempted yet, which is not a
    // failure — reporting "down" at boot would be a lie.
    const kafkaDown = kafka === false;
    const status = !db ? 'error' : kafkaDown ? 'degraded' : 'ok';
    if (!db) res.status(503);

    const components = {
      db: { status: db ? 'up' : 'down' },
      kafka: { status: kafka === null ? 'unknown' : kafka ? 'up' : 'down' },
    };

    // The same judgement the response carries, as a metric — otherwise
    // `degraded` is a state nothing can alert on.
    recordHealth(status, components);

    return { status, service: SERVICE, components };
  }
}
