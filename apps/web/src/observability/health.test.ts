import { beforeEach, describe, expect, it } from 'vitest';

import { health, reportComponent } from './health';
import { registry } from './metrics.registry';

const componentGauge = async (name: string) => {
  const metric = await registry.getSingleMetric('service_component_up')?.get();
  return metric?.values.find((value) => value.labels.component === name)?.value;
};

describe('health', () => {
  beforeEach(() => {
    reportComponent('tolgee', 'unknown');
  });

  it('is ok while nothing has reported a failure', () => {
    const body = health();

    expect(body.status).toBe('ok');
    expect(body.service).toBe('gpool-web');
    expect(body.components).toEqual({ tolgee: { status: 'unknown' } });
  });

  it('is degraded, never an error, when Tolgee is down: the page renders from its own copy', async () => {
    reportComponent('tolgee', 'down');

    const body = health();

    expect(body.status).toBe('degraded');
    expect(await componentGauge('tolgee')).toBe(0);
  });

  it('comes back to ok when Tolgee does', async () => {
    reportComponent('tolgee', 'down');
    health();
    reportComponent('tolgee', 'up');

    expect(health().status).toBe('ok');
    expect(await componentGauge('tolgee')).toBe(1);
  });
});
