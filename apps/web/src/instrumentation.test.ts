import assert from 'node:assert/strict';
import { beforeAll, test, vi } from 'vitest';

const openMetricsSample = (metric: string): string => `${metric}_total`;

vi.mock('@/observability/tracing', () => ({ shutdownTelemetry: async () => undefined }));
vi.mock('@/observability/standard-events', () => ({
  logServiceStarted: () => undefined,
  logServiceStopping: () => undefined,
  observeProcessFailures: () => undefined,
}));

beforeAll(async () => {
  process.env.NEXT_RUNTIME = 'nodejs';
  const { register } = await import('@/instrumentation');
  await register();
});

test('booting the server declares every gpool interaction before a beacon arrives', async () => {
  const { registry } = await import('@/observability/metrics.registry');
  const { RUM_CUSTOM_INTERACTIONS } = await import('@/observability/rum-vocabulary');
  const text = await registry.getSingleMetricAsString('rum_interactions_total');

  for (const name of RUM_CUSTOM_INTERACTIONS) {
    assert.match(
      text,
      new RegExp(
        `${openMetricsSample('rum_interactions_total')}\\{interaction_type="${name}",page="/",release="unknown"\\} 0`
      ),
      name
    );
  }
});

test('booting the server narrows the page label to the declared routes', async () => {
  const { pageLabel } = await import('@/observability/rum-metrics');

  assert.equal(pageLabel('/pools/8e1f9c2a-0000-4000-8000-000000000000'), '/pools/:id');
  assert.equal(pageLabel('/not-a-route'), 'other');
});
