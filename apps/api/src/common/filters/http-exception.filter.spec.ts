import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

function hostFor(request: Record<string, unknown>) {
  const response = { status: vi.fn(), type: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  response.type.mockReturnValue(response);
  const host = {
    switchToHttp: () => ({ getResponse: () => response, getRequest: () => request }),
  } as unknown as ArgumentsHost;
  return { host, response };
}

const lines = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.map(([line]) => JSON.parse(String(line)) as Record<string, unknown>);

describe('HttpExceptionFilter', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs a failure it answered with a 5xx as request.failed, with the route and the cause', () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { host, response } = hostFor({
      method: 'POST',
      url: '/pools/42/invite?x=1',
      route: { path: '/pools/:id/invite' },
    });

    new HttpExceptionFilter().catch(new TypeError('boom'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(lines(stderr)).toEqual([
      expect.objectContaining({
        level: 'error',
        event: 'request.failed',
        method: 'POST',
        route: '/pools/:id/invite',
        status: 500,
        error: { name: 'TypeError', message: 'boom' },
      }),
    ]);
  });

  it('labels a failure outside any route as unmatched', () => {
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { host } = hostFor({ method: 'GET', url: '/nowhere' });

    new HttpExceptionFilter().catch(new InternalServerErrorException(), host);

    expect(lines(stderr)[0]).toEqual(expect.objectContaining({ route: 'unmatched', status: 500 }));
  });

  it('logs nothing for a client error, which the request metrics already count', () => {
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    const { host, response } = hostFor({
      method: 'GET',
      url: '/pools/x',
      route: { path: '/pools/:id' },
    });

    new HttpExceptionFilter().catch(new BadRequestException('nope'), host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).not.toHaveBeenCalled();
  });
});
