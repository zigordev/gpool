import { describe, expect, it } from 'vitest';
import { registry } from '../observability';
import {
  countNotification,
  countPoolAction,
  countPrediction,
  NOTIFICATION_OUTCOMES,
  NOTIFICATION_TEMPLATES,
  POOL_ACTIONS,
  PREDICTION_ACTIONS,
  startDomainMetricsAtZero,
} from './domain-metrics';

describe('gpool domain metrics', () => {
  it('exist at zero for every action, template and outcome before the first one happens', async () => {
    startDomainMetricsAtZero();
    const text = await registry.metrics();

    for (const action of POOL_ACTIONS) {
      expect(text).toContain(`gpool_pool_actions_total{action="${action}"} 0`);
    }
    for (const action of PREDICTION_ACTIONS) {
      expect(text).toContain(`gpool_predictions_total{action="${action}"} 0`);
    }
    for (const template of NOTIFICATION_TEMPLATES) {
      for (const outcome of NOTIFICATION_OUTCOMES) {
        expect(text).toContain(
          `gpool_notifications_total{template="${template}",outcome="${outcome}"} 0`
        );
      }
    }
  });

  it('counts each action on top of the zero', async () => {
    startDomainMetricsAtZero();
    countPoolAction('created');
    countPrediction('submitted');
    countPrediction('submitted');
    countNotification('gpool.pool-invitation', 'queued');
    const text = await registry.metrics();

    expect(text).toContain('gpool_pool_actions_total{action="created"} 1');
    expect(text).toContain('gpool_predictions_total{action="submitted"} 2');
    expect(text).toContain(
      'gpool_notifications_total{template="gpool.pool-invitation",outcome="queued"} 1'
    );
  });
});
