import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { hasPermission } from '../../common/guards/roles.guard';
import { PoolRepository } from '../database/pool.repository';
import { resolvePoolDeadline } from '../pool-deadline.util';

type BracketPhase = '16th-finals' | '8th-finals' | 'quarter-finals' | 'semi-finals' | 'finals';

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
const BRACKET_PHASE_MATCH_COUNT = new Map(
  BRACKET_PHASES.map(({ phase, matches }) => [phase, matches])
);

type BracketRoundScoring = {
  exactPositionPoints?: number;
  correctTeamWrongPositionPoints?: number;
  tournamentWinnerPoints?: number;
};

function firstConfiguredNumber(...values: unknown[]): number {
  for (const value of values) {
    if (value === '' || value === null || value === undefined) {
      continue;
    }
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) {
      return Math.max(0, numberValue);
    }
  }
  return 0;
}

function resolveRoundScoring(
  bracketScoring: any,
  phase: string,
  override?: BracketRoundScoring
): Required<BracketRoundScoring> {
  const roundScoring = bracketScoring?.rounds?.[phase] || {};
  return {
    exactPositionPoints: firstConfiguredNumber(
      roundScoring.exactPositionPoints,
      override?.exactPositionPoints,
      bracketScoring?.exactPositionPoints,
      0
    ),
    correctTeamWrongPositionPoints: firstConfiguredNumber(
      roundScoring.correctTeamWrongPositionPoints,
      override?.correctTeamWrongPositionPoints,
      bracketScoring?.correctTeamWrongPositionPoints,
      0
    ),
    tournamentWinnerPoints: firstConfiguredNumber(
      override?.tournamentWinnerPoints,
      bracketScoring?.tournamentWinnerPoints,
      0
    ),
  };
}

function bracketLayoutIndex(match: any): number {
  const raw = String(match?.bracketMatchId || '');
  const suffix = Number(raw.split('-').pop());
  return Number.isFinite(suffix) ? suffix : Number(match?.matchNumber || 0);
}

function bracketMatchIdentity(bracketMatchId: string) {
  const match = bracketMatchId.match(/^all-pools-(16th-finals|8th-finals|quarter-finals|semi-finals|finals)-(\d+)$/);
  if (!match) {
    return null;
  }
  const phase = match[1] as BracketPhase;
  const index = Number(match[2]) - 1;
  const matchNumber = FIFA_BRACKET_MATCH_NUMBERS[phase]?.[index];
  if (!Number.isInteger(index) || index < 0 || !matchNumber) {
    return null;
  }
  return { phase, matchNumber };
}

function hasAnyBracketTeam(match: any): boolean {
  return Boolean(match?.homeTeamId || match?.awayTeamId);
}

function phaseHasAnyBracketTeam(matches: any[]): boolean {
  return matches.some(hasAnyBracketTeam);
}

function resultWinnerTeamId(match: any): string {
  if (
    typeof match?.homeResult !== 'number' ||
    typeof match?.awayResult !== 'number' ||
    match.homeResult === match.awayResult
  ) {
    return '';
  }

  return match.homeResult > match.awayResult ? match.homeTeamId || '' : match.awayTeamId || '';
}

function advancedTeamIdFromNextRound(
  matchesByPhase: Map<BracketPhase, any[]>,
  phase: BracketPhase,
  matchIndex: number
): string {
  const phaseIndex = BRACKET_PHASES.findIndex((candidate) => candidate.phase === phase);
  const nextPhase = phaseIndex >= 0 ? BRACKET_PHASES[phaseIndex + 1]?.phase : undefined;
  if (!nextPhase) return '';

  const nextMatch = matchesByPhase.get(nextPhase)?.[Math.floor(matchIndex / 2)];
  if (!nextMatch) return '';

  return matchIndex % 2 === 0 ? nextMatch.homeTeamId || '' : nextMatch.awayTeamId || '';
}

@Injectable()
export class BracketService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BracketService.name);

  constructor(private readonly poolRepository: PoolRepository) {}

  async onApplicationBootstrap() {
    await this.ensureGlobalBracketPhases();
    const result = await this.reEvaluateAllBracketMatches(BRACKET_POOL_ID);
    this.logger.log(
      `Recalculated final phase scoring at startup for ${result.matchesEvaluated} matches`
    );
  }

  async getBracketMatches(poolId: string, phase?: BracketPhase) {
    return this.poolRepository.getBracketMatches(poolId, phase);
  }

  async getWinnerInsights(poolId: string, requesterUserId: string, requesterRole: string) {
    const pool = await this.poolRepository.getPool(poolId);
    if (!pool) {
      throw new NotFoundException(`Pool with ID ${poolId} not found`);
    }
    if (Date.now() < resolvePoolDeadline(pool)) {
      throw new ForbiddenException(
        'Winner insights are only available after the prediction deadline'
      );
    }
    if (!hasPermission(requesterRole || 'user', 'admin')) {
      const membership = await this.poolRepository.getMembership(poolId, requesterUserId);
      if (membership?.status !== 'active') {
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
        .map((member: any) => member.userId)
    );
    const memberCount = activeUserIds.size;
    const finalPredictions = predictions.filter(
      (prediction: any) =>
        prediction.bracketMatchId === finalMatch?.bracketMatchId &&
        activeUserIds.has(prediction.userId)
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
          percentage: memberCount > 0 ? Math.round((selection.count / memberCount) * 1000) / 10 : 0,
          correct: actualWinnerTeamId === null ? null : selection.teamId === actualWinnerTeamId,
        }))
        .sort((a, b) => b.count - a.count || a.teamName.localeCompare(b.teamName)),
    };
  }

  private async ensureGlobalBracketPhases() {
    const allMatches = await this.poolRepository.getBracketMatches(BRACKET_POOL_ID);
    const existingMatchIds = new Set(
      allMatches.map((match: any) => match.bracketMatchId).filter(Boolean)
    );

    for (const { phase, matches } of BRACKET_PHASES) {
      for (let index = 0; index < matches; index++) {
        const bracketMatchId = `${BRACKET_POOL_ID}-${phase}-${index + 1}`;
        if (existingMatchIds.has(bracketMatchId)) {
          continue;
        }
        await this.poolRepository.createBracketMatch({
          bracketMatchId,
          poolId: BRACKET_POOL_ID,
          phase,
          matchNumber: FIFA_BRACKET_MATCH_NUMBERS[phase][index],
          status: 'scheduled',
        });
      }
    }
  }

  async createBracketPhase(
    poolId: string,
    phase: BracketPhase,
    numberOfMatches: number,
    forceRecreate: boolean = false
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

    this.logger.log(`Created ${numberOfMatches} matches for phase ${phase} in pool ${poolId}`);
    await this.syncTeamEliminationState();
    return matches;
  }

  async updateBracketMatchTeam(
    bracketMatchId: string,
    poolId: string,
    side: 'home' | 'away',
    teamId: string,
    teamName: string
  ) {
    const matches = await this.poolRepository.getBracketMatches(poolId);
    const foundMatch = matches.find((match: any) => match.bracketMatchId === bracketMatchId);

    if (!foundMatch) {
      const identity = bracketMatchIdentity(bracketMatchId);
      if (!identity) {
        throw new NotFoundException(`Bracket match ${bracketMatchId} not found`);
      }
      const createdMatch = await this.poolRepository.createBracketMatch({
        bracketMatchId,
        poolId: BRACKET_POOL_ID,
        phase: identity.phase,
        matchNumber: identity.matchNumber,
        homeTeamId: side === 'home' ? teamId : undefined,
        homeTeamName: side === 'home' ? teamName : undefined,
        awayTeamId: side === 'away' ? teamId : undefined,
        awayTeamName: side === 'away' ? teamName : undefined,
        status: 'scheduled',
      });
      await this.evaluateBracketPhasePredictions(
        createdMatch.phase,
        poolId === BRACKET_POOL_ID ? undefined : poolId
      );
      await this.syncTeamEliminationState();
      return createdMatch;
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

    if (fullMatch) {
      await this.evaluateBracketPhasePredictions(
        fullMatch.phase,
        poolId === BRACKET_POOL_ID ? undefined : poolId
      );
    }
    await this.syncTeamEliminationState();

    return fullMatch || updatedMatch;
  }

  private async syncTeamEliminationState() {
    const matches = await this.poolRepository.getBracketMatches(BRACKET_POOL_ID);
    const matchesByPhase = new Map<BracketPhase, any[]>();
    for (const match of matches) {
      if (BRACKET_PHASE_MATCH_COUNT.has(match.phase)) {
        const phase = match.phase as BracketPhase;
        matchesByPhase.set(phase, [...(matchesByPhase.get(phase) || []), match]);
      }
    }

    for (const { phase } of BRACKET_PHASES) {
      const sortedMatches = [...(matchesByPhase.get(phase) || [])].sort(
        (a, b) => bracketLayoutIndex(a) - bracketLayoutIndex(b)
      );
      matchesByPhase.set(phase, sortedMatches);
    }

    const eliminatedTeamIds = new Set<string>();
    const firstPhaseMatches = matchesByPhase.get('16th-finals') || [];
    const firstPhaseComplete =
      firstPhaseMatches.length === BRACKET_PHASE_MATCH_COUNT.get('16th-finals') &&
      firstPhaseMatches.every((match) => match.homeTeamId && match.awayTeamId);

    if (firstPhaseComplete) {
      const qualifiedTeamIds = new Set<string>();
      firstPhaseMatches.forEach((match) => {
        if (match.homeTeamId) qualifiedTeamIds.add(match.homeTeamId);
        if (match.awayTeamId) qualifiedTeamIds.add(match.awayTeamId);
      });
      const allTeams = await this.poolRepository.getAllTeams();
      allTeams.forEach((team: any) => {
        if (!qualifiedTeamIds.has(team.teamId)) {
          eliminatedTeamIds.add(team.teamId);
        }
      });
    }

    for (const { phase } of BRACKET_PHASES) {
      const phaseMatches = matchesByPhase.get(phase) || [];
      phaseMatches.forEach((match, matchIndex) => {
        const matchTeamIds = [match.homeTeamId, match.awayTeamId].filter(Boolean);
        if (matchTeamIds.length < 2) return;

        const winnerTeamId =
          resultWinnerTeamId(match) ||
          advancedTeamIdFromNextRound(matchesByPhase, phase, matchIndex);
        if (!winnerTeamId || !matchTeamIds.includes(winnerTeamId)) return;

        matchTeamIds.forEach((teamId) => {
          if (teamId !== winnerTeamId) {
            eliminatedTeamIds.add(teamId);
          }
        });
      });
    }

    await this.poolRepository.updateTeamEliminatedState([...eliminatedTeamIds]);
    this.logger.log(
      `Synchronized ${eliminatedTeamIds.size} eliminated teams from bracket progression`
    );
  }

  private async evaluateBracketPredictions(
    bracketMatchId: string,
    match: any,
    poolId?: string,
    scoringOverride?: BracketRoundScoring
  ) {
    const predictions = await this.poolRepository.getAllBracketPredictionsForMatch(bracketMatchId);
    const relevantPredictions = poolId
      ? predictions.filter((prediction: any) => prediction.poolId === poolId)
      : predictions;
    const pools = await this.poolRepository.listPools();
    const poolById = new Map(pools.map((pool: any) => [pool.poolId, pool]));
    const phaseMatches = await this.poolRepository.getBracketMatches(BRACKET_POOL_ID, match.phase);
    const actualPhaseTeamIds = new Set<string>();
    phaseMatches.forEach((phaseMatch: any) => {
      if (phaseMatch.homeTeamId) actualPhaseTeamIds.add(phaseMatch.homeTeamId);
      if (phaseMatch.awayTeamId) actualPhaseTeamIds.add(phaseMatch.awayTeamId);
    });

    const predictionUpdates = relevantPredictions.map((prediction: any) => {
      const predictionPool: any = poolById.get(prediction.poolId);
      const {
        exactPositionPoints: exactPosPoints,
        correctTeamWrongPositionPoints: wrongPosPoints,
        tournamentWinnerPoints,
      } = resolveRoundScoring(predictionPool?.config?.bracketScoring, match.phase, scoringOverride);
      let points = 0;

      const homeTeamExactPosition =
        Boolean(match.homeTeamId) &&
        Boolean(prediction.homeTeamId) &&
        prediction.homeTeamId === match.homeTeamId;
      const homeTeamCorrectButWrongPosition =
        !homeTeamExactPosition &&
        Boolean(prediction.homeTeamId) &&
        actualPhaseTeamIds.has(prediction.homeTeamId);
      const awayTeamExactPosition =
        Boolean(match.awayTeamId) &&
        Boolean(prediction.awayTeamId) &&
        prediction.awayTeamId === match.awayTeamId;
      const awayTeamCorrectButWrongPosition =
        !awayTeamExactPosition &&
        Boolean(prediction.awayTeamId) &&
        actualPhaseTeamIds.has(prediction.awayTeamId);
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

      return {
        bracketPredictionId: prediction.bracketPredictionId,
        points,
        homeTeamExactPosition,
        awayTeamExactPosition,
        homeTeamCorrectButWrongPosition,
        awayTeamCorrectButWrongPosition,
        tournamentWinnerCorrect,
      };
    });

    await this.poolRepository.bulkUpdateBracketPredictionPoints(predictionUpdates);
  }

  private async evaluateBracketPhasePredictions(
    phase: BracketPhase,
    poolId?: string,
    scoringOverride?: BracketRoundScoring
  ) {
    const phaseMatches = await this.poolRepository.getBracketMatches(BRACKET_POOL_ID, phase);
    if (!phaseHasAnyBracketTeam(phaseMatches)) {
      return 0;
    }

    for (const phaseMatch of phaseMatches) {
      await this.evaluateBracketPredictions(
        phaseMatch.bracketMatchId,
        phaseMatch,
        poolId,
        scoringOverride
      );
    }

    return phaseMatches.length;
  }

  async updateBracketMatchResult(
    bracketMatchId: string,
    poolId: string,
    homeResult: number,
    awayResult: number,
    exactPositionPoints?: number,
    correctTeamWrongPositionPoints?: number
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

    await this.evaluateBracketPhasePredictions(updatedMatch.phase, undefined, {
      exactPositionPoints,
      correctTeamWrongPositionPoints,
    });
    await this.syncTeamEliminationState();

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
    predictedWinnerTeamName?: string
  ) {
    const pool = await this.poolRepository.getPool(poolId);
    const deadline = resolvePoolDeadline(pool);
    if (Date.now() >= deadline) {
      throw new BadRequestException(
        'Deadline has passed. Bracket predictions can no longer be edited.'
      );
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
      validWinner ? predictedWinnerTeamName : ''
    );

    const phaseMatches = match?.phase
      ? await this.poolRepository.getBracketMatches(BRACKET_POOL_ID, match.phase)
      : [];
    // If this phase already has any real team assigned, immediately evaluate this prediction even
    // when this specific match box is still empty. This awards wrong-box points as soon as a team
    // advances anywhere in the round.
    if (phaseHasAnyBracketTeam(phaseMatches)) {
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
    const phasesWithTeams = new Set(
      allMatches
        .filter(hasAnyBracketTeam)
        .map((match: any) => match.phase)
    );
    const matchesToEvaluate = allMatches.filter((match: any) => phasesWithTeams.has(match.phase));

    for (const match of matchesToEvaluate) {
      await this.evaluateBracketPredictions(
        match.bracketMatchId,
        match,
        poolId === BRACKET_POOL_ID ? undefined : poolId
      );
    }
    await this.syncTeamEliminationState();

    return { matchesEvaluated: matchesToEvaluate.length };
  }
}
