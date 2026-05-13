import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PostgresService } from '../database/postgres.service';
import { NotificationEventEnvelope, NotificationPublisherService } from './notification.publisher.service';

type NotificationStatus = 'pending' | 'queued' | 'failed' | 'skipped';
type NotificationLocale = 'es' | 'en';

const DEFAULT_LOCALE: NotificationLocale = 'es';

function normalizeLocale(value: string | null | undefined): NotificationLocale {
  return value?.trim().toLowerCase().split(/[-_]/)[0] === 'en' ? 'en' : DEFAULT_LOCALE;
}

function invitationSubject(poolName: string, locale: NotificationLocale): string {
  return locale === 'en'
    ? `You've been invited to join ${poolName} on GPool`
    : `Te han invitado a unirte a ${poolName} en GPool`;
}

function accessRequestSubject(poolName: string, locale: NotificationLocale): string {
  return locale === 'en'
    ? `Pool access request for ${poolName} on GPool`
    : `Solicitud de acceso a ${poolName} en GPool`;
}

function accessGrantedSubject(poolName: string, locale: NotificationLocale): string {
  return locale === 'en'
    ? `Access granted to ${poolName} on GPool`
    : `Acceso concedido a ${poolName} en GPool`;
}

function acceptedInvitationSubject(
  userName: string,
  poolName: string,
  locale: NotificationLocale,
): string {
  return locale === 'en'
    ? `${userName} accepted your invitation to ${poolName} on GPool`
    : `${userName} ha aceptado tu invitacion a ${poolName} en GPool`;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly postgres: PostgresService,
    private readonly notificationPublisher: NotificationPublisherService,
  ) {}

  private async createNotification(input: {
    userId?: string;
    recipient: string;
    subject: string;
    metadata?: Record<string, any>;
    status?: NotificationStatus;
    content?: string;
  }): Promise<string> {
    const notificationId = uuidv4();
    await this.postgres.query(
      `
        INSERT INTO notifications (
          notification_id,
          user_id,
          type,
          status,
          recipient,
          subject,
          content,
          metadata,
          created_at,
          retry_count
        )
        VALUES ($1, $2, 'email', $3, $4, $5, $6, $7::jsonb, $8, 0)
      `,
      [
        notificationId,
        input.userId || null,
        input.status || 'pending',
        input.recipient,
        input.subject,
        input.content || null,
        JSON.stringify(input.metadata || {}),
        Math.floor(Date.now() / 1000),
      ],
    );
    return notificationId;
  }

  private async markNotificationQueued(notificationId: string): Promise<void> {
    await this.postgres.query(
      `
        UPDATE notifications
        SET status = 'queued'
        WHERE notification_id = $1
      `,
      [notificationId],
    );
  }

  private async markNotificationFailed(notificationId: string, errorMessage: string): Promise<void> {
    await this.postgres.query(
      `
        UPDATE notifications
        SET
          status = 'failed',
          error_message = $2,
          retry_count = retry_count + 1
        WHERE notification_id = $1
      `,
      [notificationId, errorMessage],
    );
  }

  private async alreadyProcessedEvent(eventId: string): Promise<boolean> {
    const result = await this.postgres.query<{ notificationId: string }>(
      `
        SELECT notification_id AS "notificationId"
        FROM notifications
        WHERE metadata->>'eventId' = $1
        LIMIT 1
      `,
      [eventId],
    );
    return result.rows.length > 0;
  }

  private async markNotificationSkipped(notificationId: string, reason: string): Promise<void> {
    await this.postgres.query(
      `
        UPDATE notifications
        SET status = 'skipped', error_message = $2
        WHERE notification_id = $1
      `,
      [notificationId, reason],
    );
  }

  private async publishNotification(
    notificationId: string,
    event: NotificationEventEnvelope,
  ): Promise<void> {
    try {
      await this.notificationPublisher.publishEmail(event);
      await this.markNotificationQueued(notificationId);
    } catch (error: any) {
      await this.markNotificationFailed(notificationId, error.message);
      throw error;
    }
  }

  async sendPoolInvitation(data: {
    to: string;
    poolName: string;
    poolId: string;
    inviterEmail: string;
    invitedBy?: string;
    locale?: string;
  }): Promise<void> {
    const locale = normalizeLocale(data.locale);
    const subject = invitationSubject(data.poolName, locale);
    const notificationId = await this.createNotification({
      userId: data.invitedBy,
      recipient: data.to,
      subject,
      metadata: {
        eventType: 'user_invited_to_pool',
        poolId: data.poolId,
        poolName: data.poolName,
        inviterEmail: data.inviterEmail,
        templateId: 'gpool.pool-invitation',
        locale,
      },
    });

    await this.publishNotification(notificationId, {
      messageId: notificationId,
      idempotencyKey: `gpool:pool:${data.poolId}:invite:${data.to.toLowerCase()}`,
      sourceApp: 'gpool',
      channel: 'email',
      templateId: 'gpool.pool-invitation',
      recipient: {
        email: data.to,
      },
      data: {
        poolName: data.poolName,
        poolId: data.poolId,
        locale,
        inviterEmail: data.inviterEmail,
        acceptUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pools/${data.poolId}/accept`,
        poolUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pools/${data.poolId}`,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
      },
      metadata: {
        eventType: 'user_invited_to_pool',
        invitedBy: data.invitedBy,
        poolId: data.poolId,
        locale,
      },
      requestedAt: new Date().toISOString(),
    });
  }

  async sendPoolAccessRequest(data: {
    to?: string;
    poolName: string;
    poolId: string;
    requesterEmail: string;
    requesterUserId: string;
    adminUserId: string;
    locale?: string;
  }): Promise<void> {
    const recipient = data.to || '';
    const locale = normalizeLocale(data.locale);
    const subject = accessRequestSubject(data.poolName, locale);
    const notificationId = await this.createNotification({
      userId: data.adminUserId,
      recipient,
      subject,
      metadata: {
        eventType: 'pool_access_requested',
        poolId: data.poolId,
        poolName: data.poolName,
        requesterEmail: data.requesterEmail,
        requesterUserId: data.requesterUserId,
        locale,
      },
    });

    if (!recipient) {
      await this.markNotificationSkipped(
        notificationId,
        `Admin email not available for pool ${data.poolId}`,
      );
      this.logger.warn(`Skipping pool access request email; admin email not available for pool ${data.poolId}`);
      return;
    }

    await this.publishNotification(notificationId, {
      messageId: notificationId,
      idempotencyKey: `gpool:pool:${data.poolId}:access-request:${data.requesterUserId}`,
      sourceApp: 'gpool',
      channel: 'email',
      templateId: 'gpool.pool-access-request',
      recipient: {
        email: recipient,
      },
      data: {
        poolName: data.poolName,
        poolId: data.poolId,
        locale,
        requesterEmail: data.requesterEmail,
        requesterUserId: data.requesterUserId,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
        acceptUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pools/${data.poolId}/accept-request/${data.requesterUserId}`,
        poolUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pools/${data.poolId}`,
      },
      metadata: {
        eventType: 'pool_access_requested',
        poolId: data.poolId,
        requesterUserId: data.requesterUserId,
        locale,
      },
      requestedAt: new Date().toISOString(),
    });
  }

  async sendPoolAccessGranted(data: {
    to?: string;
    poolName: string;
    poolId: string;
    userId: string;
    userName?: string;
    locale?: string;
  }): Promise<void> {
    const recipient = data.to || '';
    const locale = normalizeLocale(data.locale);
    const subject = accessGrantedSubject(data.poolName, locale);
    const notificationId = await this.createNotification({
      userId: data.userId,
      recipient,
      subject,
      metadata: {
        eventType: 'pool_access_granted',
        poolId: data.poolId,
        poolName: data.poolName,
        locale,
      },
    });

    if (!recipient) {
      await this.markNotificationSkipped(notificationId, `User email missing for ${data.userId}`);
      this.logger.warn(`Skipping pool access granted email; user email missing for ${data.userId}`);
      return;
    }

    await this.publishNotification(notificationId, {
      messageId: notificationId,
      idempotencyKey: `gpool:pool:${data.poolId}:access-granted:${data.userId}`,
      sourceApp: 'gpool',
      channel: 'email',
      templateId: 'gpool.pool-access-granted',
      recipient: {
        email: recipient,
      },
      data: {
        poolName: data.poolName,
        poolId: data.poolId,
        locale,
        userName: data.userName || 'there',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
        poolUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pools/${data.poolId}`,
      },
      metadata: {
        eventType: 'pool_access_granted',
        poolId: data.poolId,
        userId: data.userId,
        locale,
      },
      requestedAt: new Date().toISOString(),
    });
  }

  async sendUserAcceptedInvitation(data: {
    to?: string;
    poolName: string;
    poolId: string;
    userId: string;
    userName: string;
    userEmail: string;
    adminUserId: string;
    eventId?: string;
    locale?: string;
  }): Promise<void> {
    const recipient = data.to || '';
    const locale = normalizeLocale(data.locale);

    if (data.eventId && (await this.alreadyProcessedEvent(data.eventId))) {
      this.logger.log(`Skipping duplicate invitation-accepted notification for event ${data.eventId}`);
      return;
    }

    const subject = acceptedInvitationSubject(data.userName, data.poolName, locale);
    const notificationId = await this.createNotification({
      userId: data.adminUserId,
      recipient,
      subject,
      metadata: {
        eventId: data.eventId,
        eventType: 'user_accepted_pool_invitation',
        poolId: data.poolId,
        poolName: data.poolName,
        userId: data.userId,
        userEmail: data.userEmail,
        locale,
      },
    });

    if (!recipient) {
      await this.markNotificationSkipped(
        notificationId,
        `Admin email missing for pool ${data.poolId}`,
      );
      this.logger.warn(`Skipping user-accepted-invitation email; admin email missing for pool ${data.poolId}`);
      return;
    }

    await this.publishNotification(notificationId, {
      messageId: notificationId,
      idempotencyKey: data.eventId || `gpool:pool:${data.poolId}:accepted:${data.userId}`,
      sourceApp: 'gpool',
      channel: 'email',
      templateId: 'gpool.user-accepted-invitation',
      recipient: {
        email: recipient,
      },
      data: {
        poolName: data.poolName,
        poolId: data.poolId,
        locale,
        userName: data.userName,
        userEmail: data.userEmail,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
        poolUrl: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/pools/${data.poolId}`,
      },
      metadata: {
        eventId: data.eventId,
        eventType: 'user_accepted_pool_invitation',
        poolId: data.poolId,
        userId: data.userId,
        locale,
      },
      requestedAt: new Date().toISOString(),
    });
  }
}
