'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface PoolsContextValue {
  pools: Pool[];
  activePool: Pool | null;
  activePoolId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const PoolsContext = createContext<PoolsContextValue | undefined>(undefined);

/**
 * The pool list, app-wide — feeds the Sidebar's ScopeSwitcher, which sits
 * above the per-pool route tree and so can't read PoolContext (that only
 * exists inside /pools/[poolId]). Deliberately list-only: the heavy
 * per-pool payload stays in PoolContext, this just answers "which pools
 * can I switch to, and which am I in".
 */
export function PoolsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAuthenticated } = useAuth();
  const params = useParams<{ poolId?: string }>();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);

  const activePoolId = params?.poolId ?? null;

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setPools([]);
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.get('/pools');
      setPools(Array.isArray(response.data) ? response.data : []);
    } catch {
      // The switcher degrades to "no pools to switch to" — a failed list
      // must never block the rest of the chrome from rendering.
      setPools([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<PoolsContextValue>(() => ({
    pools,
    activePool: pools.find((pool) => pool.poolId === activePoolId) ?? null,
    activePoolId,
    loading,
    refresh,
  }), [pools, activePoolId, loading, refresh]);

  return <PoolsContext.Provider value={value}>{children}</PoolsContext.Provider>;
}

export function usePools(): PoolsContextValue {
  const context = useContext(PoolsContext);
  if (!context) throw new Error('usePools must be used within a PoolsProvider');
  return context;
}
