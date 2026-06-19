import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hasPermission } from '../../common/guards/roles.guard';
import { PoolRepository } from '../database/pool.repository';
import { resolvePoolDeadline } from '../pool-deadline.util';
import {
  isSelectionWithinLimits,
  PLAYER_SELECTION_POSITIONS,
  resolvePlayerSelectionLimits,
} from './player-selection-limits';

export type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
export type PlayerStatKey =
  | 'goals'
  | 'penaltyGoals'
  | 'missedPenalties'
  | 'mvps'
  | 'penaltiesSaved'
  | 'shootoutPenaltiesSaved'
  | 'shootoutGoals'
  | 'shootoutMissedPenalties'
  | 'cleanSheets'
  | 'assists'
  | 'yellowCards'
  | 'redCards';
export type PlayerAward = 'golden_boot' | 'tournament_mvp';
export type PlayerMatchType = 'group' | 'final';
export type PlayerInsightSelectionType = 'position' | 'award';

const POSITIONS: PlayerPosition[] = [...PLAYER_SELECTION_POSITIONS];
const STATS: PlayerStatKey[] = [
  'goals',
  'penaltyGoals',
  'missedPenalties',
  'mvps',
  'penaltiesSaved',
  'shootoutPenaltiesSaved',
  'shootoutGoals',
  'shootoutMissedPenalties',
  'cleanSheets',
  'assists',
  'yellowCards',
  'redCards',
];
const AWARDS: PlayerAward[] = ['golden_boot', 'tournament_mvp'];
const SYSTEM_POOL_ID = 'all-pools';

const DEFAULT_PLAYER_SCORING = {
  goal: {
    goalkeeper: 0,
    defender: 0,
    midfielder: 0,
    forward: 0,
  },
  penaltyGoal: {
    goalkeeper: 0,
    defender: 0,
    midfielder: 0,
    forward: 0,
  },
  missedPenalty: 0,
  mvp: 0,
  penaltySaved: 0,
  shootoutPenaltySaved: 0,
  shootoutGoal: 0,
  shootoutMissedPenalty: 0,
  cleanSheet: {
    goalkeeper: 0,
    defender: 0,
    midfielder: 0,
    forward: 0,
  },
  assist: {
    goalkeeper: 0,
    defender: 0,
    midfielder: 0,
    forward: 0,
  },
  yellowCard: 0,
  redCard: 0,
  award: {
    goldenBoot: 0,
    tournamentMvp: 0,
  },
};

export function resolvePlayerScoring(pool: any) {
  const configured = pool?.config?.playerScoring || {};
  const goal = configured.goal || {};
  const cleanSheet =
    configured.cleanSheet && typeof configured.cleanSheet === 'object' ? configured.cleanSheet : {};
  const legacyCleanSheet = Number(configured.cleanSheet);
  const assist =
    configured.assist && typeof configured.assist === 'object' ? configured.assist : {};
  const penaltyGoal =
    configured.penaltyGoal && typeof configured.penaltyGoal === 'object'
      ? configured.penaltyGoal
      : {};
  const legacyPenaltyGoal = Number(configured.penaltyGoal);
  return {
    goal: {
      goalkeeper: Number.isFinite(Number(goal.goalkeeper))
        ? Number(goal.goalkeeper)
        : DEFAULT_PLAYER_SCORING.goal.goalkeeper,
      defender: Number.isFinite(Number(goal.defender))
        ? Number(goal.defender)
        : DEFAULT_PLAYER_SCORING.goal.defender,
      midfielder: Number.isFinite(Number(goal.midfielder))
        ? Number(goal.midfielder)
        : DEFAULT_PLAYER_SCORING.goal.midfielder,
      forward: Number.isFinite(Number(goal.forward))
        ? Number(goal.forward)
        : DEFAULT_PLAYER_SCORING.goal.forward,
    },
    penaltyGoal: {
      goalkeeper: Number.isFinite(Number(penaltyGoal.goalkeeper))
        ? Math.max(0, Number(penaltyGoal.goalkeeper))
        : Number.isFinite(legacyPenaltyGoal)
          ? Math.max(0, legacyPenaltyGoal)
          : DEFAULT_PLAYER_SCORING.penaltyGoal.goalkeeper,
      defender: Number.isFinite(Number(penaltyGoal.defender))
        ? Math.max(0, Number(penaltyGoal.defender))
        : Number.isFinite(legacyPenaltyGoal)
          ? Math.max(0, legacyPenaltyGoal)
          : DEFAULT_PLAYER_SCORING.penaltyGoal.defender,
      midfielder: Number.isFinite(Number(penaltyGoal.midfielder))
        ? Math.max(0, Number(penaltyGoal.midfielder))
        : Number.isFinite(legacyPenaltyGoal)
          ? Math.max(0, legacyPenaltyGoal)
          : DEFAULT_PLAYER_SCORING.penaltyGoal.midfielder,
      forward: Number.isFinite(Number(penaltyGoal.forward))
        ? Math.max(0, Number(penaltyGoal.forward))
        : Number.isFinite(legacyPenaltyGoal)
          ? Math.max(0, legacyPenaltyGoal)
          : DEFAULT_PLAYER_SCORING.penaltyGoal.forward,
    },
    missedPenalty: Number.isFinite(Number(configured.missedPenalty))
      ? Number(configured.missedPenalty)
      : DEFAULT_PLAYER_SCORING.missedPenalty,
    mvp: Number.isFinite(Number(configured.mvp))
      ? Number(configured.mvp)
      : DEFAULT_PLAYER_SCORING.mvp,
    penaltySaved: Number.isFinite(Number(configured.penaltySaved))
      ? Number(configured.penaltySaved)
      : DEFAULT_PLAYER_SCORING.penaltySaved,
    shootoutPenaltySaved: Number.isFinite(Number(configured.shootoutPenaltySaved))
      ? Math.max(0, Number(configured.shootoutPenaltySaved))
      : DEFAULT_PLAYER_SCORING.shootoutPenaltySaved,
    shootoutGoal: Number.isFinite(Number(configured.shootoutGoal))
      ? Math.max(0, Number(configured.shootoutGoal))
      : DEFAULT_PLAYER_SCORING.shootoutGoal,
    shootoutMissedPenalty: Number.isFinite(Number(configured.shootoutMissedPenalty))
      ? Number(configured.shootoutMissedPenalty)
      : DEFAULT_PLAYER_SCORING.shootoutMissedPenalty,
    cleanSheet: {
      goalkeeper: Number.isFinite(Number(cleanSheet.goalkeeper))
        ? Math.max(0, Number(cleanSheet.goalkeeper))
        : Number.isFinite(legacyCleanSheet)
          ? Math.max(0, legacyCleanSheet)
          : DEFAULT_PLAYER_SCORING.cleanSheet.goalkeeper,
      defender: Number.isFinite(Number(cleanSheet.defender))
        ? Math.max(0, Number(cleanSheet.defender))
        : DEFAULT_PLAYER_SCORING.cleanSheet.defender,
      midfielder: Number.isFinite(Number(cleanSheet.midfielder))
        ? Math.max(0, Number(cleanSheet.midfielder))
        : DEFAULT_PLAYER_SCORING.cleanSheet.midfielder,
      forward: Number.isFinite(Number(cleanSheet.forward))
        ? Math.max(0, Number(cleanSheet.forward))
        : DEFAULT_PLAYER_SCORING.cleanSheet.forward,
    },
    assist: {
      goalkeeper: Number.isFinite(Number(assist.goalkeeper))
        ? Math.max(0, Number(assist.goalkeeper))
        : DEFAULT_PLAYER_SCORING.assist.goalkeeper,
      defender: Number.isFinite(Number(assist.defender))
        ? Math.max(0, Number(assist.defender))
        : DEFAULT_PLAYER_SCORING.assist.defender,
      midfielder: Number.isFinite(Number(assist.midfielder))
        ? Math.max(0, Number(assist.midfielder))
        : DEFAULT_PLAYER_SCORING.assist.midfielder,
      forward: Number.isFinite(Number(assist.forward))
        ? Math.max(0, Number(assist.forward))
        : DEFAULT_PLAYER_SCORING.assist.forward,
    },
    yellowCard: Number.isFinite(Number(configured.yellowCard))
      ? Number(configured.yellowCard)
      : DEFAULT_PLAYER_SCORING.yellowCard,
    redCard: Number.isFinite(Number(configured.redCard))
      ? Number(configured.redCard)
      : DEFAULT_PLAYER_SCORING.redCard,
    award: {
      goldenBoot: Number.isFinite(Number(configured.award?.goldenBoot))
        ? Math.max(0, Number(configured.award.goldenBoot))
        : DEFAULT_PLAYER_SCORING.award.goldenBoot,
      tournamentMvp: Number.isFinite(Number(configured.award?.tournamentMvp))
        ? Math.max(0, Number(configured.award.tournamentMvp))
        : DEFAULT_PLAYER_SCORING.award.tournamentMvp,
    },
  };
}

export function computePlayerPoints(player: any, scoring: ReturnType<typeof resolvePlayerScoring>) {
  const position = POSITIONS.includes(player.position) ? player.position : 'forward';
  const cleanSheetPoints = (player.cleanSheets || 0) * scoring.cleanSheet[position];
  const assistPoints = (player.assists || 0) * scoring.assist[position];
  const cardPoints =
    (player.yellowCards || 0) * scoring.yellowCard + (player.redCards || 0) * scoring.redCard;
  return (
    (player.goals || 0) * scoring.goal[position] +
    (player.penaltyGoals || 0) * scoring.penaltyGoal[position] +
    (player.missedPenalties || 0) * scoring.missedPenalty +
    (player.mvps || 0) * scoring.mvp +
    (player.penaltiesSaved || 0) * scoring.penaltySaved +
    (player.shootoutPenaltiesSaved || 0) * scoring.shootoutPenaltySaved +
    (player.shootoutGoals || 0) * scoring.shootoutGoal +
    (player.shootoutMissedPenalties || 0) * scoring.shootoutMissedPenalty +
    cleanSheetPoints +
    assistPoints +
    cardPoints
  );
}

export function resolvePlayerAwardWinners(pool: any, players: any[], tournamentAwards?: any[]) {
  if (tournamentAwards) {
    return {
      goldenBoot: new Set(
        tournamentAwards
          .filter((result) => result.award === 'golden_boot')
          .map((result) => result.playerId)
      ),
      tournamentMvp: new Set(
        tournamentAwards
          .filter((result) => result.award === 'tournament_mvp')
          .map((result) => result.playerId)
      ),
    };
  }
  const configured = pool?.config?.playerAwardWinners || {};
  const configuredGoldenBootIds = Array.isArray(configured.goldenBootPlayerIds)
    ? configured.goldenBootPlayerIds.filter(
        (id: unknown) => typeof id === 'string' && id.trim().length > 0
      )
    : [];
  const configuredTournamentMvpId =
    typeof configured.tournamentMvpPlayerId === 'string' &&
    configured.tournamentMvpPlayerId.trim().length > 0
      ? configured.tournamentMvpPlayerId
      : '';
  const maxGoals = Math.max(0, ...players.map((player) => Number(player.goals || 0)));
  const maxMvps = Math.max(0, ...players.map((player) => Number(player.mvps || 0)));
  return {
    goldenBoot: new Set(
      configuredGoldenBootIds.length > 0
        ? configuredGoldenBootIds
        : maxGoals > 0
          ? players
              .filter((player) => Number(player.goals || 0) === maxGoals)
              .map((player) => player.playerId)
          : []
    ),
    tournamentMvp: new Set(
      configuredTournamentMvpId
        ? [configuredTournamentMvpId]
        : maxMvps > 0
          ? players
              .filter((player) => Number(player.mvps || 0) === maxMvps)
              .map((player) => player.playerId)
          : []
    ),
  };
}

export function computePlayerAwardPoints(
  selection: any,
  winners: ReturnType<typeof resolvePlayerAwardWinners>,
  scoring: ReturnType<typeof resolvePlayerScoring>
) {
  if (selection.award === 'golden_boot') {
    return winners.goldenBoot.has(selection.playerId) ? scoring.award.goldenBoot : 0;
  }
  if (selection.award === 'tournament_mvp') {
    return winners.tournamentMvp.has(selection.playerId) ? scoring.award.tournamentMvp : 0;
  }
  return 0;
}

@Injectable()
export class PlayerService {
  constructor(private readonly poolRepository: PoolRepository) {}

  async getPlayerInsights(
    poolId: string,
    playerId: string,
    selectionType: PlayerInsightSelectionType,
    award: PlayerAward | undefined,
    requesterUserId: string,
    requesterRole: string
  ) {
    if (selectionType !== 'position' && selectionType !== 'award') {
      throw new BadRequestException('Invalid player selection type');
    }
    if (selectionType === 'award' && (!award || !AWARDS.includes(award))) {
      throw new BadRequestException('A valid player award is required');
    }

    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }
    if (Date.now() < resolvePoolDeadline(pool)) {
      throw new ForbiddenException(
        'Player insights are only available after the prediction deadline'
      );
    }
    if (!hasPermission(requesterRole || 'user', 'admin')) {
      const membership = await this.poolRepository.getMembership(poolId, requesterUserId);
      if (!membership || membership.status !== 'active') {
        throw new ForbiddenException('You must be an active member of this pool');
      }
    }

    const player = await this.poolRepository.getTournamentPlayer(playerId);
    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    const [members, selections, matchActions] = await Promise.all([
      this.poolRepository.getPoolMembers(poolId),
      selectionType === 'award'
        ? this.poolRepository.getPlayerAwardSelectionsForPool(poolId)
        : this.poolRepository.getPlayerSelectionsForPool(poolId),
      this.poolRepository.getTournamentPlayerMatchStats(playerId),
    ]);
    const activeMembers = members.filter((member: any) => member.status === 'active');
    const activeUserIds = new Set(activeMembers.map((member: any) => member.userId));
    const limits = resolvePlayerSelectionLimits(pool.config?.playerSelectionLimits);
    const selectedUserIds = new Set(
      selections
        .filter(
          (selection: any) =>
            activeUserIds.has(selection.userId) &&
            selection.playerId === playerId &&
            (selectionType === 'award'
              ? selection.award === award
              : isSelectionWithinLimits(selection, limits))
        )
        .map((selection: any) => selection.userId)
    );
    const memberCount = activeMembers.length;
    const selectionCount = selectedUserIds.size;

    return {
      requesterUserId,
      player,
      selectionType,
      award: selectionType === 'award' ? award : null,
      memberCount,
      selectionCount,
      percentage: memberCount > 0 ? Math.round((selectionCount / memberCount) * 1000) / 10 : 0,
      selectedBy: activeMembers
        .filter((member: any) => selectedUserIds.has(member.userId))
        .map((member: any) => ({
          userId: member.userId,
          userName:
            member.userName ||
            (member.userEmail
              ? member.userEmail.split('@')[0]
              : `User ${member.userId.slice(0, 8)}`),
        }))
        .sort((a: any, b: any) => {
          if (a.userId === requesterUserId) return -1;
          if (b.userId === requesterUserId) return 1;
          return a.userName.localeCompare(b.userName);
        }),
      matches: matchActions,
    };
  }

  async getPlayerSelectionStatistics(
    poolId: string,
    requesterUserId: string,
    requesterRole: string
  ) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }
    if (Date.now() < resolvePoolDeadline(pool)) {
      throw new ForbiddenException(
        'Player selection statistics are only available after the prediction deadline'
      );
    }
    if (!hasPermission(requesterRole || 'user', 'admin')) {
      const membership = await this.poolRepository.getMembership(poolId, requesterUserId);
      if (!membership || membership.status !== 'active') {
        throw new ForbiddenException('You must be an active member of this pool');
      }
    }

    const [members, selections, awardSelections] = await Promise.all([
      this.poolRepository.getPoolMembers(poolId),
      this.poolRepository.getPlayerSelectionsForPool(poolId),
      this.poolRepository.getPlayerAwardSelectionsForPool(poolId),
    ]);
    const activeUserIds = new Set(
      members
        .filter((member: any) => member.status === 'active')
        .map((member: any) => member.userId)
    );
    const memberCount = activeUserIds.size;
    const percentage = (count: number) =>
      memberCount > 0 ? Math.round((count / memberCount) * 1000) / 10 : 0;
    const aggregate = (items: any[]) => {
      const byPlayer = new Map<string, any>();
      items
        .filter((item) => activeUserIds.has(item.userId))
        .forEach((item) => {
          const current = byPlayer.get(item.playerId);
          if (current) {
            current.count += 1;
            return;
          }
          byPlayer.set(item.playerId, {
            playerId: item.playerId,
            name: item.name,
            teamId: item.teamId,
            teamName: item.teamName,
            position: item.position,
            imageUrl: item.imageUrl,
            shirtNumber: item.shirtNumber,
            count: 1,
          });
        });

      return [...byPlayer.values()]
        .map((item) => ({ ...item, percentage: percentage(item.count) }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    };

    return {
      memberCount,
      awards: {
        goldenBoot: aggregate(
          awardSelections.filter((selection: any) => selection.award === 'golden_boot')
        ),
        tournamentMvp: aggregate(
          awardSelections.filter((selection: any) => selection.award === 'tournament_mvp')
        ),
      },
      positions: Object.fromEntries(
        POSITIONS.map((position) => [
          position,
          aggregate(selections.filter((selection: any) => selection.position === position)).slice(
            0,
            5
          ),
        ])
      ),
    };
  }

  async getPlayerSelectionState(poolId: string, userId: string) {
    if (poolId === SYSTEM_POOL_ID) {
      const [players, tournamentAwards] = await Promise.all([
        this.poolRepository.getTournamentPlayers(),
        this.poolRepository.getTournamentPlayerAwards(),
      ]);
      const scoring = resolvePlayerScoring(null);
      const awardWinners = resolvePlayerAwardWinners(null, players, tournamentAwards);

      return {
        players: players.map((player: any) => ({
          ...player,
          totalPoints: computePlayerPoints(player, scoring),
        })),
        selections: [],
        awardSelections: [],
        limits: resolvePlayerSelectionLimits(undefined),
        scoring,
        awardWinners: {
          goldenBootPlayerIds: [...awardWinners.goldenBoot],
          tournamentMvpPlayerId: [...awardWinners.tournamentMvp][0] || '',
        },
      };
    }

    const [pool, players, selections, awardSelections, tournamentAwards] = await Promise.all([
      this.poolRepository.getPool(poolId),
      this.poolRepository.getTournamentPlayers(),
      this.poolRepository.getPlayerSelections(poolId, userId),
      this.poolRepository.getPlayerAwardSelections(poolId, userId),
      this.poolRepository.getTournamentPlayerAwards(),
    ]);
    const scoring = resolvePlayerScoring(pool);
    const awardWinners = resolvePlayerAwardWinners(pool, players, tournamentAwards);
    const limits = resolvePlayerSelectionLimits(pool?.config?.playerSelectionLimits);
    const validSelections = selections.filter((selection: any) =>
      isSelectionWithinLimits(selection, limits)
    );

    return {
      players: players.map((player: any) => ({
        ...player,
        totalPoints: computePlayerPoints(player, scoring),
      })),
      selections: validSelections.map((selection: any) => ({
        ...selection,
        totalPoints: computePlayerPoints(selection, scoring),
      })),
      awardSelections: awardSelections.map((selection: any) => ({
        ...selection,
        awardPoints: computePlayerAwardPoints(selection, awardWinners, scoring),
      })),
      limits,
      scoring,
      awardWinners: {
        goldenBootPlayerIds: [...awardWinners.goldenBoot],
        tournamentMvpPlayerId: [...awardWinners.tournamentMvp][0] || '',
      },
    };
  }

  async updateTournamentPlayerAward(
    playerId: string,
    award: PlayerAward,
    selected: boolean,
    userRole: string
  ) {
    if (userRole !== 'admin') {
      throw new BadRequestException('Only administrators can update tournament awards');
    }
    if (!AWARDS.includes(award)) {
      throw new BadRequestException('Invalid player award');
    }
    const player = await this.poolRepository.getTournamentPlayer(playerId);
    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    const awards = await this.poolRepository.updateTournamentPlayerAward(playerId, award, selected);
    return {
      goldenBootPlayerIds: awards
        .filter((result: any) => result.award === 'golden_boot')
        .map((result: any) => result.playerId),
      tournamentMvpPlayerId:
        awards.find((result: any) => result.award === 'tournament_mvp')?.playerId || '',
    };
  }

  async updatePlayerStats(
    poolId: string,
    playerId: string,
    input: {
      matchId: string;
      matchType: PlayerMatchType;
      stat: PlayerStatKey;
      delta: number;
    },
    userRole: string
  ) {
    if (userRole !== 'admin') {
      throw new BadRequestException('Only administrators can update player stats');
    }
    const player = await this.poolRepository.getTournamentPlayer(playerId);
    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }
    if (!input.matchId?.trim()) {
      throw new BadRequestException('A match must be selected');
    }
    if (input.matchType !== 'group' && input.matchType !== 'final') {
      throw new BadRequestException('Invalid match type');
    }
    if (!STATS.includes(input.stat)) {
      throw new BadRequestException('Invalid player stat');
    }
    if (!Number.isInteger(input.delta) || ![-1, 1].includes(input.delta)) {
      throw new BadRequestException('Delta must be either -1 or 1');
    }

    const match = await this.poolRepository.getTournamentMatch(
      poolId,
      input.matchType,
      input.matchId
    );
    if (!match) {
      throw new NotFoundException(`Match with ID ${input.matchId} not found`);
    }
    if (!match.homeTeamId || !match.awayTeamId) {
      throw new BadRequestException('The selected match does not have both teams assigned yet');
    }
    if (player.teamId !== match.homeTeamId && player.teamId !== match.awayTeamId) {
      throw new BadRequestException('The selected player does not participate in this match');
    }

    return this.poolRepository.incrementTournamentPlayerMatchStat(
      playerId,
      input.matchType,
      input.matchId,
      input.stat,
      input.delta
    );
  }

  async updatePlayerSelection(
    poolId: string,
    userId: string,
    position: PlayerPosition,
    slot: number,
    playerId: string | null
  ) {
    if (!POSITIONS.includes(position)) {
      throw new BadRequestException('Invalid player position');
    }

    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }
    const limits = resolvePlayerSelectionLimits(pool.config?.playerSelectionLimits);
    if (!Number.isInteger(slot) || slot < 1 || slot > limits[position]) {
      throw new BadRequestException(
        `Slot must be between 1 and ${limits[position]} for ${position}`
      );
    }

    if (!playerId) {
      return this.poolRepository.deletePlayerSelection(poolId, userId, position, slot);
    }

    const player = await this.poolRepository.getTournamentPlayer(playerId);
    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }
    if (player.position !== position) {
      throw new BadRequestException(`Player is not eligible for ${position}`);
    }
    const selections = await this.poolRepository.getPlayerSelections(poolId, userId);
    const teamAlreadySelected = selections.some(
      (selection: any) =>
        selection.teamId === player.teamId &&
        !(selection.position === position && Number(selection.slot) === slot)
    );
    if (teamAlreadySelected) {
      throw new BadRequestException('Only one regular player per team can be selected');
    }

    return this.poolRepository.upsertPlayerSelection(poolId, userId, position, slot, playerId);
  }

  async updatePlayerAwardSelection(
    poolId: string,
    userId: string,
    award: PlayerAward,
    playerId: string | null
  ) {
    if (!AWARDS.includes(award)) {
      throw new BadRequestException('Invalid player award');
    }

    if (!playerId) {
      return this.poolRepository.deletePlayerAwardSelection(poolId, userId, award);
    }

    const player = await this.poolRepository.getTournamentPlayer(playerId);
    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    return this.poolRepository.upsertPlayerAwardSelection(poolId, userId, award, playerId);
  }
}
