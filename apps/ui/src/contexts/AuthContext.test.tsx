import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, useAuth } from './AuthContext';

const fetchMock = vi.fn<typeof fetch>();

const session = (payload: unknown, ok = true) =>
  ({ ok, json: async () => payload }) as unknown as Response;

function Probe() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  return (
    <div>
      <span data-testid="state">{loading ? 'loading' : isAuthenticated ? 'in' : 'out'}</span>
      <span data-testid="email">{user?.email ?? ''}</span>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

const mount = () => render(<AuthProvider><Probe /></AuthProvider>);

describe('AuthProvider', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('turns a valid session into the signed-in user', async () => {
    fetchMock.mockResolvedValue(
      session({ authenticated: true, user: { userId: 'u1', email: 'ada@example.com', role: 'user', locale: 'es' } }),
    );
    mount();

    expect(screen.getByTestId('state').textContent).toBe('loading');
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('in'));
    expect(screen.getByTestId('email').textContent).toBe('ada@example.com');
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/session', expect.objectContaining({ method: 'GET', cache: 'no-store' }));
  });

  it('treats a rejected session and a failed request alike: signed out, not stuck loading', async () => {
    fetchMock.mockResolvedValue(session({ error: 'expired' }, false));
    mount();
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('out'));
    cleanup();

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    fetchMock.mockRejectedValue(new Error('network down'));
    mount();
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('out'));
    consoleError.mockRestore();
  });

  it('logging out deletes the server session before forgetting the user', async () => {
    fetchMock.mockResolvedValueOnce(
      session({ authenticated: true, user: { userId: 'u1', email: 'ada@example.com', role: 'user', locale: 'es' } }),
    );
    fetchMock.mockResolvedValueOnce(session({}, true));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mount();
    await waitFor(() => expect(screen.getByTestId('state').textContent).toBe('in'));

    await act(async () => {
      fireEvent.click(screen.getByText('logout'));
    });

    expect(fetchMock).toHaveBeenLastCalledWith('/api/auth/session', expect.objectContaining({ method: 'DELETE' }));
    expect(screen.getByTestId('state').textContent).toBe('out');
    consoleError.mockRestore();
  });
});
