import { createHmac } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { vi } from 'vitest';
import { PoolController } from './pool.controller';
import { PoolService } from './pool.service';

const SECRET = 'test-session-secret';

const poolService = { listPools: vi.fn() };

const signedHeaders = (overrides: Partial<Record<string, string>> = {}, secret = SECRET) => {
  const fields = {
    'x-auth-user-id': 'u1',
    'x-auth-user-email': 'ada@example.com',
    'x-auth-user-role': 'user',
    'x-auth-user-name': 'Ada',
    'x-auth-user-locale': 'es',
    'x-auth-user-exp': String(Math.floor(Date.now() / 1000) + 600),
    ...overrides,
  };
  const payload = [
    fields['x-auth-user-id'],
    fields['x-auth-user-email'],
    fields['x-auth-user-role'],
    fields['x-auth-user-name'],
    fields['x-auth-user-locale'],
    fields['x-auth-user-exp'],
  ].join('\n');
  return {
    ...fields,
    'x-auth-signature': createHmac('sha256', secret).update(payload).digest('base64url'),
  };
};

describe('PoolController over HTTP', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PoolController],
      providers: [
        { provide: PoolService, useValue: poolService },
        { provide: ConfigService, useValue: { get: () => SECRET } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    poolService.listPools.mockReset().mockResolvedValue([]);
  });

  it('refuses a request with no session headers', async () => {
    const response = await fetch(`${baseUrl}/pools`);

    expect(response.status).toBe(401);
    expect(poolService.listPools).not.toHaveBeenCalled();
  });

  it('refuses headers signed with the wrong secret', async () => {
    const response = await fetch(`${baseUrl}/pools`, { headers: signedHeaders({}, 'not-the-secret') });

    expect(response.status).toBe(403);
    expect(poolService.listPools).not.toHaveBeenCalled();
  });

  it('refuses a session whose expiry has passed, even when correctly signed', async () => {
    const response = await fetch(`${baseUrl}/pools`, {
      headers: signedHeaders({ 'x-auth-user-exp': String(Math.floor(Date.now() / 1000) - 1) }),
    });

    expect(response.status).toBe(401);
  });

  it('refuses a role that is not one the app knows', async () => {
    const response = await fetch(`${baseUrl}/pools`, { headers: signedHeaders({ 'x-auth-user-role': 'superuser' }) });

    expect(response.status).toBe(401);
  });

  it('derives the user from the signed headers and hands only that to the service', async () => {
    const response = await fetch(`${baseUrl}/pools`, { headers: signedHeaders() });

    expect(response.status).toBe(200);
    expect(poolService.listPools).toHaveBeenCalledWith({ userId: 'u1' });
  });
});
