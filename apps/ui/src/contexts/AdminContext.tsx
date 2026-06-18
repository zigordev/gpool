'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';
import { PlayerAward } from '@/types/playerAward.type';
import { PlayerStatKey } from '@/types/playerStatKey.type';
import { PrizePayout } from '@/types/prizePayout.type';
import {
  DEFAULT_PLAYER_SELECTION_LIMITS,
  type PlayerSelectionLimits,
  resolvePlayerSelectionLimits,
} from '@/lib/player-selection-limits';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_POOL_DEADLINE = new Date('2026-06-08T00:00:00Z').getTime();
export const DEFAULT_MATCHDAY_SEPARATOR_TIME = '14:00';

export const PHASES = [
  { key: '16th-finals', labelKey: 'bracket.round.16th', matches: 16 },
  { key: '8th-finals', labelKey: 'bracket.round.8th', matches: 8 },
  { key: 'quarter-finals', labelKey: 'bracket.round.quarter', matches: 4 },
  { key: 'semi-finals', labelKey: 'bracket.round.semi', matches: 2 },
  { key: 'finals', labelKey: 'bracket.round.final', matches: 1 },
] as const;

export type ConfigNumber = number | '';
type PlayerPositionKey = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
type PositionScoring = Record<PlayerPositionKey, ConfigNumber>;
export type PlayerMatchReference = {
  matchId: string;
  matchType: 'group' | 'final';
};

export type GroupScoringConfig = {
  winnerPoints: ConfigNumber;
  exactResultPoints: ConfigNumber;
};

export type AdminBracketRoundScoring = {
  exactPositionPoints: ConfigNumber;
  correctTeamWrongPositionPoints: ConfigNumber;
};

export type AdminBracketScoringConfig = AdminBracketRoundScoring & {
  tournamentWinnerPoints: ConfigNumber;
  rounds: Record<string, AdminBracketRoundScoring>;
};

export type AdminPlayerScoringConfig = {
  goal: PositionScoring;
  penaltyGoal: PositionScoring;
  missedPenalty: ConfigNumber;
  mvp: ConfigNumber;
  penaltySaved: ConfigNumber;
  shootoutPenaltySaved: ConfigNumber;
  shootoutGoal: ConfigNumber;
  shootoutMissedPenalty: ConfigNumber;
  cleanSheet: PositionScoring;
  assist: PositionScoring;
  yellowCard: ConfigNumber;
  redCard: ConfigNumber;
  award: { goldenBoot: ConfigNumber; tournamentMvp: ConfigNumber };
};

// ─── Utility functions ────────────────────────────────────────────────────────

const EMPTY_GROUP_SCORING: GroupScoringConfig = { winnerPoints: '', exactResultPoints: '' };

function emptyBracketScoring(): AdminBracketScoringConfig {
  const rounds = PHASES.reduce<Record<string, AdminBracketRoundScoring>>((acc, phase) => {
    acc[phase.key] = { exactPositionPoints: '', correctTeamWrongPositionPoints: '' };
    return acc;
  }, {});
  return {
    exactPositionPoints: '',
    correctTeamWrongPositionPoints: '',
    tournamentWinnerPoints: '',
    rounds,
  };
}

export const DEFAULT_PLAYER_SCORING: AdminPlayerScoringConfig = {
  goal: { goalkeeper: '', defender: '', midfielder: '', forward: '' },
  penaltyGoal: { goalkeeper: '', defender: '', midfielder: '', forward: '' },
  missedPenalty: '',
  mvp: '',
  penaltySaved: '',
  shootoutPenaltySaved: '',
  shootoutGoal: '',
  shootoutMissedPenalty: '',
  cleanSheet: { goalkeeper: '', defender: '', midfielder: '', forward: '' },
  assist: { goalkeeper: '', defender: '', midfielder: '', forward: '' },
  yellowCard: '',
  redCard: '',
  award: { goldenBoot: '', tournamentMvp: '' },
};

const POSITION_KEYS: PlayerPositionKey[] = ['goalkeeper', 'defender', 'midfielder', 'forward'];

export function parseConfigNumberInput(value: string, options: { allowNegative?: boolean; max?: number } = {}): ConfigNumber {
  if (value.trim() === '') return '';
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return '';
  const minBound = options.allowNegative ? parsed : Math.max(0, parsed);
  return options.max !== undefined ? Math.min(options.max, minBound) : minBound;
}

function readConfigNumber(value: unknown, options: { allowNegative?: boolean; max?: number } = {}): ConfigNumber {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  const minBound = options.allowNegative ? parsed : Math.max(0, parsed);
  return options.max !== undefined ? Math.min(options.max, minBound) : minBound;
}

function pointsValue(value: ConfigNumber): number {
  return typeof value === 'number' ? value : 0;
}

function isConfiguredNumber(value: ConfigNumber): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function missingConfigCount(values: ConfigNumber[]): number {
  return values.filter((value) => !isConfiguredNumber(value)).length;
}

export function toDateTimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDateTimeLocal(value: string): number {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : DEFAULT_POOL_DEADLINE;
}

function resolveDeadline(pool: any): number {
  const raw = pool?.config?.deadline;
  if (raw == null) return DEFAULT_POOL_DEADLINE;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POOL_DEADLINE;
}

export function prizePaidPositionsLimit(memberCount?: number): number {
  return Number.isFinite(memberCount) ? Math.max(0, Math.floor(memberCount || 0)) : 0;
}

export function normalizePrizeDistribution(
  value: any,
  maxPaidPositions = prizePaidPositionsLimit(),
  totalPrizePool = 0,
): PrizePayout[] {
  const source = Array.isArray(value?.payouts) ? value.payouts : Array.isArray(value) ? value : [];
  if (source.length === 0 && totalPrizePool > 0) {
    return [{ rank: 1, amount: totalPrizePool }];
  }
  const requestedCount = Number.parseInt(
    String(value?.paidPositions ?? value?.positions ?? source.length),
    10,
  ) || 0;
  const paidPositions = Math.max(0, Math.min(maxPaidPositions, requestedCount));
  const percentageTotal = source.reduce((sum: number, row: any) => {
    const percentage = Number.parseFloat(String(row?.percentage));
    return sum + (Number.isFinite(percentage) && percentage >= 0 ? percentage : 0);
  }, 0);

  return Array.from({ length: paidPositions }, (_, index) => {
    const row = source[index];
    const rank = Number.parseInt(String(row?.rank ?? row?.position ?? index + 1), 10);
    const rawAmount = Number.parseFloat(String(row?.amount));
    const percentage = Number.parseFloat(String(row?.percentage));
    const amount = Number.isFinite(rawAmount)
      ? Math.max(0, rawAmount)
      : Number.isFinite(percentage) && percentageTotal > 0
        ? Math.max(0, totalPrizePool * (percentage / percentageTotal))
        : 0;

    return {
      rank: Number.isFinite(rank) && rank > 0 ? rank : index + 1,
      amount,
    };
  });
}

export function resizePrizeDistribution(rows: PrizePayout[], count: number, maxPaidPositions = prizePaidPositionsLimit()): PrizePayout[] {
  const normalizedCount = Math.max(0, Math.min(maxPaidPositions, count));
  const next = rows.slice(0, normalizedCount);
  const usedRanks = new Set(next.map((row) => row.rank));

  while (next.length < normalizedCount) {
    let rank = 1;
    while (usedRanks.has(rank)) rank += 1;
    next.push({ rank, amount: 0 });
    usedRanks.add(rank);
  }

  return next;
}

export function normalizeGroupScoring(value: any): GroupScoringConfig {
  return {
    winnerPoints: readConfigNumber(value?.winnerPoints),
    exactResultPoints: readConfigNumber(value?.exactResultPoints),
  };
}

export function normalizeBracketScoring(value: any): AdminBracketScoringConfig {
  const baseExact = readConfigNumber(value?.exactPositionPoints);
  const baseWrong = readConfigNumber(value?.correctTeamWrongPositionPoints);
  const tournamentWinnerPoints = readConfigNumber(value?.tournamentWinnerPoints);
  const rounds = PHASES.reduce<Record<string, AdminBracketRoundScoring>>((acc, phase) => {
    const round = value?.rounds?.[phase.key] || {};
    const exactPositionPoints = readConfigNumber(round.exactPositionPoints);
    const correctTeamWrongPositionPoints = readConfigNumber(round.correctTeamWrongPositionPoints);
    acc[phase.key] = {
      exactPositionPoints: isConfiguredNumber(exactPositionPoints) ? exactPositionPoints : baseExact,
      correctTeamWrongPositionPoints: isConfiguredNumber(correctTeamWrongPositionPoints) ? correctTeamWrongPositionPoints : baseWrong,
    };
    return acc;
  }, {});
  return { exactPositionPoints: baseExact, correctTeamWrongPositionPoints: baseWrong, tournamentWinnerPoints, rounds };
}

export function resolveCleanSheetScoring(value: any): PositionScoring {
  const legacy = Number(value);
  const source = value && typeof value === 'object' ? value : {};
  const goalkeeper = readConfigNumber(source.goalkeeper);
  return {
    goalkeeper: isConfiguredNumber(goalkeeper) ? goalkeeper : Number.isFinite(legacy) ? Math.max(0, legacy) : '',
    defender: readConfigNumber(source.defender),
    midfielder: readConfigNumber(source.midfielder),
    forward: readConfigNumber(source.forward),
  };
}

function resolvePositionConfigScoring(value: any): PositionScoring {
  const legacy = readConfigNumber(value);
  const source = value && typeof value === 'object' ? value : {};
  return {
    goalkeeper: isConfiguredNumber(readConfigNumber(source.goalkeeper))
      ? readConfigNumber(source.goalkeeper)
      : legacy,
    defender: isConfiguredNumber(readConfigNumber(source.defender))
      ? readConfigNumber(source.defender)
      : legacy,
    midfielder: isConfiguredNumber(readConfigNumber(source.midfielder))
      ? readConfigNumber(source.midfielder)
      : legacy,
    forward: isConfiguredNumber(readConfigNumber(source.forward))
      ? readConfigNumber(source.forward)
      : legacy,
  };
}

export function normalizePlayerScoring(value: any): AdminPlayerScoringConfig {
  const goal = value?.goal || {};
  const assist = value?.assist || {};
  return {
    goal: {
      goalkeeper: readConfigNumber(goal.goalkeeper),
      defender: readConfigNumber(goal.defender),
      midfielder: readConfigNumber(goal.midfielder),
      forward: readConfigNumber(goal.forward),
    },
    penaltyGoal: resolvePositionConfigScoring(value?.penaltyGoal),
    missedPenalty: readConfigNumber(value?.missedPenalty, { allowNegative: true }),
    mvp: readConfigNumber(value?.mvp),
    penaltySaved: readConfigNumber(value?.penaltySaved),
    shootoutPenaltySaved: readConfigNumber(value?.shootoutPenaltySaved),
    shootoutGoal: readConfigNumber(value?.shootoutGoal),
    shootoutMissedPenalty: readConfigNumber(value?.shootoutMissedPenalty, { allowNegative: true }),
    cleanSheet: resolveCleanSheetScoring(value?.cleanSheet),
    assist: {
      goalkeeper: readConfigNumber(assist.goalkeeper),
      defender: readConfigNumber(assist.defender),
      midfielder: readConfigNumber(assist.midfielder),
      forward: readConfigNumber(assist.forward),
    },
    yellowCard: readConfigNumber(value?.yellowCard, { allowNegative: true, max: 0 }),
    redCard: readConfigNumber(value?.redCard, { allowNegative: true, max: 0 }),
    award: {
      goldenBoot: readConfigNumber(value?.award?.goldenBoot),
      tournamentMvp: readConfigNumber(value?.award?.tournamentMvp),
    },
  };
}

export function groupScoringMissingCount(scoring: GroupScoringConfig): number {
  return missingConfigCount([scoring.winnerPoints, scoring.exactResultPoints]);
}

export function bracketScoringMissingCount(scoring: AdminBracketScoringConfig): number {
  return missingConfigCount([
    scoring.tournamentWinnerPoints,
    ...PHASES.flatMap((phase) => {
      const round = scoring.rounds[phase.key] || { exactPositionPoints: '', correctTeamWrongPositionPoints: '' };
      return [round.exactPositionPoints, round.correctTeamWrongPositionPoints];
    }),
  ]);
}

export function playerScoringMissingCount(scoring: AdminPlayerScoringConfig): number {
  return missingConfigCount([
    ...POSITION_KEYS.flatMap((position) => [
      scoring.goal[position],
      scoring.penaltyGoal[position],
      scoring.assist[position],
      scoring.cleanSheet[position],
    ]),
    scoring.missedPenalty,
    scoring.mvp,
    scoring.penaltySaved,
    scoring.shootoutPenaltySaved,
    scoring.shootoutGoal,
    scoring.shootoutMissedPenalty,
    scoring.yellowCard,
    scoring.redCard,
    scoring.award.goldenBoot,
    scoring.award.tournamentMvp,
  ]);
}

export function buildConfigPayloadFrom(input: {
  scoring: GroupScoringConfig;
  bracketScoring: AdminBracketScoringConfig;
  playerScoring: AdminPlayerScoringConfig;
  playerSelectionLimits: PlayerSelectionLimits;
  awardWinners: { goldenBootPlayerIds: string[]; tournamentMvpPlayerId: string };
  deadlineLocal: string;
  matchdaySeparatorTime: string;
  entryFee: number;
  memberCount: number;
  prizeDistribution: PrizePayout[];
}) {
  const scoring = groupScoringMissingCount(input.scoring) === 0
    ? { winnerPoints: input.scoring.winnerPoints, exactResultPoints: input.scoring.exactResultPoints }
    : null;
  const firstBracketRound = input.bracketScoring.rounds[PHASES[0].key];
  const bracketScoring = bracketScoringMissingCount(input.bracketScoring) === 0
    ? {
        exactPositionPoints: firstBracketRound.exactPositionPoints,
        correctTeamWrongPositionPoints: firstBracketRound.correctTeamWrongPositionPoints,
        tournamentWinnerPoints: input.bracketScoring.tournamentWinnerPoints,
        rounds: input.bracketScoring.rounds,
      }
    : null;
  const entryFee = Number.isFinite(input.entryFee) ? Math.max(0, input.entryFee) : 0;
  const memberCount = Number.isFinite(input.memberCount)
    ? Math.max(0, Math.floor(input.memberCount))
    : 0;
  const prizePoolTotal = entryFee * memberCount;
  const prizeTotal = input.prizeDistribution.reduce((sum, row) => sum + row.amount, 0);
  const ranks = input.prizeDistribution.map((row) => row.rank);
  const ranksAreValid =
    ranks.every((rank) => Number.isInteger(rank) && rank >= 1 && rank <= memberCount) &&
    new Set(ranks).size === ranks.length;
  const amountsAreValid = input.prizeDistribution.every(
    (row) => Number.isFinite(row.amount) && row.amount > 0,
  );
  const prizeDistributionIsValid =
    prizePoolTotal === 0
      ? input.prizeDistribution.length === 0
      : input.prizeDistribution.length > 0 &&
        ranksAreValid &&
        amountsAreValid &&
        Math.abs(prizeTotal - prizePoolTotal) <= 0.01;

  return {
    scoring,
    bracketScoring,
    playerScoring: input.playerScoring,
    playerSelectionLimits: input.playerSelectionLimits,
    playerAwardWinners: { goldenBootPlayerIds: input.awardWinners.goldenBootPlayerIds, tournamentMvpPlayerId: input.awardWinners.tournamentMvpPlayerId || '' },
    deadline: fromDateTimeLocal(input.deadlineLocal),
    matchdaySeparatorTime: normalizeMatchdaySeparatorTime(input.matchdaySeparatorTime),
    entryFee,
    ...(prizeDistributionIsValid
      ? {
          prizeDistribution: {
            paidPositions: input.prizeDistribution.length,
            payouts: input.prizeDistribution.map((row) => ({
              rank: row.rank,
              amount: Number(row.amount.toFixed(2)),
            })),
          },
        }
      : {}),
  };
}

function normalizeMatchdaySeparatorTime(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_MATCHDAY_SEPARATOR_TIME;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return DEFAULT_MATCHDAY_SEPARATOR_TIME;
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return DEFAULT_MATCHDAY_SEPARATOR_TIME;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function computePlayerPoints(player: TournamentPlayer, scoring: AdminPlayerScoringConfig): number {
  const cleanSheetPoints = (player.cleanSheets || 0) * pointsValue(scoring.cleanSheet[player.position]);
  const assistPoints = (player.assists || 0) * pointsValue(scoring.assist[player.position]);
  const cardPoints = (player.yellowCards || 0) * pointsValue(scoring.yellowCard) + (player.redCards || 0) * pointsValue(scoring.redCard);
  return (player.goals || 0) * pointsValue(scoring.goal[player.position]) +
    (player.penaltyGoals || 0) * pointsValue(scoring.penaltyGoal[player.position]) +
    (player.missedPenalties || 0) * pointsValue(scoring.missedPenalty) +
    (player.mvps || 0) * pointsValue(scoring.mvp) +
    (player.penaltiesSaved || 0) * pointsValue(scoring.penaltySaved) +
    (player.shootoutPenaltiesSaved || 0) * pointsValue(scoring.shootoutPenaltySaved) +
    (player.shootoutGoals || 0) * pointsValue(scoring.shootoutGoal) +
    (player.shootoutMissedPenalties || 0) * pointsValue(scoring.shootoutMissedPenalty) +
    cleanSheetPoints + assistPoints + cardPoints;
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AdminContextValue {
  systemMode: boolean;
  poolId: string;
  poolName: string;
  setPoolName: React.Dispatch<React.SetStateAction<string>>;
  poolMemberCount: number;
  loading: boolean;
  error: string | null;
  groups: string[];
  matchesByGroup: Record<string, Match[]>;
  results: Record<string, { homeResult: number | ''; awayResult: number | '' }>;
  submitting: string | null;
  scoringConfig: GroupScoringConfig;
  setScoringConfig: React.Dispatch<React.SetStateAction<GroupScoringConfig>>;
  bracketScoringConfig: AdminBracketScoringConfig;
  setBracketScoringConfig: React.Dispatch<React.SetStateAction<AdminBracketScoringConfig>>;
  playerScoringConfig: AdminPlayerScoringConfig;
  setPlayerScoringConfig: React.Dispatch<React.SetStateAction<AdminPlayerScoringConfig>>;
  playerSelectionLimits: PlayerSelectionLimits;
  setPlayerSelectionLimits: React.Dispatch<React.SetStateAction<PlayerSelectionLimits>>;
  savingConfig: boolean;
  deadlineLocal: string;
  setDeadlineLocal: React.Dispatch<React.SetStateAction<string>>;
  matchdaySeparatorTime: string;
  setMatchdaySeparatorTime: React.Dispatch<React.SetStateAction<string>>;
  entryFee: number;
  setEntryFee: React.Dispatch<React.SetStateAction<number>>;
  prizeDistribution: PrizePayout[];
  setPrizeDistribution: React.Dispatch<React.SetStateAction<PrizePayout[]>>;
  playerAwardWinnersConfig: { goldenBootPlayerIds: string[]; tournamentMvpPlayerId: string };
  setPlayerAwardWinnersConfig: React.Dispatch<React.SetStateAction<{ goldenBootPlayerIds: string[]; tournamentMvpPlayerId: string }>>;
  bracket: Record<string, BracketMatch[]>;
  teams: Team[];
  players: TournamentPlayer[];
  playerFilter: string;
  setPlayerFilter: React.Dispatch<React.SetStateAction<string>>;
  playerCountryFilter: string;
  setPlayerCountryFilter: React.Dispatch<React.SetStateAction<string>>;
  playerPositionFilter: string;
  setPlayerPositionFilter: React.Dispatch<React.SetStateAction<string>>;
  updatingPlayerStat: string | null;
  updatingPlayerAward: string | null;
  updatingTeamFairPlay: string | null;
  updatingMatch: string | null;
  submittingBracketResult: string | null;
  bracketResults: Record<string, { homeResult: number | ''; awayResult: number | '' }>;
  maxPrizePaidPositions: number;
  prizeTotal: number;
  prizePoolTotal: number;
  prizeRanksInvalid: boolean;
  prizeTotalInvalid: boolean;
  groupConfigMissingCount: number;
  finalConfigMissingCount: number;
  playersConfigMissingCount: number;
  handleResultChange: (matchId: string, side: 'home' | 'away', value: string) => void;
  handleUpdateTeam: (bracketMatchId: string, side: 'home' | 'away', teamId: string, teamName: string) => Promise<void>;
  handleBracketResultChange: (bracketMatchId: string, homeResult: number | '', awayResult: number | '') => void;
  handleSaveBracketResult: (bracketMatchId: string, homeResult: number, awayResult: number) => Promise<void>;
  handleReEvaluateBracket: () => Promise<void>;
  handlePlayerStatChange: (player: TournamentPlayer, stat: PlayerStatKey, delta: number, match: PlayerMatchReference | null) => Promise<void>;
  handlePlayerAwardToggle: (player: TournamentPlayer, award: PlayerAward, selected: boolean) => Promise<void>;
  handleTeamFairPlayChange: (teamId: string, fairPlay: number) => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdminContext(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminContext must be used inside AdminProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminProvider({
  poolId,
  children,
  systemMode = false,
}: {
  poolId: string;
  children: React.ReactNode;
  systemMode?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();

  const [matchesByGroup, setMatchesByGroup] = useState<Record<string, Match[]>>({});
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const resultSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastSavedConfig = useRef<string | null>(null);
  const configSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedName = useRef<string | null>(null);
  const nameSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [results, setResults] = useState<Record<string, { homeResult: number | ''; awayResult: number | '' }>>({});
  const [scoringConfig, setScoringConfig] = useState<GroupScoringConfig>(EMPTY_GROUP_SCORING);
  const [bracketScoringConfig, setBracketScoringConfig] = useState<AdminBracketScoringConfig>(emptyBracketScoring());
  const [playerScoringConfig, setPlayerScoringConfig] = useState<AdminPlayerScoringConfig>(DEFAULT_PLAYER_SCORING);
  const [playerSelectionLimits, setPlayerSelectionLimits] = useState<PlayerSelectionLimits>(
    DEFAULT_PLAYER_SELECTION_LIMITS,
  );
  const [savingConfig, setSavingConfig] = useState(false);
  const [poolName, setPoolName] = useState<string>('');
  const [poolMemberCount, setPoolMemberCount] = useState<number>(0);
  const [deadlineLocal, setDeadlineLocal] = useState<string>(toDateTimeLocal(DEFAULT_POOL_DEADLINE));
  const [matchdaySeparatorTime, setMatchdaySeparatorTime] = useState<string>(DEFAULT_MATCHDAY_SEPARATOR_TIME);
  const [entryFee, setEntryFee] = useState<number>(0);
  const [prizeDistribution, setPrizeDistribution] = useState<PrizePayout[]>([]);
  const [playerAwardWinnersConfig, setPlayerAwardWinnersConfig] = useState<{ goldenBootPlayerIds: string[]; tournamentMvpPlayerId: string }>({ goldenBootPlayerIds: [], tournamentMvpPlayerId: '' });
  const [bracket, setBracket] = useState<Record<string, BracketMatch[]>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [playerFilter, setPlayerFilter] = useState('');
  const [playerCountryFilter, setPlayerCountryFilter] = useState('');
  const [playerPositionFilter, setPlayerPositionFilter] = useState('');
  const [updatingPlayerStat, setUpdatingPlayerStat] = useState<string | null>(null);
  const [updatingPlayerAward, setUpdatingPlayerAward] = useState<string | null>(null);
  const [updatingTeamFairPlay, setUpdatingTeamFairPlay] = useState<string | null>(null);
  const [updatingMatch, setUpdatingMatch] = useState<string | null>(null);
  const [submittingBracketResult, setSubmittingBracketResult] = useState<string | null>(null);
  const [bracketResults, setBracketResults] = useState<Record<string, { homeResult: number | ''; awayResult: number | '' }>>({});

  useEffect(() => {
    if (systemMode && user && user.role !== 'admin') {
      toast.error(t('adminResults.errors.adminRequired'));
      router.push('/pools');
    }
  }, [user, router, systemMode, t]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const matchesResponse = await apiClient.get(`/pools/${poolId}/matches`);

        const matchesData = matchesResponse.data || {};
        const matchesList: Match[] = matchesData.matches || [];
        setMatchesByGroup(matchesData.matchesByGroup || {});
        setGroups(matchesData.groups || []);

        const resultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
        matchesList.forEach((match) => {
          resultsMap[match.matchId] = {
            homeResult: typeof match.homeResult === 'number' ? match.homeResult : '',
            awayResult: typeof match.awayResult === 'number' ? match.awayResult : '',
          };
        });
        setResults(resultsMap);

        if (poolId) {
          const [poolResponse, bracketResponse, teamsResponse, playersResponse] = await Promise.all([
            systemMode
              ? Promise.resolve({ data: {} })
              : apiClient.get(`/pools/${poolId}`).catch(() => ({ data: {} })),
            apiClient.get(`/pools/${poolId}/bracket`).catch(() => ({ data: {} })),
            apiClient.get(`/pools/${poolId}/matches/teams`).catch(() => ({ data: [] })),
            apiClient.get(`/pools/${poolId}/players`).catch(() => ({ data: { players: [] } })),
          ]);

          const pool = { ...poolResponse.data };
          if (!systemMode && pool?.userMembership?.role !== 'admin') {
            toast.error(t('adminResults.errors.poolAdminRequired'));
            router.push(`/pools/${poolId}`);
            return;
          }
          setPoolName(pool?.name);
          lastSavedName.current = pool?.name ?? '';
          const memberCount = Number.isFinite(pool?.memberCount) ? Math.max(0, Math.floor(pool.memberCount)) : 0;
          setPoolMemberCount(memberCount);
          setDeadlineLocal(toDateTimeLocal(resolveDeadline(pool)));
          setMatchdaySeparatorTime(normalizeMatchdaySeparatorTime(pool?.config?.matchdaySeparatorTime));
          setEntryFee(typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : 0);
          const loadedEntryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : 0;
          const loadedPrizePoolTotal = loadedEntryFee * memberCount;
          setPrizeDistribution(normalizePrizeDistribution(
            pool?.config?.prizeDistribution,
            prizePaidPositionsLimit(memberCount),
            loadedPrizePoolTotal,
          ));
          const loadedScoring = normalizeGroupScoring(pool?.config?.scoring);
          const loadedBracketScoring = normalizeBracketScoring(pool?.config?.bracketScoring);
          const loadedPlayerScoring = normalizePlayerScoring(pool?.config?.playerScoring);
          const loadedPlayerSelectionLimits = resolvePlayerSelectionLimits(
            pool?.config?.playerSelectionLimits,
          );
          setScoringConfig(loadedScoring);
          setBracketScoringConfig(loadedBracketScoring);
          setPlayerScoringConfig(loadedPlayerScoring);
          setPlayerSelectionLimits(loadedPlayerSelectionLimits);

          const awardWinnerSource = systemMode
            ? playersResponse.data?.awardWinners
            : pool?.config?.playerAwardWinners;
          const loadedAwardWinners = {
            goldenBootPlayerIds: Array.isArray(awardWinnerSource?.goldenBootPlayerIds)
              ? awardWinnerSource.goldenBootPlayerIds.filter((id: unknown): id is string => typeof id === 'string')
              : [],
            tournamentMvpPlayerId: typeof awardWinnerSource?.tournamentMvpPlayerId === 'string'
              ? awardWinnerSource.tournamentMvpPlayerId
              : '',
          };
          setPlayerAwardWinnersConfig(loadedAwardWinners);

          const loadedDeadlineLocal = toDateTimeLocal(resolveDeadline(pool));
          const loadedMatchdaySeparatorTime = normalizeMatchdaySeparatorTime(pool?.config?.matchdaySeparatorTime);
          const loadedPrizeDistribution = normalizePrizeDistribution(
            pool?.config?.prizeDistribution,
            prizePaidPositionsLimit(memberCount),
            loadedPrizePoolTotal,
          );
          lastSavedConfig.current = JSON.stringify(buildConfigPayloadFrom({ scoring: loadedScoring, bracketScoring: loadedBracketScoring, playerScoring: loadedPlayerScoring, playerSelectionLimits: loadedPlayerSelectionLimits, awardWinners: loadedAwardWinners, deadlineLocal: loadedDeadlineLocal, matchdaySeparatorTime: loadedMatchdaySeparatorTime, entryFee: loadedEntryFee, memberCount, prizeDistribution: loadedPrizeDistribution }));

          const bracketData = bracketResponse.data || {};
          setBracket(bracketData);
          setTeams(teamsResponse.data || []);
          setPlayers(playersResponse.data?.players || []);

          const bracketResultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
          Object.values(bracketData || {}).flat().forEach((match: any) => {
            if (match.bracketMatchId) bracketResultsMap[match.bracketMatchId] = { homeResult: typeof match.homeResult === 'number' ? match.homeResult : '', awayResult: typeof match.awayResult === 'number' ? match.awayResult : '' };
          });
          setBracketResults(bracketResultsMap);

          let needsRefresh = false;
          for (const phase of PHASES) {
            const phaseMatches = bracketData[phase.key] || [];
            if (phaseMatches.length === 0) {
              try { await apiClient.post(`/pools/${poolId}/bracket/phases/${phase.key}`, { numberOfMatches: phase.matches }); needsRefresh = true; } catch {}
            } else if (phaseMatches.length !== phase.matches) {
              try { await apiClient.post(`/pools/${poolId}/bracket/phases/${phase.key}`, { numberOfMatches: phase.matches, forceRecreate: true }); needsRefresh = true; } catch {}
            }
          }
          if (needsRefresh) {
            const updated = await apiClient.get(`/pools/${poolId}/bracket`);
            const updatedData = updated.data || {};
            setBracket(updatedData);
            const updatedResultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
            Object.values(updatedData || {}).flat().forEach((match: any) => {
              if (match.bracketMatchId) updatedResultsMap[match.bracketMatchId] = { homeResult: match.homeResult !== undefined ? match.homeResult : '', awayResult: match.awayResult !== undefined ? match.awayResult : '' };
            });
            setBracketResults(updatedResultsMap);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || t('adminResults.errors.loadData'));
      } finally {
        setLoading(false);
      }
    };
    if (user && (!systemMode || user.role === 'admin')) fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, t, poolId, systemMode]);

  useEffect(() => {
    if (systemMode || loading || entryFee !== 0) return;
    if (prizeDistribution.length > 0) setPrizeDistribution([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryFee, loading, systemMode]);

  useEffect(() => {
    if (systemMode || loading) return;
    if (!poolId) return;
    if (configSaveTimer.current) clearTimeout(configSaveTimer.current);
    configSaveTimer.current = setTimeout(() => {
      configSaveTimer.current = null;
      void autoSaveConfig();
    }, 600);
    return () => { if (configSaveTimer.current) { clearTimeout(configSaveTimer.current); configSaveTimer.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoringConfig, bracketScoringConfig, playerScoringConfig, playerSelectionLimits, playerAwardWinnersConfig, deadlineLocal, matchdaySeparatorTime, entryFee, prizeDistribution, poolId, loading, systemMode]);

  useEffect(() => {
    if (systemMode || loading || !poolId) return;
    if (nameSaveTimer.current) clearTimeout(nameSaveTimer.current);
    nameSaveTimer.current = setTimeout(async () => {
      nameSaveTimer.current = null;
      const trimmed = poolName.trim();
      if (!trimmed || trimmed === lastSavedName.current) return;
      try {
        await apiClient.put(`/pools/${poolId}`, { name: trimmed });
        lastSavedName.current = trimmed;
      } catch (err: any) {
        toast.error(err.response?.data?.message || t('pools.errors.update'));
      }
    }, 600);
    return () => { if (nameSaveTimer.current) { clearTimeout(nameSaveTimer.current); nameSaveTimer.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolName, poolId, loading, systemMode]);

  const autoSaveConfig = async () => {
    if (!poolId) return;
    if (prizeTotalInvalid) return;
    const payload = buildConfigPayloadFrom({ scoring: scoringConfig, bracketScoring: bracketScoringConfig, playerScoring: playerScoringConfig, playerSelectionLimits, awardWinners: playerAwardWinnersConfig, deadlineLocal, matchdaySeparatorTime, entryFee, memberCount: poolMemberCount, prizeDistribution });
    const snapshot = JSON.stringify(payload);
    if (snapshot === lastSavedConfig.current) return;
    try {
      setSavingConfig(true);
      await apiClient.put(`/pools/${poolId}/configuration`, payload);
      lastSavedConfig.current = snapshot;
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.saveScoring'));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleResultChange = (matchId: string, side: 'home' | 'away', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    const numValue = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setResults((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [side === 'home' ? 'homeResult' : 'awayResult']: numValue, [side === 'home' ? 'awayResult' : 'homeResult']: prev[matchId]?.[side === 'home' ? 'awayResult' : 'homeResult'] ?? '' } }));
    const existing = resultSaveTimers.current[matchId];
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      delete resultSaveTimers.current[matchId];
      setResults((current) => {
        const r = current[matchId];
        if (r && r.homeResult !== '' && r.awayResult !== '') {
          void autoSaveResults(matchId, r.homeResult as number, r.awayResult as number);
        } else if (r && r.homeResult === '' && r.awayResult === '') {
          void autoSaveResults(matchId, null, null);
        }
        return current;
      });
    }, 500);
    resultSaveTimers.current[matchId] = timer;
  };

  const autoSaveResults = async (matchId: string, homeResult: number | null, awayResult: number | null) => {
    try {
      setSubmitting(matchId);
      const response = await apiClient.post(`/pools/${poolId}/matches/${matchId}/results`, { homeResult, awayResult });
      const saved = response.data;
      if (saved?.matchId) {
        setResults((prev) => ({
          ...prev,
          [saved.matchId]: {
            homeResult: typeof saved.homeResult === 'number' ? saved.homeResult : '',
            awayResult: typeof saved.awayResult === 'number' ? saved.awayResult : '',
          },
        }));
        setMatchesByGroup((prev) => {
          const next: Record<string, Match[]> = {};
          for (const [group, matches] of Object.entries(prev)) {
            next[group] = matches.map((match) =>
              match.matchId === saved.matchId
                ? { ...match, homeResult: saved.homeResult, awayResult: saved.awayResult, status: saved.status ?? 'completed' }
                : match,
            );
          }
          return next;
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.saveResults'));
    } finally {
      setSubmitting((current) => (current === matchId ? null : current));
    }
  };

  const handleUpdateTeam = async (bracketMatchId: string, side: 'home' | 'away', teamId: string, teamName: string) => {
    if (!poolId) { toast.error(t('adminResults.errors.selectPoolFirst')); return; }
    try {
      setUpdatingMatch(bracketMatchId);
      await apiClient.put(`/pools/${poolId}/bracket/matches/${bracketMatchId}/team`, { side, teamId, teamName });
      const [bracketResponse, teamsResponse] = await Promise.all([apiClient.get(`/pools/${poolId}/bracket`), apiClient.get(`/pools/${poolId}/matches/teams`).catch(() => ({ data: [] }))]);
      setBracket(bracketResponse.data || {});
      setTeams(teamsResponse.data || []);
      const bracketResultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
      Object.values(bracketResponse.data || {}).flat().forEach((match: any) => {
        if (match.bracketMatchId) bracketResultsMap[match.bracketMatchId] = { homeResult: typeof match.homeResult === 'number' ? match.homeResult : '', awayResult: typeof match.awayResult === 'number' ? match.awayResult : '' };
      });
      setBracketResults(bracketResultsMap);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.updateTeam'));
    } finally {
      setUpdatingMatch(null);
    }
  };

  const handleBracketResultChange = (bracketMatchId: string, homeResult: number | '', awayResult: number | '') => {
    setBracketResults((prev) => ({ ...prev, [bracketMatchId]: { homeResult: homeResult || '', awayResult: awayResult || '' } }));
  };

  const handleSaveBracketResult = async (bracketMatchId: string, homeResult: number, awayResult: number) => {
    if (!poolId) { toast.error(t('adminResults.errors.selectPoolFirst')); return; }
    if (homeResult === 0 && awayResult === 0) { toast.error(t('adminResults.errors.enterBothResults')); return; }
    try {
      setSubmittingBracketResult(bracketMatchId);
      await apiClient.put(`/pools/${poolId}/bracket/matches/${bracketMatchId}/result`, { homeResult, awayResult });
      toast.success(t('adminResults.toast.bracketResultSaved'));
      const bracketResponse = await apiClient.get(`/pools/${poolId}/bracket`);
      setBracket(bracketResponse.data || {});
      const bracketResultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
      Object.values(bracketResponse.data || {}).flat().forEach((match: any) => {
        if (match.bracketMatchId) bracketResultsMap[match.bracketMatchId] = { homeResult: typeof match.homeResult === 'number' ? match.homeResult : '', awayResult: typeof match.awayResult === 'number' ? match.awayResult : '' };
      });
      setBracketResults(bracketResultsMap);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.saveBracketResult'));
    } finally {
      setSubmittingBracketResult(null);
    }
  };

  const handlePlayerStatChange = async (
    player: TournamentPlayer,
    stat: PlayerStatKey,
    delta: number,
    match: PlayerMatchReference | null,
  ) => {
    if (!poolId) { toast.error(t('adminResults.errors.selectPoolFirst')); return; }
    if (!match) { toast.error(t('adminResults.players.matchRequired')); return; }
    const key = `${player.playerId}:${stat}`;
    try {
      setUpdatingPlayerStat(key);
      const updated = await apiClient.put(`/pools/${poolId}/players/${player.playerId}/stats`, {
        ...match,
        stat,
        delta,
      });
      setPlayers((prev) => prev.map((item) => item.playerId === player.playerId ? (() => { const nextPlayer = { ...item, goals: updated.data?.goals ?? item.goals, penaltyGoals: updated.data?.penaltyGoals ?? item.penaltyGoals, missedPenalties: updated.data?.missedPenalties ?? item.missedPenalties, mvps: updated.data?.mvps ?? item.mvps, penaltiesSaved: updated.data?.penaltiesSaved ?? item.penaltiesSaved, shootoutPenaltiesSaved: updated.data?.shootoutPenaltiesSaved ?? item.shootoutPenaltiesSaved, shootoutGoals: updated.data?.shootoutGoals ?? item.shootoutGoals, shootoutMissedPenalties: updated.data?.shootoutMissedPenalties ?? item.shootoutMissedPenalties, cleanSheets: updated.data?.cleanSheets ?? item.cleanSheets, assists: updated.data?.assists ?? item.assists, yellowCards: updated.data?.yellowCards ?? item.yellowCards, redCards: updated.data?.redCards ?? item.redCards }; return { ...nextPlayer, totalPoints: computePlayerPoints(nextPlayer, playerScoringConfig) }; })() : item));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.updatePlayerStats'));
    } finally {
      setUpdatingPlayerStat(null);
    }
  };

  const handlePlayerAwardToggle = async (
    player: TournamentPlayer,
    award: PlayerAward,
    selected: boolean,
  ) => {
    const key = `${award}:${player.playerId}`;
    try {
      setUpdatingPlayerAward(key);
      const response = await apiClient.put(`/pools/${poolId}/players/award-result`, {
        award,
        playerId: player.playerId,
        selected,
      });
      setPlayerAwardWinnersConfig({
        goldenBootPlayerIds: Array.isArray(response.data?.goldenBootPlayerIds)
          ? response.data.goldenBootPlayerIds
          : [],
        tournamentMvpPlayerId: response.data?.tournamentMvpPlayerId || '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.updatePlayerAward'));
    } finally {
      setUpdatingPlayerAward((current) => (current === key ? null : current));
    }
  };

  const handleTeamFairPlayChange = async (teamId: string, fairPlay: number) => {
    try {
      setUpdatingTeamFairPlay(teamId);
      const updated = await apiClient.put(`/pools/${poolId}/matches/teams/${teamId}/fair-play`, { fairPlay });
      setTeams((prev) => prev.map((team) => (
        team.teamId === teamId
          ? { ...team, fairPlay: updated.data?.fairPlay ?? fairPlay }
          : team
      )));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.updateFairPlay'));
      throw err;
    } finally {
      setUpdatingTeamFairPlay((current) => (current === teamId ? null : current));
    }
  };

  const handleReEvaluateBracket = async () => {
    try {
      await apiClient.post(`/pools/${poolId}/bracket/re-evaluate`);
      toast.success(t('adminResults.toast.bracketReEvaluated'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.bracketReEvaluate'));
    }
  };

  const maxPrizePaidPositions = prizePaidPositionsLimit(poolMemberCount);
  const prizePoolTotal = entryFee * poolMemberCount;
  const prizeTotal = prizeDistribution.reduce((sum, row) => sum + row.amount, 0);
  const prizeRanks = prizeDistribution.map((row) => row.rank);
  const prizeRanksInvalid =
    prizeRanks.some(
      (rank) => !Number.isInteger(rank) || rank < 1 || rank > maxPrizePaidPositions,
    ) ||
    new Set(prizeRanks).size !== prizeRanks.length;
  const prizeAmountsInvalid = prizeDistribution.some(
    (row) => !Number.isFinite(row.amount) || row.amount <= 0,
  );
  const prizeTotalInvalid =
    prizePoolTotal > 0
      ? prizeDistribution.length === 0 ||
        prizeRanksInvalid ||
        prizeAmountsInvalid ||
        Math.abs(prizeTotal - prizePoolTotal) > 0.01
      : prizeDistribution.length > 0;
  const groupConfigMissingCount = groupScoringMissingCount(scoringConfig);
  const finalConfigMissingCount = bracketScoringMissingCount(bracketScoringConfig);
  const playersConfigMissingCount = playerScoringMissingCount(playerScoringConfig);
  const value: AdminContextValue = {
    systemMode, poolId, poolName, setPoolName, poolMemberCount, loading, error, groups, matchesByGroup, results, submitting,
    scoringConfig, setScoringConfig, bracketScoringConfig, setBracketScoringConfig,
    playerScoringConfig, setPlayerScoringConfig, playerSelectionLimits, setPlayerSelectionLimits, savingConfig,
    deadlineLocal, setDeadlineLocal, matchdaySeparatorTime, setMatchdaySeparatorTime, entryFee, setEntryFee,
    prizeDistribution, setPrizeDistribution, playerAwardWinnersConfig, setPlayerAwardWinnersConfig,
    bracket, teams, players, playerFilter, setPlayerFilter, playerCountryFilter, setPlayerCountryFilter,
    playerPositionFilter, setPlayerPositionFilter, updatingPlayerStat, updatingPlayerAward, updatingTeamFairPlay, updatingMatch,
    submittingBracketResult, bracketResults, maxPrizePaidPositions, prizeTotal, prizePoolTotal, prizeRanksInvalid, prizeTotalInvalid,
    groupConfigMissingCount, finalConfigMissingCount, playersConfigMissingCount,
    handleResultChange, handleUpdateTeam, handleBracketResultChange, handleSaveBracketResult, handleReEvaluateBracket, handlePlayerStatChange, handlePlayerAwardToggle, handleTeamFairPlayChange,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
