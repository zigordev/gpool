const DEFAULT_POOL_DEADLINE_MS = new Date('2026-06-08T00:00:00Z').getTime();

interface PoolWithConfig {
  config?: { deadline?: number | string | null } & Record<string, unknown>;
}

/**
 * Resolve the prediction deadline for a pool, in epoch milliseconds.
 * Falls back to DEFAULT_POOL_DEADLINE_MS if the pool has no deadline set
 * or the stored value isn't parseable as a number.
 */
export function resolvePoolDeadline(pool: PoolWithConfig | null | undefined): number {
  const raw = pool?.config?.deadline;
  if (raw == null) return DEFAULT_POOL_DEADLINE_MS;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POOL_DEADLINE_MS;
}
