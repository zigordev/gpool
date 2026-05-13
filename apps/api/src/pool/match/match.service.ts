import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PoolRepository } from '../database/pool.repository';
import { resolvePoolDeadline } from '../pool-deadline.util';
import {
  computePlayerAwardPoints,
  computePlayerPoints,
  resolvePlayerAwardWinners,
  resolvePlayerScoring,
} from '../player/player.service';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(private readonly poolRepository: PoolRepository) {}

  async getTeamsByGroup(group: string) {
    return this.poolRepository.getTeamsByGroup(group);
  }

  async getAllTeams() {
    return this.poolRepository.getAllTeams();
  }

  async getMatchesByPool(poolId: string) {
    const allMatches = await this.poolRepository.getMatchesByPool('all-pools');

    const matchesByGroup: Record<string, any[]> = {};
    for (const match of allMatches) {
      const groupId = match.groupId || 'Unknown';
      if (!matchesByGroup[groupId]) {
        matchesByGroup[groupId] = [];
      }
      matchesByGroup[groupId].push(match);
    }

    return {
      matches: allMatches,
      matchesByGroup,
      groups: Object.keys(matchesByGroup).sort(),
      poolId,
    };
  }

  async getMatch(matchId: string) {
    const match = await this.poolRepository.getMatch(matchId);
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }
    return match;
  }

  async submitPrediction(
    poolId: string,
    matchId: string,
    userId: string,
    homeScore: number | null,
    awayScore: number | null,
  ) {
    const match = await this.poolRepository.getMatch(matchId);
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const pool = await this.poolRepository.getPool(poolId);
    const deadline = resolvePoolDeadline(pool);
    if (Date.now() >= deadline) {
      throw new BadRequestException('Prediction deadline has passed');
    }

    const clearingPrediction = homeScore === null && awayScore === null;
    const partialPrediction = homeScore === null || awayScore === null;

    if (partialPrediction && !clearingPrediction) {
      throw new BadRequestException('Both scores must be provided or both must be empty');
    }

    if (clearingPrediction) {
      const cleared = await this.poolRepository.deletePrediction(poolId, matchId, userId);
      this.logger.log(`Prediction cleared: pool ${poolId}, match ${matchId}, user ${userId}`);
      return cleared;
    }

    if (homeScore < 0 || awayScore < 0 || !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      throw new BadRequestException('Scores must be non-negative integers');
    }

    const prediction = await this.poolRepository.createPrediction(
      poolId,
      matchId,
      userId,
      homeScore,
      awayScore,
    );

    this.logger.log(`Prediction submitted: pool ${poolId}, match ${matchId}, user ${userId}`);
    return prediction;
  }

  async getUserPredictions(poolId: string, userId: string) {
    return this.poolRepository.getUserPredictions(poolId, userId);
  }

  async getPrediction(poolId: string, matchId: string, userId: string) {
    return this.poolRepository.getPrediction(poolId, matchId, userId);
  }

  async updateMatchResults(
    matchId: string,
    homeResult: number | null,
    awayResult: number | null,
    poolId?: string,
    scoringConfig?: { winnerPoints: number; exactResultPoints: number },
  ) {
    const match = await this.poolRepository.getMatch(matchId);
    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const clearingResult = homeResult === null && awayResult === null;
    const partialResult = homeResult === null || awayResult === null;

    if (partialResult && !clearingResult) {
      throw new BadRequestException('Both results must be provided or both must be empty');
    }

    if (!clearingResult && (
      homeResult < 0 ||
      awayResult < 0 ||
      !Number.isInteger(homeResult) ||
      !Number.isInteger(awayResult)
    )) {
      throw new BadRequestException('Results must be non-negative integers');
    }

    const updatedMatch = await this.poolRepository.updateMatchResults(matchId, homeResult, awayResult);
    if (!updatedMatch) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    const allPredictions = await this.poolRepository.getAllPredictionsForMatch(matchId, poolId);

    if (clearingResult) {
      await this.poolRepository.resetPredictionStatusesForMatch(matchId, poolId);
      this.logger.log(
        `Match results cleared and ${allPredictions.length} predictions reset for match ${matchId}`,
      );

      return {
        ...updatedMatch,
        predictionsEvaluated: 0,
        predictionsReset: allPredictions.length,
      };
    }

    let winnerPoints = 0;
    let exactResultPoints = 0;

    if (poolId) {
      const pool = await this.poolRepository.getPool(poolId);
      if (pool?.config?.scoring) {
        winnerPoints = pool.config.scoring.winnerPoints ?? winnerPoints;
        exactResultPoints = pool.config.scoring.exactResultPoints ?? exactResultPoints;
      }
    }

    if (scoringConfig) {
      winnerPoints = scoringConfig.winnerPoints ?? winnerPoints;
      exactResultPoints = scoringConfig.exactResultPoints ?? exactResultPoints;
    }

    const getOutcome = (home: number, away: number): 'home' | 'away' | 'draw' => {
      if (home > away) return 'home';
      if (away > home) return 'away';
      return 'draw';
    };

    for (const prediction of allPredictions) {
      const exactMatch = prediction.homeScore === homeResult && prediction.awayScore === awayResult;
      const predictedOutcome = getOutcome(prediction.homeScore, prediction.awayScore);
      const actualOutcome = getOutcome(homeResult, awayResult);
      const winnerMatch = !exactMatch && predictedOutcome === actualOutcome;

      let points = 0;
      if (exactMatch) {
        points = exactResultPoints;
      } else if (winnerMatch) {
        points = winnerPoints;
      }

      await this.poolRepository.updatePredictionStatus(
        prediction.predictionId,
        exactMatch || winnerMatch,
        points,
        exactMatch,
      );
    }

    this.logger.log(
      `Match results updated and ${allPredictions.length} predictions evaluated for match ${matchId}`,
    );

    return {
      ...updatedMatch,
      predictionsEvaluated: allPredictions.length,
    };
  }

  async getPoolRanking(poolId: string) {
    const [
      pool,
      allPredictions,
      bracketPredictions,
      members,
      playerSelections,
      playerAwardSelections,
      tournamentPlayers,
    ] = await Promise.all([
      this.poolRepository.getPool(poolId),
      this.poolRepository.getAllPredictionsForPool(poolId),
      this.poolRepository.getAllBracketPredictionsForPool(poolId),
      this.poolRepository.getPoolMembers(poolId),
      this.poolRepository.getPlayerSelectionsForPool(poolId),
      this.poolRepository.getPlayerAwardSelectionsForPool(poolId),
      this.poolRepository.getTournamentPlayers(),
    ]);

    const memberUserIds = new Set(members.map((member: any) => member.userId));

    const userPoints = new Map<
      string,
      { userId: string; groupPhasePoints: number; finalPhasePoints: number; playerPoints: number; userName: string; userEmail?: string }
    >();
    members.forEach((member: any) => {
      const email = member.userEmail || '';
      const userName = member.userName || (email ? email.split('@')[0] : `User ${member.userId.slice(0, 8)}`);
      userPoints.set(member.userId, {
        userId: member.userId,
        groupPhasePoints: 0,
        finalPhasePoints: 0,
        playerPoints: 0,
        userName,
        userEmail: email,
      });
    });

    allPredictions.forEach((prediction: any) => {
      if (!memberUserIds.has(prediction.userId)) {
        return;
      }
      const current = userPoints.get(prediction.userId);
      if (current) {
        current.groupPhasePoints += prediction.points || 0;
      }
    });

    bracketPredictions.forEach((prediction: any) => {
      if (!memberUserIds.has(prediction.userId)) {
        return;
      }
      const current = userPoints.get(prediction.userId);
      if (current) {
        current.finalPhasePoints += prediction.points || 0;
      }
    });

    const playerScoring = resolvePlayerScoring(pool);
    playerSelections.forEach((selection: any) => {
      if (!memberUserIds.has(selection.userId)) {
        return;
      }
      const current = userPoints.get(selection.userId);
      if (current) {
        current.playerPoints += computePlayerPoints(selection, playerScoring);
      }
    });

    const awardWinners = resolvePlayerAwardWinners(pool, tournamentPlayers);
    playerAwardSelections.forEach((selection: any) => {
      if (!memberUserIds.has(selection.userId)) {
        return;
      }
      const current = userPoints.get(selection.userId);
      if (current) {
        current.playerPoints += computePlayerAwardPoints(selection, awardWinners, playerScoring);
      }
    });

    return Array.from(userPoints.values())
      .sort((a, b) => (b.groupPhasePoints + b.finalPhasePoints + b.playerPoints) - (a.groupPhasePoints + a.finalPhasePoints + a.playerPoints))
      .map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        userName: entry.userName,
        userEmail: entry.userEmail,
        groupPhasePoints: entry.groupPhasePoints,
        finalPhasePoints: entry.finalPhasePoints,
        playerPoints: entry.playerPoints,
      }));
  }
}
