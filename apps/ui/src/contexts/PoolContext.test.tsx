import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const navigation = vi.hoisted(() => ({ poolId: 'pool-a', pathname: '/pools/pool-a' }));
vi.mock('next/navigation', () => ({
  useParams: () => ({ poolId: navigation.poolId }),
  usePathname: () => navigation.pathname,
}));

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('@/lib/api', () => ({ apiClient: api }));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { userId: 'u1', email: 'ada@example.com', role: 'user', locale: 'es' } }),
}));
vi.mock('@/i18n/client', () => ({
  useI18n: () => ({ locale: 'es', messages: {}, t: (key: string) => key }),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

import { PoolProvider, usePoolContext } from './PoolContext';

const pool = (id: string) => ({ id, name: `Pool ${id}`, config: {} });

const respond = (path: string): Promise<{ data: unknown }> => {
  if (path === '/pools/pool-a') return Promise.resolve({ data: pool('pool-a') });
  if (path === '/pools/pool-b') return new Promise(() => {});
  if (path.endsWith('/matches/predictions')) return Promise.resolve({ data: [{ matchId: 'm1', homeScore: 1, awayScore: 0 }] });
  if (path.endsWith('/bracket') || path.endsWith('/bracket/predictions')) return Promise.resolve({ data: {} });
  return Promise.resolve({ data: [] });
};

function Probe() {
  const { pool: current, predictions, loading } = usePoolContext();
  return (
    <div>
      <span data-testid="pool">{current?.id ?? 'none'}</span>
      <span data-testid="predictions">{Object.keys(predictions).length}</span>
      <span data-testid="loading">{String(loading)}</span>
    </div>
  );
}

describe('PoolProvider', () => {
  beforeEach(() => {
    navigation.poolId = 'pool-a';
    navigation.pathname = '/pools/pool-a';
    api.get.mockReset();
    api.get.mockImplementation(respond);
  });

  afterEach(cleanup);

  it('loads the pool named in the route', async () => {
    render(<PoolProvider><Probe /></PoolProvider>);

    await waitFor(() => expect(screen.getByTestId('pool').textContent).toBe('pool-a'));
    expect(api.get).toHaveBeenCalledWith('/pools/pool-a');
  });

  it('drops every pool-scoped field the moment the route names another pool, before that pool has loaded', async () => {
    const view = render(<PoolProvider><Probe /></PoolProvider>);
    await waitFor(() => expect(screen.getByTestId('pool').textContent).toBe('pool-a'));

    navigation.poolId = 'pool-b';
    navigation.pathname = '/pools/pool-b';
    view.rerender(<PoolProvider><Probe /></PoolProvider>);

    expect(screen.getByTestId('pool').textContent).toBe('none');
    expect(screen.getByTestId('predictions').textContent).toBe('0');
    expect(api.get).toHaveBeenCalledWith('/pools/pool-b');
  });
});
