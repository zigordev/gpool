interface PoolSummary {
  poolId: string;
  name?: string;
  config?: Record<string, any>;
  memberCount?: number;
}