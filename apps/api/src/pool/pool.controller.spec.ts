import type { AddressInfo } from 'node:net';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import { vi } from 'vitest';
import { PoolController } from './pool.controller';
import { PoolService } from './pool.service';

const poolService = { listPools: vi.fn() };

let authenticatedUser: Record<string, unknown> | null = null;

const forgedHeaders = {
  'x-auth-user-id': 'u1',
  'x-auth-user-email': 'ada@example.com',
  'x-auth-user-role': 'admin',
  'x-auth-user-name': 'Ada',
  'x-auth-user-locale': 'es',
  'x-auth-user-exp': String(Math.floor(Date.now() / 1000) + 600),
  'x-auth-signature': 'anything-at-all',
};

describe('PoolController over HTTP', () => {
  let app: INestApplication;
  let baseUrl: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PoolController],
      providers: [{ provide: PoolService, useValue: poolService }],
    }).compile();

    app = moduleRef.createNestApplication();

    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = authenticatedUser ?? undefined;
      req.isAuthenticated = (() => authenticatedUser !== null) as typeof req.isAuthenticated;
      next();
    });

    await app.listen(0);
    const { port } = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    authenticatedUser = null;
    poolService.listPools.mockReset().mockResolvedValue([]);
  });

  it('refuses a request carrying no session', async () => {
    const response = await fetch(`${baseUrl}/pools`);

    expect(response.status).toBe(401);
    expect(poolService.listPools).not.toHaveBeenCalled();
  });

  it('ignores the request headers the old signed-header scheme trusted', async () => {
    const response = await fetch(`${baseUrl}/pools`, { headers: forgedHeaders });

    expect(response.status).toBe(401);
    expect(poolService.listPools).not.toHaveBeenCalled();
  });

  it('derives the user from the session and hands only that to the service', async () => {
    authenticatedUser = {
      userId: 'u1',
      email: 'ada@example.com',
      role: 'user',
      name: 'Ada',
      locale: 'es',
    };

    const response = await fetch(`${baseUrl}/pools`, { headers: forgedHeaders });

    expect(response.status).toBe(200);
    expect(poolService.listPools).toHaveBeenCalledWith({ userId: 'u1' });
  });
});
