import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATE = Symbol.for('gpool.observability.app-metrics');

async function graph() {
  vi.resetModules();
  const metrics = await import('./app-metrics');
  const { registry } = await import('./metrics.registry');
  return { ...metrics, registry };
}

describe('app metrics', () => {
  beforeEach(() => {
    delete (globalThis as Record<symbol, unknown>)[STATE];
  });

  it('reports every message source from the first scrape, so increase() sees the first load', async () => {
    const text = await (await graph()).registry.metrics();

    for (const source of ['merged', 'remote', 'local', 'default_locale']) {
      expect(text).toContain(`gpool_i18n_messages_total{source="${source}"} 0`);
    }
  });

  it('reaches /metrics from whichever module graph recorded the load', async () => {
    const page = await graph();
    page.recordMessageSource('local');

    expect(await (await graph()).registry.metrics()).toContain(
      'gpool_i18n_messages_total{source="local"} 1'
    );
  });

  it('counts repeated loads of the same source', async () => {
    const metrics = await graph();
    metrics.recordMessageSource('remote');
    metrics.recordMessageSource('remote');

    expect(await metrics.registry.metrics()).toContain(
      'gpool_i18n_messages_total{source="remote"} 2'
    );
  });
});
