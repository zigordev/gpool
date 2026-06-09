import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { hasPermission } from '../../common/guards/roles.guard';
import { PoolRepository } from '../database/pool.repository';
import { resolvePoolDeadline } from '../pool-deadline.util';

export type BracketPhase =
  | '16th-finals'
  | '8th-finals'
  | 'quarter-finals'
  | 'semi-finals'
  | 'finals';

const BRACKET_POOL_ID = 'all-pools';
const BRACKET_PHASES: Array<{ phase: BracketPhase; matches: number }> = [
  { phase: '16th-finals', matches: 16 },
  { phase: '8th-finals', matches: 8 },
  { phase: 'quarter-finals', matches: 4 },
  { phase: 'semi-finals', matches: 2 },
  { phase: 'finals', matches: 1 },
];
const FIFA_BRACKET_MATCH_NUMBERS: Record<BracketPhase, number[]> = {
  '16th-finals': [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87],
  '8th-finals': [89, 90, 93, 94, 91, 92, 95, 96],
  'quarter-finals': [97, 98, 99, 100],
  'semi-finals': [101, 102],
  finals: [104],
};

type BracketRoundScoring = {
  exactPositionPoints?: number;
  correctTeamWrongPositionPoints?: number;
  tournamentWinnerPoints?: number;
};

function resolveRoundScoring(
  bracketScoring: any,
  phase: string,
  override?: BracketRoundScoring,
): Required<BracketRoundScoring> {
  const roundScoring = bracketScoring?.rounds?.[phase] || {};
  return {
    exactPositionPoints:
      override?.exactPositionPoints ??
      roundScoring.exactPositionPoints ??
      bracketScoring?.exactPositionPoints ??
      0,
    correctTeamWrongPositionPoints:
      override?.correctTeamWrongPositionPoints ??
      roundScoring.correctTeamWrongPositionPoints ??
      bracketScoring?.correctTeamWrongPositionPoints ??
      0,
    tournamentWinnerPoints:
      override?.tournamentWinnerPoints ??
      bracketScoring?.tournamentWinnerPoints ??
      0,
  };
}

function bracketLayoutIndex(match: any): number {
  const raw = String(match?.bracketMatchId || '');
  const suffix = Number(raw.split('-').pop());
  return Number.isFinite(suffix) ? suffix : Number(match?.matchNumber || 0);
}

@Injectable()
export class BracketService {
  private readonly logger = new Logger(BracketService.name);

  constructor(private readonly poolRepository: PoolRepository) {}

  async getBracketMatches(poolId: string, phase?: BracketPhase) {
    return this.poolRepository.getBracketMatches(poolId, phase);
  }

  async getWinnerInsights(
    poolId: string,
    requesterUserId: string,
    requesterRole: string,
  ) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }
    if (Date.now() < resolvePoolDeadline(pool)) {
      throw new ForbiddenException('Winner insights are only available after the prediction deadline');
    }
    if (!hasPermission(requesterRole || 'user', 'admin')) {
      const membership = await this.poolRepository.getMembership(poolId, requesterUserId);
      if (!membership || membership.status !== 'active') {
        throw new ForbiddenException('You must be an active member of this pool');
      }
    }

    const [members, matches, predictions] = await Promise.all([
      this.poolRepository.getPoolMembers(poolId),
      this.poolRepository.getBracketMatches(BRACKET_POOL_ID, 'finals'),
      this.poolRepository.getAllBracketPredictionsForPool(poolId),
    ]);
    const finalMatch = matches[0] || null;
    const activeUserIds = new Set(
      members
        .filter((member: any) => member.status === 'active')
        .map((member: any) => member.userId),
    );
    const memberCount = activeUserIds.size;
    const finalPredictions = predictions.filter(
      (prediction: any) =>
        prediction.bracketMatchId === finalMatch?.bracketMatchId &&
        activeUserIds.has(prediction.userId),
    );
    const byTeam = new Map<string, any>();
    finalPredictions.forEach((prediction: any) => {
      if (!prediction.predictedWinnerTeamId) return;
      const current = byTeam.get(prediction.predictedWinnerTeamId);
      if (current) {
        current.count += 1;
        return;
      }
      byTeam.set(prediction.predictedWinnerTeamId, {
        teamId: prediction.predictedWinnerTeamId,
        teamName: prediction.predictedWinnerTeamName,
        count: 1,
      });
    });

    const actualWinnerTeamId =
      typeof finalMatch?.homeResult === 'number' &&
      typeof finalMatch?.awayResult === 'number' &&
      finalMatch.homeResult !== finalMatch.awayResult
        ? finalMatch.homeResult > finalMatch.awayResult
          ? finalMatch.homeTeamId
          : finalMatch.awayTeamId
        : null;

    return {
      memberCount,
      actualWinnerTeamId,
      selections: [...byTeam.values()]
        .map((selection) => ({
          ...selection,
          percentage:
            memberCount > 0
              ? Math.round((selection.count / memberCount) * 1000) / 10
              : 0,
          correct:
            actualWinnerTeamId === null
              ? null
              : selection.teamId === actualWinnerTeamId,
        }))
        .sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName)),
    };
  }

  private async ensureGlobalBracketPhases() {
    const allMatches = await this.poolRepository.getBracketMatches(BRACKET_POOL_ID);
    const counts = new Map<string, number>();
    allMatches.forEach((match: any) => {
      counts.set(match.phase, (counts.get(match.phase) || 0) + 1);
    });

    for (const { phase, matches } of BRACKET_PHASES) {
      if ((counts.get(phase) || 0) === 0) {
        for (let index = 0; index < matches; index++) {
          await this.poolRepository.createBracketMatch({
            bracketMatchId: `${BRACKET_POOL_ID}-${phase}-${index + 1}`,
            poolId: BRACKET_POOL_ID,
            phase,
            matchNumber: FIFA_BRACKET_MATCH_NUMBERS[phase][index],
            status: 'scheduled',
          });
        }
      }
    }
  }

  async createBracketPhase(
    poolId: string,
    phase: BracketPhase,
    numberOfMatches: number,
    forceRecreate: boolean = false,
  ) {
    const existingMatches = await this.poolRepository.getBracketMatches(BRACKET_POOL_ID, phase);
    if (existingMatches.length > 0) {
      if (!forceRecreate) {
        throw new BadRequestException(`Phase ${phase} already exists for this pool`);
      }
      for (const match of existingMatches) {
        await this.poolRepository.deleteBracketMatch(match.bracketMatchId);
      }
    }

    const matches = [];
    for (let index = 0; index < numberOfMatches; index++) {
      const matchNumber = FIFA_BRACKET_MATCH_NUMBERS[phase]?.[index] ?? index + 1;
      const bracketMatchId = `${BRACKET_POOL_ID}-${phase}-${index + 1}`;
      const match = await this.poolRepository.createBracketMatch({
        bracketMatchId,
        poolId: BRACKET_POOL_ID,
        phase,
        matchNumber,
        status: 'scheduled',
      });
      matches.push(match);
    }

    this.logger.log(
      `Created ${numberOfMatches} matches for phase ${phase} in pool ${poolId}`,
    );
    return matches;
  }

  async updateBracketMatchTeam(
    bracketMatchId: string,
    poolId: string,
    side: 'home' | 'away',
    teamId: string,
    teamName: string,
  ) {
    const matches = await this.poolRepository.getBracketMatches(poolId);
    const foundMatch = matches.find((match: any) => match.bracketMatchId === bracketMatchId);

    if (!foundMatch) {
      throw new NotFoundException(`Bracket match ${bracketMatchId} not found`);
    }

    const updates: any = {};
    if (side === 'home') {
      updates.homeTeamId = teamId;
      updates.homeTeamName = teamName;
    } else {
      updates.awayTeamId = teamId;
      updates.awayTeamName = teamName;
    }

    const updatedMatch = await this.poolRepository.updateBracketMatch(bracketMatchId, updates);
    const allMatches = await this.poolRepository.getBracketMatches(poolId);
    const fullMatch = allMatches.find((match: any) => match.bracketMatchId === bracketMatchId);

    if (fullMatch?.homeTeamId && fullMatch?.awayTeamId) {
      await this.evaluateBracketPredictions(
        bracketMatchId,
        fullMatch,
        poolId === BRACKET_POOL_ID ? undefined : poolId,
      );
    }

    return fullMatch || updatedMatch;
  }

  private async evaluateBracketPredictions(
    bracketMatchId: string,
    match: any,
    poolId?: string,
    scoringOverride?: BracketRoundScoring,
  ) {
    const predictions = await this.poolRepository.getAllBracketPredictionsForMatch(bracketMatchId);
    const relevantPredictions = poolId
      ? predictions.filter((prediction: any) => prediction.poolId === poolId)
      : predictions;
    const pools = await this.poolRepository.listPools();
    const poolById = new Map(pools.map((pool: any) => [pool.poolId, pool]));

    for (const prediction of relevantPredictions) {
      const predictionPool: any = poolById.get(prediction.poolId);
      const {
        exactPositionPoints: exactPosPoints,
        correctTeamWrongPositionPoints: wrongPosPoints,
        tournamentWinnerPoints,
      } = resolveRoundScoring(
        predictionPool?.config?.bracketScoring,
        match.phase,
        scoringOverride,
      );
      let points = 0;

      const homeTeamExactPosition = prediction.homeTeamId === match.homeTeamId;
      const homeTeamCorrectButWrongPosition = prediction.homeTeamId === match.awayTeamId;
      const awayTeamExactPosition = prediction.awayTeamId === match.awayTeamId;
      const awayTeamCorrectButWrongPosition = prediction.awayTeamId === match.homeTeamId;
      const actualWinnerTeamId =
        match.phase === 'finals' &&
        typeof match.homeResult === 'number' &&
        typeof match.awayResult === 'number' &&
        match.homeResult !== match.awayResult
          ? match.homeResult > match.awayResult
            ? match.homeTeamId
            : match.awayTeamId
          : null;
      const tournamentWinnerCorrect =
        actualWinnerTeamId && prediction.predictedWinnerTeamId
          ? prediction.predictedWinnerTeamId === actualWinnerTeamId
          : null;

      if (homeTeamExactPosition) {
        points += exactPosPoints;
      } else if (homeTeamCorrectButWrongPosition) {
        points += wrongPosPoints;
      }

      if (awayTeamExactPosition) {
        points += exactPosPoints;
      } else if (awayTeamCorrectButWrongPosition) {
        points += wrongPosPoints;
      }

      if (tournamentWinnerCorrect) {
        points += tournamentWinnerPoints;
      }

      await this.poolRepository.updateBracketPredictionPoints(
        prediction.bracketPredictionId,
        points,
        homeTeamExactPosition,
        awayTeamExactPosition,
        homeTeamCorrectButWrongPosition,
        awayTeamCorrectButWrongPosition,
        tournamentWinnerCorrect,
      );
    }
  }

  async updateBracketMatchResult(
    bracketMatchId: string,
    poolId: string,
    homeResult: number,
    awayResult: number,
    exactPositionPoints?: number,
    correctTeamWrongPositionPoints?: number,
  ) {
    const matches = await this.poolRepository.getBracketMatches(poolId);
    const foundMatch = matches.find((match: any) => match.bracketMatchId === bracketMatchId);
    if (!foundMatch) {
      throw new NotFoundException(`Bracket match ${bracketMatchId} not found`);
    }

    const updatedMatch = await this.poolRepository.updateBracketMatch(bracketMatchId, {
      homeResult,
      awayResult,
      status: 'completed',
    });

    if (updatedMatch?.homeTeamId && updatedMatch?.awayTeamId) {
      await this.evaluateBracketPredictions(bracketMatchId, updatedMatch, undefined, {
        exactPositionPoints,
        correctTeamWrongPositionPoints,
      });
    }

    const predictions = await this.poolRepository.getAllBracketPredictionsForMatch(bracketMatchId);
    return {
      bracketMatchId,
      homeResult,
      awayResult,
      predictionsEvaluated: predictions.length,
    };
  }

  async getBracketStructure(poolId: string) {
    await this.ensureGlobalBracketPhases();
    const allMatches = await this.poolRepository.getBracketMatches(poolId);

    const structure: Record<string, any[]> = {};
    for (const { phase } of BRACKET_PHASES) {
      structure[phase] = allMatches
        .filter((match: any) => match.phase === phase)
        .sort((a: any, b: any) => bracketLayoutIndex(a) - bracketLayoutIndex(b));
    }

    return structure;
  }

  async createBracketPrediction(
    poolId: string,
    bracketMatchId: string,
    userId: string,
    homeTeamId: string,
    homeTeamName: string,
    awayTeamId: string,
    awayTeamName: string,
    predictedWinnerTeamId?: string,
    predictedWinnerTeamName?: string,
  ) {
    const pool = await this.poolRepository.getPool(poolId);
    const deadline = resolvePoolDeadline(pool);
    if (Date.now() >= deadline) {
      throw new BadRequestException('Deadline has passed. Bracket predictions can no longer be edited.');
    }

    const matches = await this.poolRepository.getBracketMatches(poolId);
    const match = matches.find((candidate: any) => candidate.bracketMatchId === bracketMatchId);
    const validWinner =
      match?.phase === 'finals' &&
      predictedWinnerTeamId &&
      (predictedWinnerTeamId === homeTeamId || predictedWinnerTeamId === awayTeamId);

    const result = await this.poolRepository.createBracketPrediction(
      poolId,
      bracketMatchId,
      userId,
      homeTeamId,
      homeTeamName,
      awayTeamId,
      awayTeamName,
      validWinner ? predictedWinnerTeamId : '',
      validWinner ? predictedWinnerTeamName : '',
    );

    // If the match already has both teams assigned (admin set them before or during predictions),
    // immediately evaluate so the user sees their score without waiting for admin re-evaluation.
    if (match?.homeTeamId && match?.awayTeamId) {
      await this.evaluateBracketPredictions(bracketMatchId, match, poolId);
    }

    return result;
  }

  async getUserBracketPredictions(poolId: string, userId: string) {
    return this.poolRepository.getUserBracketPredictions(poolId, userId);
  }

  async getBracketPrediction(poolId: string, bracketMatchId: string, userId: string) {
    return this.poolRepository.getBracketPrediction(poolId, bracketMatchId, userId);
  }

  async reEvaluateAllBracketMatches(poolId: string) {
    const allMatches = await this.poolRepository.getBracketMatches(poolId);
    const matchesToEvaluate = allMatches.filter((match: any) => match.homeTeamId && match.awayTeamId);

    for (const match of matchesToEvaluate) {
      await this.evaluateBracketPredictions(
        match.bracketMatchId,
        match,
        poolId === BRACKET_POOL_ID ? undefined : poolId,
      );
    }

    return { matchesEvaluated: matchesToEvaluate.length };
  }
}
