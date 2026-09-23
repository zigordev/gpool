import { Counter } from 'prom-client';
import { registry, startAtZero } from '../observability';

export const POOL_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'joined',
  'access_requested',
  'access_granted',
  'invitation_sent',
  'invitation_accepted',
  'invitation_already_member',
  'configured',
] as const;
export type PoolAction = (typeof POOL_ACTIONS)[number];

export const PREDICTION_ACTIONS = ['submitted', 'cleared'] as const;
export type PredictionAction = (typeof PREDICTION_ACTIONS)[number];

export const NOTIFICATION_TEMPLATES = [
  'gpool.pool-invitation',
  'gpool.pool-access-request',
  'gpool.pool-access-granted',
  'gpool.user-accepted-invitation',
] as const;
export const NOTIFICATION_OUTCOMES = ['queued', 'skipped', 'failed'] as const;
export type NotificationOutcome = (typeof NOTIFICATION_OUTCOMES)[number];

const poolActions = new Counter({
  name: 'gpool_pool_actions_total',
  help: 'Actions on pools, by action',
  labelNames: ['action'] as const,
  registers: [registry],
});

const predictions = new Counter({
  name: 'gpool_predictions_total',
  help: 'Predictions submitted or cleared',
  labelNames: ['action'] as const,
  registers: [registry],
});

const notifications = new Counter({
  name: 'gpool_notifications_total',
  help: 'Emails gpool asked notifications to send, by template and outcome',
  labelNames: ['template', 'outcome'] as const,
  registers: [registry],
});

export function startDomainMetricsAtZero(): void {
  startAtZero(
    poolActions,
    POOL_ACTIONS.map((action) => ({ action }))
  );
  startAtZero(
    predictions,
    PREDICTION_ACTIONS.map((action) => ({ action }))
  );
  startAtZero(
    notifications,
    NOTIFICATION_TEMPLATES.flatMap((template) =>
      NOTIFICATION_OUTCOMES.map((outcome) => ({ template, outcome }))
    )
  );
}

export function countPoolAction(action: PoolAction): void {
  poolActions.inc({ action });
}

export function countPrediction(action: PredictionAction): void {
  predictions.inc({ action });
}

export function countNotification(template: string, outcome: NotificationOutcome): void {
  notifications.inc({ template, outcome });
}
