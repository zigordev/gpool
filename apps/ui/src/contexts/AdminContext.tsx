'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';
import { BracketScoringConfig } from '@/types/bracketScoringConfig.type';
import { PlayerStatKey } from '@/types/playerStatKey.type';
import { PrizePayout } from '@/types/prizePayout.type';

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_POOL_DEADLINE = new Date('2026-06-08T00:00:00Z').getTime();

export const PHASES = [
  { key: '16th-finals', labelKey: 'bracket.round.16th', matches: 16 },
  { key: '8th-finals', labelKey: 'bracket.round.8th', matches: 8 },
  { key: 'quarter-finals', labelKey: 'bracket.round.quarter', matches: 4 },
  { key: 'semi-finals', labelKey: 'bracket.round.semi', matches: 2 },
  { key: 'finals', labelKey: 'bracket.round.final', matches: 1 },
] as const;

export const MAX_PAID_POSITIONS = 20;

const DEFAULT_BRACKET_EXACT_POSITION_POINTS = 5;
const DEFAULT_BRACKET_WRONG_POSITION_POINTS = 3;
const DEFAULT_TOURNAMENT_WINNER_POINTS = 10;

export const DEFAULT_PLAYER_SCORING = {
  goal: { goalkeeper: 10, defender: 6, midfielder: 4, forward: 3 },
  missedPenalty: -2,
  mvp: 5,
  penaltySaved: 5,
  cleanSheet: { goalkeeper: 4, defender: 3, midfielder: 1, forward: 0 },
  assist: { goalkeeper: 0, defender: 4, midfielder: 3, forward: 2 },
  yellowCard: -1,
  redCard: -3,
  award: { goldenBoot: 15, tournamentMvp: 15 },
};

// ─── Utility functions ────────────────────────────────────────────────────────

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
  if (!Number.isFinite(memberCount)) return MAX_PAID_POSITIONS;
  return Math.max(0, Math.min(MAX_PAID_POSITIONS, Math.floor(memberCount || 0)));
}

export function normalizePrizeDistribution(value: any, maxPaidPositions = MAX_PAID_POSITIONS): PrizePayout[] {
  const paidPositions = Math.max(0, Math.min(maxPaidPositions, Number.parseInt(String(value?.paidPositions ?? value?.positions ?? 0), 10) || 0));
  const source = Array.isArray(value?.payouts) ? value.payouts : Array.isArray(value) ? value : [];
  const byRank = new Map<number, number>();
  source.forEach((row: any, index: number) => {
    const rank = Number.parseInt(String(row?.rank ?? row?.position ?? index + 1), 10);
    const percentage = Number.parseFloat(String(row?.percentage ?? 0));
    if (Number.isFinite(rank) && rank > 0) byRank.set(rank, Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0);
  });
  return Array.from({ length: paidPositions }, (_, index) => {
    const rank = index + 1;
    return { rank, percentage: byRank.get(rank) ?? 0 };
  });
}

export function resizePrizeDistribution(rows: PrizePayout[], count: number, maxPaidPositions = MAX_PAID_POSITIONS): PrizePayout[] {
  const normalizedCount = Math.max(0, Math.min(maxPaidPositions, count));
  return Array.from({ length: normalizedCount }, (_, index) => ({ rank: index + 1, percentage: rows[index]?.percentage ?? 0 }));
}

export function normalizeBracketScoring(value: any): BracketScoringConfig {
  const baseExact = Number.isFinite(value?.exactPositionPoints) ? Math.max(0, Number(value.exactPositionPoints)) : DEFAULT_BRACKET_EXACT_POSITION_POINTS;
  const baseWrong = Number.isFinite(value?.correctTeamWrongPositionPoints) ? Math.max(0, Number(value.correctTeamWrongPositionPoints)) : DEFAULT_BRACKET_WRONG_POSITION_POINTS;
  const tournamentWinnerPoints = Number.isFinite(value?.tournamentWinnerPoints) ? Math.max(0, Number(value.tournamentWinnerPoints)) : DEFAULT_TOURNAMENT_WINNER_POINTS;
  const rounds = PHASES.reduce<Record<string, any>>((acc, phase) => {
    const round = value?.rounds?.[phase.key] || {};
    acc[phase.key] = {
      exactPositionPoints: Number.isFinite(round.exactPositionPoints) ? Math.max(0, Number(round.exactPositionPoints)) : baseExact,
      correctTeamWrongPositionPoints: Number.isFinite(round.correctTeamWrongPositionPoints) ? Math.max(0, Number(round.correctTeamWrongPositionPoints)) : baseWrong,
    };
    return acc;
  }, {});
  return { exactPositionPoints: baseExact, correctTeamWrongPositionPoints: baseWrong, tournamentWinnerPoints, rounds };
}

export function resolveCleanSheetScoring(value: any): typeof DEFAULT_PLAYER_SCORING.cleanSheet {
  const legacy = Number(value);
  const source = value && typeof value === 'object' ? value : {};
  return {
    goalkeeper: Number.isFinite(Number(source.goalkeeper)) ? Math.max(0, Number(source.goalkeeper)) : Number.isFinite(legacy) ? Math.max(0, legacy) : DEFAULT_PLAYER_SCORING.cleanSheet.goalkeeper,
    defender: Number.isFinite(Number(source.defender)) ? Math.max(0, Number(source.defender)) : DEFAULT_PLAYER_SCORING.cleanSheet.defender,
    midfielder: Number.isFinite(Number(source.midfielder)) ? Math.max(0, Number(source.midfielder)) : DEFAULT_PLAYER_SCORING.cleanSheet.midfielder,
    forward: Number.isFinite(Number(source.forward)) ? Math.max(0, Number(source.forward)) : DEFAULT_PLAYER_SCORING.cleanSheet.forward,
  };
}

export function buildConfigPayloadFrom(input: {
  scoring: { winnerPoints: number; exactResultPoints: number };
  bracketScoring: BracketScoringConfig;
  playerScoring: typeof DEFAULT_PLAYER_SCORING;
  awardWinners: { goldenBootPlayerIds: string[]; tournamentMvpPlayerId: string };
  deadlineLocal: string;
  entryFee: number;
  prizeDistribution: PrizePayout[];
}) {
  return {
    scoring: { winnerPoints: input.scoring.winnerPoints, exactResultPoints: input.scoring.exactResultPoints },
    bracketScoring: {
      exactPositionPoints: input.bracketScoring.exactPositionPoints,
      correctTeamWrongPositionPoints: input.bracketScoring.correctTeamWrongPositionPoints,
      tournamentWinnerPoints: input.bracketScoring.tournamentWinnerPoints,
      rounds: input.bracketScoring.rounds,
    },
    playerScoring: input.playerScoring,
    playerAwardWinners: { goldenBootPlayerIds: input.awardWinners.goldenBootPlayerIds, tournamentMvpPlayerId: input.awardWinners.tournamentMvpPlayerId || '' },
    deadline: fromDateTimeLocal(input.deadlineLocal),
    entryFee: Number.isFinite(input.entryFee) ? Math.max(0, input.entryFee) : 0,
    prizeDistribution: { paidPositions: input.prizeDistribution.length, payouts: input.prizeDistribution.map((row, index) => ({ rank: index + 1, percentage: Number(row.percentage.toFixed(2)) })) },
  };
}

export function computePlayerPoints(player: TournamentPlayer, scoring: typeof DEFAULT_PLAYER_SCORING): number {
  const cleanSheetPoints = (player.cleanSheets || 0) * scoring.cleanSheet[player.position];
  const assistPoints = (player.assists || 0) * scoring.assist[player.position];
  const cardPoints = (player.yellowCards || 0) * scoring.yellowCard + (player.redCards || 0) * scoring.redCard;
  return (player.goals || 0) * scoring.goal[player.position] + (player.missedPenalties || 0) * scoring.missedPenalty + (player.mvps || 0) * scoring.mvp + (player.penaltiesSaved || 0) * scoring.penaltySaved + cleanSheetPoints + assistPoints + cardPoints;
}

function unwrapArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AdminContextValue {
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
  scoringConfig: { winnerPoints: number; exactResultPoints: number };
  setScoringConfig: React.Dispatch<React.SetStateAction<{ winnerPoints: number; exactResultPoints: number }>>;
  bracketScoringConfig: BracketScoringConfig;
  setBracketScoringConfig: React.Dispatch<React.SetStateAction<BracketScoringConfig>>;
  playerScoringConfig: typeof DEFAULT_PLAYER_SCORING;
  setPlayerScoringConfig: React.Dispatch<React.SetStateAction<typeof DEFAULT_PLAYER_SCORING>>;
  savingConfig: boolean;
  deadlineLocal: string;
  setDeadlineLocal: React.Dispatch<React.SetStateAction<string>>;
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
  updatingMatch: string | null;
  submittingBracketResult: string | null;
  bracketResults: Record<string, { homeResult: number | ''; awayResult: number | '' }>;
  maxPrizePaidPositions: number;
  prizeTotal: number;
  prizeTotalInvalid: boolean;
  poolNotSelected: boolean;
  handleResultChange: (matchId: string, side: 'home' | 'away', value: string) => void;
  handleUpdateTeam: (bracketMatchId: string, side: 'home' | 'away', teamId: string, teamName: string) => Promise<void>;
  handleBracketResultChange: (bracketMatchId: string, homeResult: number | '', awayResult: number | '') => void;
  handleSaveBracketResult: (bracketMatchId: string, homeResult: number, awayResult: number) => Promise<void>;
  handlePlayerStatChange: (player: TournamentPlayer, stat: PlayerStatKey, delta: number) => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdminContext(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminContext must be used inside AdminProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminProvider({ children }: { children: React.ReactNode }) {
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
  const [scoringConfig, setScoringConfig] = useState({ winnerPoints: 1, exactResultPoints: 3 });
  const [bracketScoringConfig, setBracketScoringConfig] = useState<BracketScoringConfig>(normalizeBracketScoring(null));
  const [playerScoringConfig, setPlayerScoringConfig] = useState(DEFAULT_PLAYER_SCORING);
  const [savingConfig, setSavingConfig] = useState(false);
  const [poolId, setPoolId] = useState<string>('all-pools');
  const [poolName, setPoolName] = useState<string>('');
  const [poolMemberCount, setPoolMemberCount] = useState<number>(0);
  const [deadlineLocal, setDeadlineLocal] = useState<string>(toDateTimeLocal(DEFAULT_POOL_DEADLINE));
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
  const [updatingMatch, setUpdatingMatch] = useState<string | null>(null);
  const [submittingBracketResult, setSubmittingBracketResult] = useState<string | null>(null);
  const [bracketResults, setBracketResults] = useState<Record<string, { homeResult: number | ''; awayResult: number | '' }>>({});

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error(t('adminResults.errors.adminRequired'));
      router.push('/pools');
    }
  }, [user, router, t]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [matchesResponse, poolsResponse] = await Promise.all([
          apiClient.get(`/pools/all-pools/matches`),
          apiClient.get('/pools').catch(() => ({ data: [] })),
        ]);

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

        const pools = unwrapArray<PoolSummary>(poolsResponse.data);
        const requestedPoolId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('poolId') : null;
        const selectedPool = (requestedPoolId ? pools.find((pool) => pool.poolId === requestedPoolId) : null) || pools[0];
        if (selectedPool?.poolId) {
          const selectedPoolId = selectedPool.poolId;
          setPoolId(selectedPoolId);

          const [poolResponse, bracketResponse, teamsResponse, playersResponse] = await Promise.all([
            apiClient.get(`/pools/${selectedPoolId}`).catch(() => ({ data: selectedPool })),
            apiClient.get(`/pools/${selectedPoolId}/bracket`).catch(() => ({ data: {} })),
            apiClient.get(`/pools/${selectedPoolId}/matches/teams`).catch(() => ({ data: [] })),
            apiClient.get(`/pools/${selectedPoolId}/players`).catch(() => ({ data: { players: [] } })),
          ]);

          const pool = { ...selectedPool, ...poolResponse.data };
          setPoolName(pool?.name);
          lastSavedName.current = pool?.name ?? '';
          const memberCount = Number.isFinite(pool?.memberCount) ? Math.max(0, Math.floor(pool.memberCount)) : 0;
          setPoolMemberCount(memberCount);
          setDeadlineLocal(toDateTimeLocal(resolveDeadline(pool)));
          if (typeof pool?.config?.entryFee === 'number') setEntryFee(pool.config.entryFee);
          setPrizeDistribution(normalizePrizeDistribution(pool?.config?.prizeDistribution, prizePaidPositionsLimit(memberCount)));

          if (pool?.config?.scoring) setScoringConfig({ winnerPoints: pool.config.scoring.winnerPoints ?? 1, exactResultPoints: pool.config.scoring.exactResultPoints ?? 3 });
          if (pool?.config?.bracketScoring) setBracketScoringConfig(normalizeBracketScoring(pool.config.bracketScoring));
          if (pool?.config?.playerScoring) {
            setPlayerScoringConfig({
              goal: { goalkeeper: pool.config.playerScoring.goal?.goalkeeper ?? DEFAULT_PLAYER_SCORING.goal.goalkeeper, defender: pool.config.playerScoring.goal?.defender ?? DEFAULT_PLAYER_SCORING.goal.defender, midfielder: pool.config.playerScoring.goal?.midfielder ?? DEFAULT_PLAYER_SCORING.goal.midfielder, forward: pool.config.playerScoring.goal?.forward ?? DEFAULT_PLAYER_SCORING.goal.forward },
              missedPenalty: pool.config.playerScoring.missedPenalty ?? DEFAULT_PLAYER_SCORING.missedPenalty,
              mvp: pool.config.playerScoring.mvp ?? DEFAULT_PLAYER_SCORING.mvp,
              penaltySaved: pool.config.playerScoring.penaltySaved ?? DEFAULT_PLAYER_SCORING.penaltySaved,
              cleanSheet: resolveCleanSheetScoring(pool.config.playerScoring.cleanSheet),
              assist: { goalkeeper: pool.config.playerScoring.assist?.goalkeeper ?? DEFAULT_PLAYER_SCORING.assist.goalkeeper, defender: pool.config.playerScoring.assist?.defender ?? DEFAULT_PLAYER_SCORING.assist.defender, midfielder: pool.config.playerScoring.assist?.midfielder ?? DEFAULT_PLAYER_SCORING.assist.midfielder, forward: pool.config.playerScoring.assist?.forward ?? DEFAULT_PLAYER_SCORING.assist.forward },
              yellowCard: pool.config.playerScoring.yellowCard ?? DEFAULT_PLAYER_SCORING.yellowCard,
              redCard: pool.config.playerScoring.redCard ?? DEFAULT_PLAYER_SCORING.redCard,
              award: { goldenBoot: pool.config.playerScoring.award?.goldenBoot ?? DEFAULT_PLAYER_SCORING.award.goldenBoot, tournamentMvp: pool.config.playerScoring.award?.tournamentMvp ?? DEFAULT_PLAYER_SCORING.award.tournamentMvp },
            });
          }

          const loadedAwardWinners = {
            goldenBootPlayerIds: Array.isArray(pool?.config?.playerAwardWinners?.goldenBootPlayerIds) ? pool.config.playerAwardWinners.goldenBootPlayerIds.filter((id: unknown) => typeof id === 'string') : [],
            tournamentMvpPlayerId: typeof pool?.config?.playerAwardWinners?.tournamentMvpPlayerId === 'string' ? pool.config.playerAwardWinners.tournamentMvpPlayerId : '',
          };
          setPlayerAwardWinnersConfig(loadedAwardWinners);

          const loadedScoring = pool?.config?.scoring ? { winnerPoints: pool.config.scoring.winnerPoints ?? 1, exactResultPoints: pool.config.scoring.exactResultPoints ?? 3 } : { winnerPoints: 1, exactResultPoints: 3 };
          const loadedBracketScoring = pool?.config?.bracketScoring ? normalizeBracketScoring(pool.config.bracketScoring) : normalizeBracketScoring({});
          const loadedPlayerScoring = {
            goal: { goalkeeper: pool?.config?.playerScoring?.goal?.goalkeeper ?? DEFAULT_PLAYER_SCORING.goal.goalkeeper, defender: pool?.config?.playerScoring?.goal?.defender ?? DEFAULT_PLAYER_SCORING.goal.defender, midfielder: pool?.config?.playerScoring?.goal?.midfielder ?? DEFAULT_PLAYER_SCORING.goal.midfielder, forward: pool?.config?.playerScoring?.goal?.forward ?? DEFAULT_PLAYER_SCORING.goal.forward },
            missedPenalty: pool?.config?.playerScoring?.missedPenalty ?? DEFAULT_PLAYER_SCORING.missedPenalty,
            mvp: pool?.config?.playerScoring?.mvp ?? DEFAULT_PLAYER_SCORING.mvp,
            penaltySaved: pool?.config?.playerScoring?.penaltySaved ?? DEFAULT_PLAYER_SCORING.penaltySaved,
            cleanSheet: resolveCleanSheetScoring(pool?.config?.playerScoring?.cleanSheet),
            assist: { goalkeeper: pool?.config?.playerScoring?.assist?.goalkeeper ?? DEFAULT_PLAYER_SCORING.assist.goalkeeper, defender: pool?.config?.playerScoring?.assist?.defender ?? DEFAULT_PLAYER_SCORING.assist.defender, midfielder: pool?.config?.playerScoring?.assist?.midfielder ?? DEFAULT_PLAYER_SCORING.assist.midfielder, forward: pool?.config?.playerScoring?.assist?.forward ?? DEFAULT_PLAYER_SCORING.assist.forward },
            yellowCard: pool?.config?.playerScoring?.yellowCard ?? DEFAULT_PLAYER_SCORING.yellowCard,
            redCard: pool?.config?.playerScoring?.redCard ?? DEFAULT_PLAYER_SCORING.redCard,
            award: { goldenBoot: pool?.config?.playerScoring?.award?.goldenBoot ?? DEFAULT_PLAYER_SCORING.award.goldenBoot, tournamentMvp: pool?.config?.playerScoring?.award?.tournamentMvp ?? DEFAULT_PLAYER_SCORING.award.tournamentMvp },
          };
          const loadedDeadlineLocal = toDateTimeLocal(resolveDeadline(pool));
          const loadedEntryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : 0;
          const loadedPrizeDistribution = normalizePrizeDistribution(pool?.config?.prizeDistribution, prizePaidPositionsLimit(memberCount));
          lastSavedConfig.current = JSON.stringify(buildConfigPayloadFrom({ scoring: loadedScoring, bracketScoring: loadedBracketScoring, playerScoring: loadedPlayerScoring, awardWinners: loadedAwardWinners, deadlineLocal: loadedDeadlineLocal, entryFee: loadedEntryFee, prizeDistribution: loadedPrizeDistribution }));

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
              try { await apiClient.post(`/pools/${selectedPoolId}/bracket/phases/${phase.key}`, { numberOfMatches: phase.matches }); needsRefresh = true; } catch {}
            } else if (phaseMatches.length !== phase.matches) {
              try { await apiClient.post(`/pools/${selectedPoolId}/bracket/phases/${phase.key}`, { numberOfMatches: phase.matches, forceRecreate: true }); needsRefresh = true; } catch {}
            }
          }
          if (needsRefresh) {
            const updated = await apiClient.get(`/pools/${selectedPoolId}/bracket`);
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
    if (user?.role === 'admin') fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, t]);

  useEffect(() => {
    if (loading) return;
    if (!poolId || poolId === 'all-pools') return;
    const prizeSum = prizeDistribution.reduce((sum, row) => sum + row.percentage, 0);
    if (prizeDistribution.length > 0 && Math.abs(prizeSum - 100) > 0.01) return;
    if (configSaveTimer.current) clearTimeout(configSaveTimer.current);
    configSaveTimer.current = setTimeout(() => {
      configSaveTimer.current = null;
      void autoSaveConfig();
    }, 600);
    return () => { if (configSaveTimer.current) { clearTimeout(configSaveTimer.current); configSaveTimer.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoringConfig, bracketScoringConfig, playerScoringConfig, playerAwardWinnersConfig, deadlineLocal, entryFee, prizeDistribution, poolId, loading]);

  useEffect(() => {
    if (loading || !poolId || poolId === 'all-pools') return;
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
  }, [poolName, poolId, loading]);

  const autoSaveConfig = async () => {
    if (!poolId || poolId === 'all-pools') return;
    const payload = buildConfigPayloadFrom({ scoring: scoringConfig, bracketScoring: bracketScoringConfig, playerScoring: playerScoringConfig, awardWinners: playerAwardWinnersConfig, deadlineLocal, entryFee, prizeDistribution });
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
        if (r && r.homeResult !== '' && r.awayResult !== '') void autoSaveResults(matchId, r.homeResult as number, r.awayResult as number);
        return current;
      });
    }, 500);
    resultSaveTimers.current[matchId] = timer;
  };

  const autoSaveResults = async (matchId: string, homeResult: number, awayResult: number) => {
    try {
      setSubmitting(matchId);
      const targetPoolId = poolId === 'all-pools' ? 'all-pools' : poolId;
      await apiClient.post(`/pools/${targetPoolId}/matches/${matchId}/results`, { homeResult, awayResult });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.saveResults'));
    } finally {
      setSubmitting((current) => (current === matchId ? null : current));
    }
  };

  const handleUpdateTeam = async (bracketMatchId: string, side: 'home' | 'away', teamId: string, teamName: string) => {
    if (!poolId || poolId === 'all-pools') { toast.error(t('adminResults.errors.selectPoolFirst')); return; }
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
    if (!poolId || poolId === 'all-pools') { toast.error(t('adminResults.errors.selectPoolFirst')); return; }
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

  const handlePlayerStatChange = async (player: TournamentPlayer, stat: PlayerStatKey, delta: number) => {
    if (!poolId || poolId === 'all-pools') { toast.error(t('adminResults.errors.selectPoolFirst')); return; }
    const current = player[stat] || 0;
    const next = Math.max(0, current + delta);
    const key = `${player.playerId}:${stat}`;
    try {
      setUpdatingPlayerStat(key);
      const updated = await apiClient.put(`/pools/${poolId}/players/${player.playerId}/stats`, { goals: player.goals || 0, missedPenalties: player.missedPenalties || 0, mvps: player.mvps || 0, penaltiesSaved: player.penaltiesSaved || 0, cleanSheets: player.cleanSheets || 0, assists: player.assists || 0, yellowCards: player.yellowCards || 0, redCards: player.redCards || 0, [stat]: next });
      setPlayers((prev) => prev.map((item) => item.playerId === player.playerId ? (() => { const nextPlayer = { ...item, goals: updated.data?.goals ?? item.goals, missedPenalties: updated.data?.missedPenalties ?? item.missedPenalties, mvps: updated.data?.mvps ?? item.mvps, penaltiesSaved: updated.data?.penaltiesSaved ?? item.penaltiesSaved, cleanSheets: updated.data?.cleanSheets ?? item.cleanSheets, assists: updated.data?.assists ?? item.assists, yellowCards: updated.data?.yellowCards ?? item.yellowCards, redCards: updated.data?.redCards ?? item.redCards }; return { ...nextPlayer, totalPoints: computePlayerPoints(nextPlayer, playerScoringConfig) }; })() : item));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.updatePlayerStats'));
    } finally {
      setUpdatingPlayerStat(null);
    }
  };

  const maxPrizePaidPositions = prizePaidPositionsLimit(poolMemberCount);
  const prizeTotal = prizeDistribution.reduce((sum, row) => sum + row.percentage, 0);
  const prizeTotalInvalid = prizeDistribution.length > 0 && Math.abs(prizeTotal - 100) > 0.01;
  const poolNotSelected = !poolId || poolId === 'all-pools';

  const value: AdminContextValue = {
    poolId, poolName, setPoolName, poolMemberCount, loading, error, groups, matchesByGroup, results, submitting,
    scoringConfig, setScoringConfig, bracketScoringConfig, setBracketScoringConfig,
    playerScoringConfig, setPlayerScoringConfig, savingConfig,
    deadlineLocal, setDeadlineLocal, entryFee, setEntryFee,
    prizeDistribution, setPrizeDistribution, playerAwardWinnersConfig, setPlayerAwardWinnersConfig,
    bracket, teams, players, playerFilter, setPlayerFilter, playerCountryFilter, setPlayerCountryFilter,
    playerPositionFilter, setPlayerPositionFilter, updatingPlayerStat, updatingMatch,
    submittingBracketResult, bracketResults, maxPrizePaidPositions, prizeTotal, prizeTotalInvalid, poolNotSelected,
    handleResultChange, handleUpdateTeam, handleBracketResultChange, handleSaveBracketResult, handlePlayerStatChange,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}
