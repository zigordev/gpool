import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedGuard } from './authenticated.guard';

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('AuthenticatedGuard', () => {
  const guard = new AuthenticatedGuard();

  it('allows a request carrying an authenticated session', () => {
    expect(guard.canActivate(contextFor({ isAuthenticated: () => true }))).toBe(true);
  });

  it('rejects a request whose session is not authenticated', () => {
    expect(() => guard.canActivate(contextFor({ isAuthenticated: () => false }))).toThrow(
      UnauthorizedException
    );
  });

  it('rejects a request with no session support at all', () => {
    expect(() => guard.canActivate(contextFor({}))).toThrow(UnauthorizedException);
  });
});
