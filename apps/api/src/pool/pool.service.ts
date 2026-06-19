import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { hasPermission } from '../common/guards/roles.guard';
import { NotificationService } from '../notification/notification.service';
import { CreatePoolDto } from './dto/create-pool.dto';
import { PoolRepository } from './database/pool.repository';
import { UpdatePoolDto } from './dto/update-pool.dto';
import {
  MAX_PLAYER_SELECTION_LIMIT,
  PLAYER_SELECTION_POSITIONS,
  resolvePlayerSelectionLimits,
} from './player/player-selection-limits';
import { validatePrizeDistribution } from './prize-distribution';

const DEFAULT_LOCALE = 'es';

function normalizeLocale(value: string | null | undefined): 'es' | 'en' {
  return value?.trim().toLowerCase().split(/[-_]/)[0] === 'en' ? 'en' : DEFAULT_LOCALE;
}

@Injectable()
export class PoolService {
  private readonly logger = new Logger(PoolService.name);

  constructor(
    private readonly poolRepository: PoolRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async createPool(
    createPoolDto: CreatePoolDto,
    adminUserId: string,
    userRole: string,
    adminName?: string,
    adminEmail?: string,
  ) {
    if (!hasPermission(userRole, 'admin')) {
      throw new ForbiddenException('Only administrators can create pools');
    }

    validatePrizeDistribution(
      createPoolDto.config?.entryFee ?? 0,
      1,
      createPoolDto.config?.prizeDistribution,
    );

    const poolId = uuidv4();
    const pool = await this.poolRepository.createPool({
      poolId,
      adminUserId,
      adminName: adminName || 'Pool Administrator',
      adminEmail: adminEmail || '',
      name: createPoolDto.name,
      description: createPoolDto.description,
      config: createPoolDto.config || {},
    });

    await this.poolRepository.addMember(poolId, adminUserId, 'admin', adminEmail, adminName);

    this.logger.log(`Pool created: ${poolId} by ${adminUserId}`);
    return pool;
  }

  async listPools(filters?: { userId?: string }) {
    const pools = await this.poolRepository.listPools();

    const userMemberships = filters?.userId
      ? await this.poolRepository.getUserPools(filters.userId)
      : [];

    const userMembershipMap = new Map(userMemberships.map((membership) => [membership.poolId, membership]));

    return Promise.all(
      pools.map(async (pool) => {
        const members = await this.poolRepository.getPoolMembers(pool.poolId);
        const userMembership = filters?.userId ? userMembershipMap.get(pool.poolId) : null;
        return {
          ...pool,
          memberCount: members.length,
          isMember: !!userMembership,
          userMembership: userMembership || null,
        };
      }),
    );
  }

  async getPool(poolId: string, userId?: string) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    const members = await this.poolRepository.getPoolMembers(poolId);
    const userMembership = userId ? await this.poolRepository.getMembership(poolId, userId) : null;

    return {
      ...pool,
      members,
      memberCount: members.length,
      userMembership,
    };
  }

  async updatePool(poolId: string, updatePoolDto: UpdatePoolDto, userId: string, userRole: string) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    await this.assertPoolMembershipAdmin(poolId, userId);

    const updates: Record<string, any> = {};
    if (updatePoolDto.name) updates.name = updatePoolDto.name;
    if (updatePoolDto.description !== undefined) updates.description = updatePoolDto.description;
    if (updatePoolDto.config) updates.config = updatePoolDto.config;

    const updatedPool = await this.poolRepository.updatePool(poolId, updates);
    this.logger.log(`Pool updated: ${poolId} by ${userId}`);
    return updatedPool;
  }

  async deletePool(poolId: string, userId: string, userRole: string) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    await this.assertPoolMembershipAdmin(poolId, userId);

    await this.poolRepository.deletePool(poolId);
    this.logger.log(`Pool deleted: ${poolId} by ${userId}`);
    return { success: true, message: 'Pool deleted successfully' };
  }

  async requestAccess(poolId: string, userId: string, userEmail?: string, userName?: string) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    const existingMembership = await this.poolRepository.getMembership(poolId, userId);
    if (existingMembership) {
      throw new BadRequestException('You are already a member of this pool');
    }

    const config = pool.config || {};
    const settings = config.settings || {};

    if (settings.isPublic) {
      await this.poolRepository.addMember(poolId, userId, 'member', userEmail, userName);
      this.logger.log(`User ${userId} joined public pool ${poolId}`);
      return { success: true, message: 'Successfully joined pool' };
    }

    const adminUser = await this.poolRepository.getUser(pool.adminUserId);
    await this.notificationService.sendPoolAccessRequest({
      to: pool.adminEmail,
      poolName: pool.name,
      poolId,
      requesterEmail: userEmail || '',
      requesterUserId: userId,
      adminUserId: pool.adminUserId,
      locale: normalizeLocale(adminUser?.locale),
    });

    this.logger.log(`Access requested to pool ${poolId} by ${userId}`);
    return {
      success: true,
      message: 'Access request submitted. Pool administrator will review your request.',
    };
  }

  async acceptAccessRequest(poolId: string, targetUserId: string, adminUserId: string, userRole: string) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    await this.assertPoolMembershipAdmin(poolId, adminUserId);

    const targetUser = await this.poolRepository.getUser(targetUserId);
    await this.poolRepository.addMember(
      poolId,
      targetUserId,
      'member',
      targetUser?.email,
      targetUser?.name,
    );

    await this.notificationService.sendPoolAccessGranted({
      to: targetUser?.email,
      poolName: pool.name,
      poolId,
      userId: targetUserId,
      userName: targetUser?.name,
      locale: normalizeLocale(targetUser?.locale),
    });

    this.logger.log(`Access granted to pool ${poolId} for user ${targetUserId} by ${adminUserId}`);
    return { success: true, message: 'Access granted successfully' };
  }

  async inviteUser(poolId: string, email: string, invitedBy: string, userRole: string, inviterEmail?: string) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    await this.assertPoolMembershipAdmin(poolId, invitedBy);

    const adminUser = await this.poolRepository.getUser(invitedBy);
    await this.notificationService.sendPoolInvitation({
      to: email,
      poolName: pool.name,
      poolId,
      inviterEmail: inviterEmail || pool.adminEmail || 'Pool Administrator',
      invitedBy,
      locale: normalizeLocale(adminUser?.locale),
    });

    this.logger.log(`User ${email} invited to pool ${poolId} by ${invitedBy}`);
    return { success: true, message: 'Invitation sent successfully' };
  }

  async acceptInvitation(poolId: string, userId: string, userEmail?: string, userName?: string) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    const existingMembership = await this.poolRepository.getMembership(poolId, userId);
    if (existingMembership) {
      this.logger.log(
        `User ${userId} attempted to accept invitation but is already a member of pool ${poolId}`,
      );
      return { success: true, message: 'You are already a member of this pool' };
    }

    await this.poolRepository.addMember(poolId, userId, 'member', userEmail, userName);
    const membership = await this.poolRepository.getMembership(poolId, userId);
    if (!membership) {
      throw new BadRequestException('Failed to add user as member');
    }

    const adminUser = await this.poolRepository.getUser(pool.adminUserId);
    await this.notificationService.sendUserAcceptedInvitation({
      to: pool.adminEmail,
      poolName: pool.name,
      poolId,
      userId,
      userName: userName || userEmail?.split('@')[0] || 'User',
      userEmail: userEmail || '',
      adminUserId: pool.adminUserId,
      eventId: `${poolId}:${userId}:accepted_invitation`,
      locale: normalizeLocale(adminUser?.locale),
    });

    this.logger.log(`User ${userId} accepted invitation and joined pool ${poolId}`);
    return { success: true, message: 'You have successfully joined the pool' };
  }

  async updatePoolConfiguration(
    poolId: string,
    newConfig: Record<string, any>,
    userId: string,
    userRole: string,
  ) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    await this.assertPoolMembershipAdmin(poolId, userId);

    if (newConfig?.entryFee !== undefined || newConfig?.prizeDistribution !== undefined) {
      const members = await this.poolRepository.getPoolMembers(poolId);
      validatePrizeDistribution(
        newConfig.entryFee ?? pool.config?.entryFee ?? 0,
        members.length,
        newConfig.prizeDistribution ?? pool.config?.prizeDistribution,
      );
    }

    if (newConfig?.playerSelectionLimits !== undefined) {
      const rawLimits = newConfig.playerSelectionLimits;
      if (!rawLimits || typeof rawLimits !== 'object' || Array.isArray(rawLimits)) {
        throw new BadRequestException('Player selection limits must be an object');
      }
      for (const position of PLAYER_SELECTION_POSITIONS) {
        const value = Number(rawLimits[position]);
        if (!Number.isInteger(value) || value < 1 || value > MAX_PLAYER_SELECTION_LIMIT) {
          throw new BadRequestException(
            `${position} selection limit must be an integer between 1 and ${MAX_PLAYER_SELECTION_LIMIT}`,
          );
        }
      }
      newConfig.playerSelectionLimits = resolvePlayerSelectionLimits(rawLimits);
    }

    const existingConfig = pool.config || {};
    const mergedConfig = { ...existingConfig, ...newConfig };
    await this.poolRepository.updatePool(poolId, { config: mergedConfig });
    if (newConfig.playerSelectionLimits) {
      await this.poolRepository.deletePlayerSelectionsAboveLimits(
        poolId,
        newConfig.playerSelectionLimits,
      );
    }

    this.logger.log(`Pool configuration updated: ${poolId} by ${userId}`);
    return { success: true, message: 'Pool configuration updated successfully' };
  }

  async isPoolAdmin(poolId: string, userId: string): Promise<boolean> {
    const membership = await this.poolRepository.getMembership(poolId, userId);
    return membership?.status === 'active' && membership?.role === 'admin';
  }

  private async assertPoolMembershipAdmin(poolId: string, userId: string): Promise<void> {
    if (!(await this.isPoolAdmin(poolId, userId))) {
      throw new ForbiddenException('Only pool membership administrators can perform this action');
    }
  }
}
