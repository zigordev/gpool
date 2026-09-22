import { recordHealth } from './health-metrics';

export type ComponentStatus = 'down' | 'unknown' | 'up';
export type ComponentName = 'tolgee';

export interface HealthBody {
  readonly status: 'degraded' | 'ok';
  readonly service: string;
  readonly release: string;
  readonly components: Record<ComponentName, { readonly status: ComponentStatus }>;
}

const STATE = Symbol.for('gpool-web.observability.health');

const shared = globalThis as typeof globalThis & {
  [STATE]?: Record<ComponentName, ComponentStatus>;
};

const state = (shared[STATE] ??= { tolgee: 'unknown' });

export function reportComponent(name: ComponentName, status: ComponentStatus): void {
  state[name] = status;
}

export function health(): HealthBody {
  const components = { tolgee: { status: state.tolgee } };
  const status = Object.values(components).some((component) => component.status === 'down')
    ? ('degraded' as const)
    : ('ok' as const);
  recordHealth(status, components);

  return {
    status,
    service: process.env.OTEL_SERVICE_NAME?.trim() || 'gpool-web',
    release: process.env.NEXT_PUBLIC_RELEASE ?? 'dev',
    components,
  };
}
