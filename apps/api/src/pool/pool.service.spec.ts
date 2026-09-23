import { Logger } from '@nestjs/common';
import { vi } from 'vitest';
import { startDomainMetricsAtZero } from '../metrics/domain-metrics';
import type { NotificationService } from '../notification/notification.service';
import { registry } from '../observability';
import type { PoolRepository } from './database/pool.repository';
import { PoolService } from './pool.service';

const pool = {
  poolId: 'p1',
  name: 'World Cup 2026',
  adminUserId: 'admin-1',
  adminEmail: 'admin@example.com',
};

type Membership = { poolId: string; userId: string; role: string } | null;

function buildService(memberships: readonly Membership[]) {
  const getMembership = vi.fn();
  for (const membership of memberships) getMembership.mockResolvedValueOnce(membership);

  const repository = {
    getPool: vi.fn().mockResolvedValue(pool),
    getMembership,
    addMember: vi.fn().mockResolvedValue(undefined),
    getUser: vi.fn().mockResolvedValue({ locale: 'es' }),
  };
  const notificationService = {
    sendUserAcceptedInvitation: vi.fn().mockResolvedValue(undefined),
  };

  return {
    repository,
    notificationService,
    service: new PoolService(
      repository as unknown as PoolRepository,
      notificationService as unknown as NotificationService
    ),
  };
}

async function actionCount(action: string): Promise<number> {
  const text = await registry.metrics();
  const prefix = `gpool_pool_actions_total{action="${action}"} `;
  const line = text.split('\n').find((candidate) => candidate.startsWith(prefix));
  return line ? Number(line.slice(prefix.length)) : Number.NaN;
}

describe('PoolService.acceptInvitation', () => {
  beforeAll(() => {
    startDomainMetricsAtZero();
  });

  it('counts a re-clicked invitation under its own action, never as another acceptance', async () => {
    const before = {
      alreadyMember: await actionCount('invitation_already_member'),
      accepted: await actionCount('invitation_accepted'),
    };
    const { service, repository, notificationService } = buildService([
      { poolId: 'p1', userId: 'u1', role: 'member' },
    ]);

    const result = await service.acceptInvitation('p1', 'u1', 'ada@example.com', 'Ada');

    expect(result).toEqual({ success: true, message: 'You are already a member of this pool' });
    expect(repository.addMember).not.toHaveBeenCalled();
    expect(notificationService.sendUserAcceptedInvitation).not.toHaveBeenCalled();
    expect(await actionCount('invitation_already_member')).toBe(before.alreadyMember + 1);
    expect(await actionCount('invitation_accepted')).toBe(before.accepted);
  });

  it('logs the re-click at info, where Loki can still see it', async () => {
    const info = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const debug = vi.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    const { service } = buildService([{ poolId: 'p1', userId: 'u1', role: 'member' }]);

    await service.acceptInvitation('p1', 'u1');

    expect(info).toHaveBeenCalledWith({
      event: 'pool.invitation_already_member',
      poolId: 'p1',
      userId: 'u1',
    });
    expect(debug).not.toHaveBeenCalled();

    info.mockRestore();
    debug.mockRestore();
  });

  it('still counts a first acceptance as an acceptance', async () => {
    const before = {
      alreadyMember: await actionCount('invitation_already_member'),
      accepted: await actionCount('invitation_accepted'),
    };
    const { service, repository, notificationService } = buildService([
      null,
      { poolId: 'p1', userId: 'u2', role: 'member' },
    ]);

    const result = await service.acceptInvitation('p1', 'u2', 'grace@example.com', 'Grace');

    expect(result).toEqual({ success: true, message: 'You have successfully joined the pool' });
    expect(repository.addMember).toHaveBeenCalledOnce();
    expect(notificationService.sendUserAcceptedInvitation).toHaveBeenCalledOnce();
    expect(await actionCount('invitation_accepted')).toBe(before.accepted + 1);
    expect(await actionCount('invitation_already_member')).toBe(before.alreadyMember);
  });
});
