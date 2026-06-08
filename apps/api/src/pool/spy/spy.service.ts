import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { hasPermission } from '../../common/guards/roles.guard';
import { PoolRepository } from '../database/pool.repository';
import {
  isSelectionWithinLimits,
  resolvePlayerSelectionLimits,
} from '../player/player-selection-limits';
import {
  computePlayerAwardPoints,
  computePlayerPoints,
  resolvePlayerAwardWinners,
  resolvePlayerScoring,
} from '../player/player.service';

@Injectable()
export class SpyService {
  constructor(private readonly poolRepository: PoolRepository) {}

  /**
   * Read-only view of another pool member's picks. The requester must be a
   * member of the pool (or an admin), and the target user must also belong
   * to the pool. We never expose any mutating affordance here — this is for
   * peeking only.
   */
  async getMemberPicks(
    poolId: string,
    requesterUserId: string,
    requesterRole: string,
    targetUserId: string,
  ) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }

    // Admins always see everything; non-admins must be a member of the pool.
    if (!hasPermission(requesterRole || 'user', 'admin')) {
      const requesterMembership = await this.poolRepository.getMembership(poolId, requesterUserId);
      if (!requesterMembership) {
        throw new ForbiddenException('You must be a member of this pool to view other members\' picks');
      }
    }

    const targetMembership = await this.poolRepository.getMembership(poolId, targetUserId);
    if (!targetMembership) {
      throw new NotFoundException('Target user is not a member of this pool');
    }

    const [predictions, bracketPredictions, playerSelections, playerAwardSelections, tournamentAwards] = await Promise.all([
      this.poolRepository.getUserPredictions(poolId, targetUserId),
      this.poolRepository.getUserBracketPredictions(poolId, targetUserId),
      this.poolRepository.getPlayerSelections(poolId, targetUserId),
      this.poolRepository.getPlayerAwardSelections(poolId, targetUserId),
      this.poolRepository.getTournamentPlayerAwards(),
    ]);
    const limits = resolvePlayerSelectionLimits(pool.config?.playerSelectionLimits);
    const scoring = resolvePlayerScoring(pool);
    const awardWinners = resolvePlayerAwardWinners(pool, [], tournamentAwards);

    return {
      user: {
        userId: targetMembership.userId,
        userName: targetMembership.userName,
        userEmail: targetMembership.userEmail,
      },
      predictions,
      bracketPredictions,
      playerSelections: playerSelections
        .filter((selection: any) => isSelectionWithinLimits(selection, limits))
        .map((selection: any) => ({
          ...selection,
          totalPoints: computePlayerPoints(selection, scoring),
        })),
      playerAwardSelections: playerAwardSelections.map((selection: any) => ({
        ...selection,
        awardPoints: computePlayerAwardPoints(selection, awardWinners, scoring),
      })),
    };
  }
}
