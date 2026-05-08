'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { BracketVisualization } from '@/components/BracketVisualization';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Section } from '@/components/ui/Section';
import { countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { FaFutbol, FaMagic, FaShieldAlt, FaStar } from 'react-icons/fa';
import { PiBoxingGlove } from 'react-icons/pi';
import { LuRectangleVertical } from 'react-icons/lu';
import { IoMdCloseCircle } from 'react-icons/io';
import { Loading } from '@/components/Loading';

const DEFAULT_POOL_DEADLINE = new Date('2026-06-08T00:00:00Z').getTime();

function resolveDeadline(pool: any): number {
  const raw = pool?.config?.deadline;
  if (raw == null) return DEFAULT_POOL_DEADLINE;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POOL_DEADLINE;
}

function toDateTimeLocal(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDateTimeLocal(value: string): number {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : DEFAULT_POOL_DEADLINE;
}

const PHASES = [
  { key: '16th-finals', labelKey: 'bracket.round.16th', matches: 16 },
  { key: '8th-finals', labelKey: 'bracket.round.8th', matches: 8 },
  { key: 'quarter-finals', labelKey: 'bracket.round.quarter', matches: 4 },
  { key: 'semi-finals', labelKey: 'bracket.round.semi', matches: 2 },
  { key: 'finals', labelKey: 'bracket.round.final', matches: 1 },
] as const;

const MAX_PAID_POSITIONS = 20;
const DEFAULT_BRACKET_EXACT_POSITION_POINTS = 5;
const DEFAULT_BRACKET_WRONG_POSITION_POINTS = 3;
const DEFAULT_TOURNAMENT_WINNER_POINTS = 10;
const DEFAULT_PLAYER_SCORING = {
  goal: { goalkeeper: 10, defender: 6, midfielder: 4, forward: 3 },
  missedPenalty: -2,
  mvp: 5,
  penaltySaved: 5,
  cleanSheet: { goalkeeper: 4, defender: 3, midfielder: 1, forward: 0 },
  // Per-position assist values. GKs default to 0 since assists are extremely
  // rare for keepers; admins can still configure them.
  assist: { goalkeeper: 0, defender: 4, midfielder: 3, forward: 2 },
  // Cards subtract points — values are stored signed so the math is just a
  // multiplication by the stat count.
  yellowCard: -1,
  redCard: -3,
  award: {
    goldenBoot: 15,
    tournamentMvp: 15,
  },
};

const PLAYER_STAT_ACTIONS: Array<{ key: PlayerStatKey; icon: ReactNode; labelKey: string }> = [
  { key: 'goals', icon: <FaFutbol style={ {color: 'black' } } size='17'/>, labelKey: 'adminResults.players.actions.goals' },
  { key: 'assists', icon: <FaMagic style={ {color: 'black' } } size='17'/>, labelKey: 'adminResults.players.actions.assists' },
  { key: 'mvps', icon: <FaStar style={ {color: 'gold' } } size='17'/>, labelKey: 'adminResults.players.actions.mvps' },
  { key: 'penaltiesSaved', icon: <PiBoxingGlove style={ {color: 'green' } } size='17'/>, labelKey: 'adminResults.players.actions.penaltiesSaved' },
  { key: 'cleanSheets', icon: <FaShieldAlt style={ {color: 'black' } } size='17'/>, labelKey: 'adminResults.players.actions.cleanSheets' },
  { key: 'yellowCards', icon: <LuRectangleVertical style={ {color: 'yellow', fill: 'yellow' } } size='17'/>, labelKey: 'adminResults.players.actions.yellowCards' },
  { key: 'redCards', icon: <LuRectangleVertical style={ {color: 'red', fill: 'red' } } size='17'/>, labelKey: 'adminResults.players.actions.redCards' },
  { key: 'missedPenalties', icon: <IoMdCloseCircle style={ {color: 'red' } } size='17'/>, labelKey: 'adminResults.players.actions.missedPenalties' },
];

function unwrapArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}

function prizePaidPositionsLimit(memberCount?: number): number {
  if (!Number.isFinite(memberCount)) return MAX_PAID_POSITIONS;
  return Math.max(0, Math.min(MAX_PAID_POSITIONS, Math.floor(memberCount || 0)));
}

function normalizePrizeDistribution(value: any, maxPaidPositions = MAX_PAID_POSITIONS): PrizePayout[] {
  const paidPositions = Math.max(
    0,
    Math.min(
      maxPaidPositions,
      Number.parseInt(String(value?.paidPositions ?? value?.positions ?? 0), 10) || 0,
    ),
  );
  const source = Array.isArray(value?.payouts)
    ? value.payouts
    : Array.isArray(value)
    ? value
    : [];
  const byRank = new Map<number, number>();
  source.forEach((row: any, index: number) => {
    const rank = Number.parseInt(String(row?.rank ?? row?.position ?? index + 1), 10);
    const percentage = Number.parseFloat(String(row?.percentage ?? 0));
    if (Number.isFinite(rank) && rank > 0) {
      byRank.set(rank, Number.isFinite(percentage) ? Math.max(0, Math.min(100, percentage)) : 0);
    }
  });

  return Array.from({ length: paidPositions }, (_, index) => {
    const rank = index + 1;
    return { rank, percentage: byRank.get(rank) ?? 0 };
  });
}

function resizePrizeDistribution(rows: PrizePayout[], count: number, maxPaidPositions = MAX_PAID_POSITIONS): PrizePayout[] {
  const normalizedCount = Math.max(0, Math.min(maxPaidPositions, count));
  return Array.from({ length: normalizedCount }, (_, index) => {
    const rank = index + 1;
    return { rank, percentage: rows[index]?.percentage ?? 0 };
  });
}

function normalizeBracketScoring(value: any): BracketScoringConfig {
  const baseExact =
    Number.isFinite(value?.exactPositionPoints)
      ? Math.max(0, Number(value.exactPositionPoints))
      : DEFAULT_BRACKET_EXACT_POSITION_POINTS;
  const baseWrong =
    Number.isFinite(value?.correctTeamWrongPositionPoints)
      ? Math.max(0, Number(value.correctTeamWrongPositionPoints))
      : DEFAULT_BRACKET_WRONG_POSITION_POINTS;
  const tournamentWinnerPoints =
    Number.isFinite(value?.tournamentWinnerPoints)
      ? Math.max(0, Number(value.tournamentWinnerPoints))
      : DEFAULT_TOURNAMENT_WINNER_POINTS;
  const rounds = PHASES.reduce<Record<string, BracketRoundScoring>>((acc, phase) => {
    const round = value?.rounds?.[phase.key] || {};
    acc[phase.key] = {
      exactPositionPoints: Number.isFinite(round.exactPositionPoints)
        ? Math.max(0, Number(round.exactPositionPoints))
        : baseExact,
      correctTeamWrongPositionPoints: Number.isFinite(round.correctTeamWrongPositionPoints)
        ? Math.max(0, Number(round.correctTeamWrongPositionPoints))
        : baseWrong,
    };
    return acc;
  }, {});

  return {
    exactPositionPoints: baseExact,
    correctTeamWrongPositionPoints: baseWrong,
    tournamentWinnerPoints,
    rounds,
  };
}

function resolveCleanSheetScoring(value: any): typeof DEFAULT_PLAYER_SCORING.cleanSheet {
  const legacy = Number(value);
  const source = value && typeof value === 'object' ? value : {};
  return {
    goalkeeper: Number.isFinite(Number(source.goalkeeper))
      ? Math.max(0, Number(source.goalkeeper))
      : Number.isFinite(legacy)
        ? Math.max(0, legacy)
        : DEFAULT_PLAYER_SCORING.cleanSheet.goalkeeper,
    defender: Number.isFinite(Number(source.defender))
      ? Math.max(0, Number(source.defender))
      : DEFAULT_PLAYER_SCORING.cleanSheet.defender,
    midfielder: Number.isFinite(Number(source.midfielder))
      ? Math.max(0, Number(source.midfielder))
      : DEFAULT_PLAYER_SCORING.cleanSheet.midfielder,
    forward: Number.isFinite(Number(source.forward))
      ? Math.max(0, Number(source.forward))
      : DEFAULT_PLAYER_SCORING.cleanSheet.forward,
  };
}

/**
 * Builds the wire payload sent to `PUT /pools/:poolId/configuration`. Pure
 * function (no hooks/state read) so the same shape can be computed both from
 * the React state during auto-save and from the freshly-loaded server values
 * on initial fetch — letting us seed `lastSavedConfig` and avoid saving the
 * data we just loaded straight back to the server.
 */
function buildConfigPayloadFrom(input: {
  scoring: { winnerPoints: number; exactResultPoints: number };
  bracketScoring: BracketScoringConfig;
  playerScoring: typeof DEFAULT_PLAYER_SCORING;
  awardWinners: { goldenBootPlayerIds: string[]; tournamentMvpPlayerId: string };
  deadlineLocal: string;
  entryFee: number;
  prizeDistribution: PrizePayout[];
}) {
  return {
    scoring: {
      winnerPoints: input.scoring.winnerPoints,
      exactResultPoints: input.scoring.exactResultPoints,
    },
    bracketScoring: {
      exactPositionPoints: input.bracketScoring.exactPositionPoints,
      correctTeamWrongPositionPoints: input.bracketScoring.correctTeamWrongPositionPoints,
      tournamentWinnerPoints: input.bracketScoring.tournamentWinnerPoints,
      rounds: input.bracketScoring.rounds,
    },
    playerScoring: input.playerScoring,
    playerAwardWinners: {
      goldenBootPlayerIds: input.awardWinners.goldenBootPlayerIds,
      tournamentMvpPlayerId: input.awardWinners.tournamentMvpPlayerId || '',
    },
    deadline: fromDateTimeLocal(input.deadlineLocal),
    entryFee: Number.isFinite(input.entryFee) ? Math.max(0, input.entryFee) : 0,
    prizeDistribution: {
      paidPositions: input.prizeDistribution.length,
      payouts: input.prizeDistribution.map((row, index) => ({
        rank: index + 1,
        percentage: Number(row.percentage.toFixed(2)),
      })),
    },
  };
}

function computePlayerPoints(player: TournamentPlayer, scoring: typeof DEFAULT_PLAYER_SCORING): number {
  const cleanSheetPoints = (player.cleanSheets || 0) * scoring.cleanSheet[player.position];
  const assistPoints = (player.assists || 0) * scoring.assist[player.position];
  const cardPoints =
    (player.yellowCards || 0) * scoring.yellowCard + (player.redCards || 0) * scoring.redCard;
  return (
    (player.goals || 0) * scoring.goal[player.position] +
    (player.missedPenalties || 0) * scoring.missedPenalty +
    (player.mvps || 0) * scoring.mvp +
    (player.penaltiesSaved || 0) * scoring.penaltySaved +
    cleanSheetPoints +
    assistPoints +
    cardPoints
  );
}

function AdminResultsContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useI18n();

  const [matchesByGroup, setMatchesByGroup] = useState<Record<string, Match[]>>({});
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  // Per-match debounce timers for auto-saving results. Stored on a ref instead
  // of state so the cleared/replaced timers don't trigger unnecessary
  // re-renders mid-keystroke.
  const resultSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // Config auto-save: hold the JSON snapshot of the last persisted config so
  // the effect can short-circuit when the values match (avoids saving the data
  // that we just loaded back to the server). The matching debounce timer
  // collapses fast successive edits into one network call.
  const lastSavedConfig = useRef<string | null>(null);
  const configSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [results, setResults] = useState<Record<string, { homeResult: number | ''; awayResult: number | '' }>>({});
  const [scoringConfig, setScoringConfig] = useState({ winnerPoints: 1, exactResultPoints: 3 });
  const [bracketScoringConfig, setBracketScoringConfig] = useState<BracketScoringConfig>(
    normalizeBracketScoring(null),
  );
  const [playerScoringConfig, setPlayerScoringConfig] = useState(DEFAULT_PLAYER_SCORING);
  const [savingConfig, setSavingConfig] = useState(false);
  const [poolId, setPoolId] = useState<string>('all-pools');
  const [poolName, setPoolName] = useState<string>('');
  const [poolMemberCount, setPoolMemberCount] = useState<number>(0);
  const [deadlineLocal, setDeadlineLocal] = useState<string>(toDateTimeLocal(DEFAULT_POOL_DEADLINE));
  const [entryFee, setEntryFee] = useState<number>(0);
  const [prizeDistribution, setPrizeDistribution] = useState<PrizePayout[]>([]);
  const [playerAwardWinnersConfig, setPlayerAwardWinnersConfig] = useState<{
    goldenBootPlayerIds: string[];
    tournamentMvpPlayerId: string;
  }>({ goldenBootPlayerIds: [], tournamentMvpPlayerId: '' });
  const [bracket, setBracket] = useState<Record<string, BracketMatch[]>>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [playerFilter, setPlayerFilter] = useState('');
  const [playerCountryFilter, setPlayerCountryFilter] = useState('');
  const [updatingPlayerStat, setUpdatingPlayerStat] = useState<string | null>(null);
  const [updatingMatch, setUpdatingMatch] = useState<string | null>(null);
  const [submittingBracketResult, setSubmittingBracketResult] = useState<string | null>(null);
  const [bracketResults, setBracketResults] = useState<Record<string, { homeResult: number | ''; awayResult: number | '' }>>({});
  const [activeTab, setActiveTab] = useState<AdminTab>('configuration');

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
        const requestedPoolId =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('poolId')
            : null;
        const selectedPool =
          (requestedPoolId ? pools.find((pool) => pool.poolId === requestedPoolId) : null) ||
          pools[0];
        if (selectedPool.poolId) {
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
          const memberCount = Number.isFinite(pool?.memberCount) ? Math.max(0, Math.floor(pool.memberCount)) : 0;
          setPoolMemberCount(memberCount);
          setDeadlineLocal(toDateTimeLocal(resolveDeadline(pool)));
          if (typeof pool?.config?.entryFee === 'number') {
            setEntryFee(pool.config.entryFee);
          }
          setPrizeDistribution(normalizePrizeDistribution(pool?.config?.prizeDistribution, prizePaidPositionsLimit(memberCount)));
          if (pool?.config?.scoring) {
            setScoringConfig({
              winnerPoints: pool.config.scoring.winnerPoints ?? 1,
              exactResultPoints: pool.config.scoring.exactResultPoints ?? 3,
            });
          }
          if (pool?.config?.bracketScoring) {
            setBracketScoringConfig(normalizeBracketScoring(pool.config.bracketScoring));
          }
          if (pool?.config?.playerScoring) {
            setPlayerScoringConfig({
              goal: {
                goalkeeper: pool.config.playerScoring.goal?.goalkeeper ?? DEFAULT_PLAYER_SCORING.goal.goalkeeper,
                defender: pool.config.playerScoring.goal?.defender ?? DEFAULT_PLAYER_SCORING.goal.defender,
                midfielder: pool.config.playerScoring.goal?.midfielder ?? DEFAULT_PLAYER_SCORING.goal.midfielder,
                forward: pool.config.playerScoring.goal?.forward ?? DEFAULT_PLAYER_SCORING.goal.forward,
              },
              missedPenalty: pool.config.playerScoring.missedPenalty ?? DEFAULT_PLAYER_SCORING.missedPenalty,
              mvp: pool.config.playerScoring.mvp ?? DEFAULT_PLAYER_SCORING.mvp,
              penaltySaved: pool.config.playerScoring.penaltySaved ?? DEFAULT_PLAYER_SCORING.penaltySaved,
              cleanSheet: resolveCleanSheetScoring(pool.config.playerScoring.cleanSheet),
              assist: {
                goalkeeper: pool.config.playerScoring.assist?.goalkeeper ?? DEFAULT_PLAYER_SCORING.assist.goalkeeper,
                defender: pool.config.playerScoring.assist?.defender ?? DEFAULT_PLAYER_SCORING.assist.defender,
                midfielder: pool.config.playerScoring.assist?.midfielder ?? DEFAULT_PLAYER_SCORING.assist.midfielder,
                forward: pool.config.playerScoring.assist?.forward ?? DEFAULT_PLAYER_SCORING.assist.forward,
              },
              yellowCard: pool.config.playerScoring.yellowCard ?? DEFAULT_PLAYER_SCORING.yellowCard,
              redCard: pool.config.playerScoring.redCard ?? DEFAULT_PLAYER_SCORING.redCard,
              award: {
                goldenBoot: pool.config.playerScoring.award?.goldenBoot ?? DEFAULT_PLAYER_SCORING.award.goldenBoot,
                tournamentMvp:
                  pool.config.playerScoring.award?.tournamentMvp ?? DEFAULT_PLAYER_SCORING.award.tournamentMvp,
              },
            });
          }
          const loadedAwardWinners = {
            goldenBootPlayerIds: Array.isArray(pool?.config?.playerAwardWinners?.goldenBootPlayerIds)
              ? pool.config.playerAwardWinners.goldenBootPlayerIds.filter((id: unknown) => typeof id === 'string')
              : [],
            tournamentMvpPlayerId:
              typeof pool?.config?.playerAwardWinners?.tournamentMvpPlayerId === 'string'
                ? pool.config.playerAwardWinners.tournamentMvpPlayerId
                : '',
          };
          setPlayerAwardWinnersConfig(loadedAwardWinners);

          // Seed the auto-save baseline so the first effect run after the
          // initial load doesn't re-PUT the data we just GET'd.
          const loadedScoring = pool?.config?.scoring
            ? {
                winnerPoints: pool.config.scoring.winnerPoints ?? 1,
                exactResultPoints: pool.config.scoring.exactResultPoints ?? 3,
              }
            : { winnerPoints: 1, exactResultPoints: 3 };
          const loadedBracketScoring = pool?.config?.bracketScoring
            ? normalizeBracketScoring(pool.config.bracketScoring)
            : normalizeBracketScoring({});
          const loadedPlayerScoring = {
            goal: {
              goalkeeper: pool?.config?.playerScoring?.goal?.goalkeeper ?? DEFAULT_PLAYER_SCORING.goal.goalkeeper,
              defender: pool?.config?.playerScoring?.goal?.defender ?? DEFAULT_PLAYER_SCORING.goal.defender,
              midfielder: pool?.config?.playerScoring?.goal?.midfielder ?? DEFAULT_PLAYER_SCORING.goal.midfielder,
              forward: pool?.config?.playerScoring?.goal?.forward ?? DEFAULT_PLAYER_SCORING.goal.forward,
            },
            missedPenalty: pool?.config?.playerScoring?.missedPenalty ?? DEFAULT_PLAYER_SCORING.missedPenalty,
            mvp: pool?.config?.playerScoring?.mvp ?? DEFAULT_PLAYER_SCORING.mvp,
            penaltySaved: pool?.config?.playerScoring?.penaltySaved ?? DEFAULT_PLAYER_SCORING.penaltySaved,
            cleanSheet: resolveCleanSheetScoring(pool?.config?.playerScoring?.cleanSheet),
            assist: {
              goalkeeper: pool?.config?.playerScoring?.assist?.goalkeeper ?? DEFAULT_PLAYER_SCORING.assist.goalkeeper,
              defender: pool?.config?.playerScoring?.assist?.defender ?? DEFAULT_PLAYER_SCORING.assist.defender,
              midfielder: pool?.config?.playerScoring?.assist?.midfielder ?? DEFAULT_PLAYER_SCORING.assist.midfielder,
              forward: pool?.config?.playerScoring?.assist?.forward ?? DEFAULT_PLAYER_SCORING.assist.forward,
            },
            yellowCard: pool?.config?.playerScoring?.yellowCard ?? DEFAULT_PLAYER_SCORING.yellowCard,
            redCard: pool?.config?.playerScoring?.redCard ?? DEFAULT_PLAYER_SCORING.redCard,
            award: {
              goldenBoot: pool?.config?.playerScoring?.award?.goldenBoot ?? DEFAULT_PLAYER_SCORING.award.goldenBoot,
              tournamentMvp:
                pool?.config?.playerScoring?.award?.tournamentMvp ?? DEFAULT_PLAYER_SCORING.award.tournamentMvp,
            },
          };
          const loadedDeadlineLocal = toDateTimeLocal(resolveDeadline(pool));
          const loadedEntryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : 0;
          const loadedPrizeDistribution = normalizePrizeDistribution(
            pool?.config?.prizeDistribution,
            prizePaidPositionsLimit(memberCount),
          );
          lastSavedConfig.current = JSON.stringify(
            buildConfigPayloadFrom({
              scoring: loadedScoring,
              bracketScoring: loadedBracketScoring,
              playerScoring: loadedPlayerScoring,
              awardWinners: loadedAwardWinners,
              deadlineLocal: loadedDeadlineLocal,
              entryFee: loadedEntryFee,
              prizeDistribution: loadedPrizeDistribution,
            }),
          );

          const bracketData = bracketResponse.data || {};
          setBracket(bracketData);
          setTeams(teamsResponse.data || []);
          setPlayers(playersResponse.data?.players || []);

          const bracketResultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
          Object.values(bracketData || {}).flat().forEach((match: any) => {
            if (match.bracketMatchId) {
              bracketResultsMap[match.bracketMatchId] = {
                homeResult: typeof match.homeResult === 'number' ? match.homeResult : '',
                awayResult: typeof match.awayResult === 'number' ? match.awayResult : '',
              };
            }
          });
          setBracketResults(bracketResultsMap);

          let needsRefresh = false;
          for (const phase of PHASES) {
            const phaseMatches = bracketData[phase.key] || [];
            if (phaseMatches.length === 0) {
              try {
                await apiClient.post(`/pools/${selectedPoolId}/bracket/phases/${phase.key}`, {
                  numberOfMatches: phase.matches,
                });
                needsRefresh = true;
              } catch {}
            } else if (phaseMatches.length !== phase.matches) {
              try {
                await apiClient.post(`/pools/${selectedPoolId}/bracket/phases/${phase.key}`, {
                  numberOfMatches: phase.matches,
                  forceRecreate: true,
                });
                needsRefresh = true;
              } catch {}
            }
          }

          if (needsRefresh) {
            const updated = await apiClient.get(`/pools/${selectedPoolId}/bracket`);
            const updatedData = updated.data || {};
            setBracket(updatedData);
            const updatedResultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
            Object.values(updatedData || {}).flat().forEach((match: any) => {
              if (match.bracketMatchId) {
                updatedResultsMap[match.bracketMatchId] = {
                  homeResult: match.homeResult !== undefined ? match.homeResult : '',
                  awayResult: match.awayResult !== undefined ? match.awayResult : '',
                };
              }
            });
            setBracketResults(updatedResultsMap);
          }
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || t('adminResults.errors.loadData');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchData();
    }
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

    return () => {
      if (configSaveTimer.current) {
        clearTimeout(configSaveTimer.current);
        configSaveTimer.current = null;
      }
    };
  }, [
    scoringConfig,
    bracketScoringConfig,
    playerScoringConfig,
    playerAwardWinnersConfig,
    deadlineLocal,
    entryFee,
    prizeDistribution,
    poolId,
    loading,
  ]);

  const handleResultChange = (matchId: string, side: 'home' | 'away', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    const numValue = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setResults((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [side === 'home' ? 'homeResult' : 'awayResult']: numValue,
        [side === 'home' ? 'awayResult' : 'homeResult']:
          prev[matchId]?.[side === 'home' ? 'awayResult' : 'homeResult'] ?? '',
      },
    }));

    const existing = resultSaveTimers.current[matchId];
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      delete resultSaveTimers.current[matchId];
      setResults((current) => {
        const r = current[matchId];
        if (r && r.homeResult !== '' && r.awayResult !== '') {
          void autoSaveResults(matchId, r.homeResult, r.awayResult);
        }
        return current;
      });
    }, 500);
    resultSaveTimers.current[matchId] = timer;
  };

  const autoSaveResults = async (matchId: string, homeResult: number, awayResult: number) => {
    try {
      setSubmitting(matchId);
      const targetPoolId = poolId === 'all-pools' ? 'all-pools' : poolId;
      await apiClient.post(`/pools/${targetPoolId}/matches/${matchId}/results`, {
        homeResult,
        awayResult,
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.saveResults'));
    } finally {
      setSubmitting((current) => (current === matchId ? null : current));
    }
  };

  const autoSaveConfig = async () => {
    if (!poolId || poolId === 'all-pools') return;
    const payload = buildConfigPayloadFrom({
      scoring: scoringConfig,
      bracketScoring: bracketScoringConfig,
      playerScoring: playerScoringConfig,
      awardWinners: playerAwardWinnersConfig,
      deadlineLocal,
      entryFee,
      prizeDistribution,
    });
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

  const handleUpdateTeam = async (
    bracketMatchId: string,
    side: 'home' | 'away',
    teamId: string,
    teamName: string,
  ) => {
    if (!poolId || poolId === 'all-pools') {
      toast.error(t('adminResults.errors.selectPoolFirst'));
      return;
    }
    try {
      setUpdatingMatch(bracketMatchId);
      await apiClient.put(`/pools/${poolId}/bracket/matches/${bracketMatchId}/team`, {
        side,
        teamId,
        teamName,
      });

      const [bracketResponse, teamsResponse] = await Promise.all([
        apiClient.get(`/pools/${poolId}/bracket`),
        apiClient.get(`/pools/${poolId}/matches/teams`).catch(() => ({ data: [] })),
      ]);
      setBracket(bracketResponse.data || {});
      setTeams(teamsResponse.data || []);

      const bracketResultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
      Object.values(bracketResponse.data || {}).flat().forEach((match: any) => {
        if (match.bracketMatchId) {
          bracketResultsMap[match.bracketMatchId] = {
            homeResult: typeof match.homeResult === 'number' ? match.homeResult : '',
            awayResult: typeof match.awayResult === 'number' ? match.awayResult : '',
          };
        }
      });
      setBracketResults(bracketResultsMap);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.updateTeam'));
    } finally {
      setUpdatingMatch(null);
    }
  };

  const handleBracketResultChange = (
    bracketMatchId: string,
    homeResult: number | '',
    awayResult: number | '',
  ) => {
    setBracketResults((prev) => ({
      ...prev,
      [bracketMatchId]: {
        homeResult: homeResult || '',
        awayResult: awayResult || '',
      },
    }));
  };

  const handleSaveBracketResult = async (
    bracketMatchId: string,
    homeResult: number,
    awayResult: number,
  ) => {
    if (!poolId || poolId === 'all-pools') {
      toast.error(t('adminResults.errors.selectPoolFirst'));
      return;
    }
    if (homeResult === 0 && awayResult === 0) {
      toast.error(t('adminResults.errors.enterBothResults'));
      return;
    }
    try {
      setSubmittingBracketResult(bracketMatchId);
      await apiClient.put(`/pools/${poolId}/bracket/matches/${bracketMatchId}/result`, {
        homeResult,
        awayResult,
      });
      toast.success(t('adminResults.toast.bracketResultSaved'));

      const bracketResponse = await apiClient.get(`/pools/${poolId}/bracket`);
      setBracket(bracketResponse.data || {});

      const bracketResultsMap: Record<string, { homeResult: number | ''; awayResult: number | '' }> = {};
      Object.values(bracketResponse.data || {}).flat().forEach((match: any) => {
        if (match.bracketMatchId) {
          bracketResultsMap[match.bracketMatchId] = {
            homeResult: typeof match.homeResult === 'number' ? match.homeResult : '',
            awayResult: typeof match.awayResult === 'number' ? match.awayResult : '',
          };
        }
      });
      setBracketResults(bracketResultsMap);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.saveBracketResult'));
    } finally {
      setSubmittingBracketResult(null);
    }
  };

  const handlePlayerStatChange = async (player: TournamentPlayer, stat: PlayerStatKey, delta: number) => {
    if (!poolId || poolId === 'all-pools') {
      toast.error(t('adminResults.errors.selectPoolFirst'));
      return;
    }
    const current = player[stat] || 0;
    const next = Math.max(0, current + delta);
    const key = `${player.playerId}:${stat}`;
    try {
      setUpdatingPlayerStat(key);
      const updated = await apiClient.put(`/pools/${poolId}/players/${player.playerId}/stats`, {
        goals: player.goals || 0,
        missedPenalties: player.missedPenalties || 0,
        mvps: player.mvps || 0,
        penaltiesSaved: player.penaltiesSaved || 0,
        cleanSheets: player.cleanSheets || 0,
        assists: player.assists || 0,
        yellowCards: player.yellowCards || 0,
        redCards: player.redCards || 0,
        [stat]: next,
      });
      setPlayers((prev) =>
        prev.map((item) =>
          item.playerId === player.playerId
            ? (() => {
                const nextPlayer = {
                  ...item,
                  goals: updated.data?.goals ?? item.goals,
                  missedPenalties: updated.data?.missedPenalties ?? item.missedPenalties,
                  mvps: updated.data?.mvps ?? item.mvps,
                  penaltiesSaved: updated.data?.penaltiesSaved ?? item.penaltiesSaved,
                  cleanSheets: updated.data?.cleanSheets ?? item.cleanSheets,
                  assists: updated.data?.assists ?? item.assists,
                  yellowCards: updated.data?.yellowCards ?? item.yellowCards,
                  redCards: updated.data?.redCards ?? item.redCards,
                };
                return { ...nextPlayer, totalPoints: computePlayerPoints(nextPlayer, playerScoringConfig) };
              })()
            : item,
        ),
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.updatePlayerStats'));
    } finally {
      setUpdatingPlayerStat(null);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('common.loading')} />
      </main>
    );
  }

  const poolNotSelected = !poolId;
  const maxPrizePaidPositions = prizePaidPositionsLimit(poolMemberCount);
  const prizeTotal = prizeDistribution.reduce((sum, row) => sum + row.percentage, 0);
  const prizeTotalInvalid = prizeDistribution.length > 0 && Math.abs(prizeTotal - 100) > 0.01;
  const tabs: Array<{ key: AdminTab; label: string }> = [
    { key: 'configuration', label: t('adminResults.tabs.configuration') },
    { key: 'groups', label: t('adminResults.tabs.groupPhase') },
    { key: 'final', label: t('adminResults.tabs.finalPhase') },
    { key: 'players', label: t('adminResults.tabs.players') },
  ];

  return (
    <>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
            }}
          >
            <span>{t('adminResults.title')}</span>
          </h1>
        </div>
      </header>

      <div className="tabs-frame">
        <div
          role="tablist"
          aria-label={t('adminResults.tabs.label')}
          className="tabs-list tabs-list-4"
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.key)}
                className="tab-button"
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'configuration' ? (
          <div className="tabs-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* 1. General configuration — deadline, entry fee, prize split */}
          <Section
            title={t('adminResults.config.general.title')}
            collapsible
            defaultExpanded
            density="compact"
            tone="subtle"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                }}
              >
                <FormField
                  label={t('adminResults.scoring.deadline')}
                  hint={t('adminResults.scoring.deadlineHint')}
                >
                  <Input
                    type="datetime-local"
                    value={deadlineLocal}
                    onChange={(e) => setDeadlineLocal(e.target.value)}
                  />
                </FormField>
                <FormField
                  label={t('adminResults.scoring.entryFee')}
                  hint={t('adminResults.scoring.entryFeeHint')}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    value={entryFee}
                    onChange={(e) => {
                      const v = Number.parseFloat(e.target.value);
                      setEntryFee(Number.isFinite(v) ? Math.max(0, v) : 0);
                    }}
                  />
                </FormField>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(180px, 260px) minmax(0, 1fr)',
                  gap: '1rem',
                  alignItems: 'end',
                }}
              >
                <FormField
                  label={t('adminResults.scoring.prizePaidPositions')}
                  hint={t('adminResults.scoring.prizePaidPositionsHint', { count: maxPrizePaidPositions })}
                >
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max={maxPrizePaidPositions}
                    value={prizeDistribution.length}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10) || 0;
                      setPrizeDistribution((prev) => resizePrizeDistribution(prev, value, maxPrizePaidPositions));
                    }}
                  />
                </FormField>
                <div
                  style={{
                    color: prizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--fg-muted))',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    paddingBottom: '0.65rem',
                  }}
                >
                  {t('adminResults.scoring.prizeTotal', { total: Number(prizeTotal.toFixed(2)) })}
                  {prizeDistribution.length > 0 ? (
                    <span style={{ marginLeft: '0.5rem', color: prizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--pitch))' }}>
                      {prizeTotalInvalid
                        ? t('adminResults.scoring.prizeTotalInvalid')
                        : t('adminResults.scoring.prizeTotalValid')}
                    </span>
                  ) : null}
                </div>
              </div>

              {prizeDistribution.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {prizeDistribution.map((row, index) => (
                    <div
                      key={row.rank}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(7rem, 10rem) minmax(9rem, 13rem) minmax(0, 1fr)',
                        gap: '0.65rem',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: 'rgb(var(--fg))', fontWeight: 700, fontSize: '0.875rem' }}>
                        {t('adminResults.scoring.prizeRank', { rank: row.rank })}
                      </span>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="100"
                        step="0.5"
                        value={row.percentage}
                        invalid={prizeTotalInvalid}
                        aria-label={t('adminResults.scoring.prizePercentage', { rank: row.rank })}
                        onChange={(e) => {
                          const value = Number.parseFloat(e.target.value);
                          const percentage = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
                          setPrizeDistribution((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, percentage } : item,
                            ),
                          );
                        }}
                      />
                      <span style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.8125rem' }}>
                        {t('adminResults.scoring.prizePercentage', { rank: row.rank })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </Section>

          {/* 2. Group phase configuration */}
          <Section
            title={t('adminResults.config.groupPhase.title')}
            collapsible
            defaultExpanded={false}
            density="compact"
            tone="subtle"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem',
              }}
            >
              <FormField label={t('adminResults.scoring.groupPhaseWinner')}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={scoringConfig.winnerPoints}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10) || 0;
                    setScoringConfig((prev) => ({ ...prev, winnerPoints: Math.max(0, value) }));
                  }}
                />
              </FormField>
              <FormField label={t('adminResults.scoring.groupPhaseExact')}>
                <Input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={scoringConfig.exactResultPoints}
                  onChange={(e) => {
                    const value = Number.parseInt(e.target.value, 10) || 0;
                    setScoringConfig((prev) => ({ ...prev, exactResultPoints: Math.max(0, value) }));
                  }}
                />
              </FormField>
            </div>
          </Section>

          {/* 3. Final phase configuration */}
          <Section
            title={t('adminResults.config.finalPhase.title')}
            collapsible
            defaultExpanded={false}
            density="compact"
            tone="subtle"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(220px, 1fr)',
                  gap: '0.75rem',
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgb(var(--border-subtle))',
                  background: 'rgb(var(--bg-elevated))',
                }}
              >
                <FormField label={t('adminResults.scoring.tournamentWinner')}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={bracketScoringConfig.tournamentWinnerPoints}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10) || 0;
                      setBracketScoringConfig((prev) => ({
                        ...prev,
                        tournamentWinnerPoints: Math.max(0, value),
                      }));
                    }}
                  />
                </FormField>
              </div>
              {PHASES.map((phase) => {
                const scoring = bracketScoringConfig.rounds[phase.key] || {
                  exactPositionPoints: bracketScoringConfig.exactPositionPoints,
                  correctTeamWrongPositionPoints: bracketScoringConfig.correctTeamWrongPositionPoints,
                };
                return (
                  <div
                    key={phase.key}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(8rem, 12rem) repeat(2, minmax(150px, 1fr))',
                      gap: '0.75rem',
                      alignItems: 'start',
                      padding: '0.65rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid rgb(var(--border-subtle))',
                      background: 'rgb(var(--bg-elevated))',
                    }}
                  >
                    <span
                      style={{
                        alignSelf: 'center',
                        color: 'rgb(var(--fg))',
                        fontSize: '0.875rem',
                        fontWeight: 800,
                      }}
                    >
                      {t(phase.labelKey)}
                    </span>
                    <FormField label={t('adminResults.scoring.finalExactPosition')}>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={scoring.exactPositionPoints}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value, 10) || 0;
                          setBracketScoringConfig((prev) => ({
                            ...prev,
                            rounds: {
                              ...prev.rounds,
                              [phase.key]: {
                                ...(prev.rounds[phase.key] || scoring),
                                exactPositionPoints: Math.max(0, value),
                              },
                            },
                          }));
                        }}
                      />
                    </FormField>
                    <FormField label={t('adminResults.scoring.finalCorrectWrongPosition')}>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={scoring.correctTeamWrongPositionPoints}
                        onChange={(e) => {
                          const value = Number.parseInt(e.target.value, 10) || 0;
                          setBracketScoringConfig((prev) => ({
                            ...prev,
                            rounds: {
                              ...prev.rounds,
                              [phase.key]: {
                                ...(prev.rounds[phase.key] || scoring),
                                correctTeamWrongPositionPoints: Math.max(0, value),
                              },
                            },
                          }));
                        }}
                      />
                    </FormField>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* 4. Players configuration */}
          <Section
            title={t('adminResults.config.players.title')}
            collapsible
            defaultExpanded={false}
            density="compact"
            tone="subtle"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgb(var(--fg-subtle))',
                    marginBottom: '0.5rem',
                  }}
                >
                  {t('adminResults.config.players.subgroups.goalsByPosition')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <FormField label={t('adminResults.players.scoring.goalGoalkeeper')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.goal.goalkeeper}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, goal: { ...prev.goal, goalkeeper: value } }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.goalDefender')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.goal.defender}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, goal: { ...prev.goal, defender: value } }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.goalMidfielder')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.goal.midfielder}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, goal: { ...prev.goal, midfielder: value } }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.goalForward')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.goal.forward}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, goal: { ...prev.goal, forward: value } }));
                      }}
                    />
                  </FormField>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgb(var(--fg-subtle))',
                    marginBottom: '0.5rem',
                  }}
                >
                  {t('adminResults.config.players.subgroups.assistsByPosition')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <FormField label={t('adminResults.players.scoring.assistGoalkeeper')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={playerScoringConfig.assist.goalkeeper}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({
                          ...prev,
                          assist: { ...prev.assist, goalkeeper: Math.max(0, value) },
                        }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.assistDefender')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={playerScoringConfig.assist.defender}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({
                          ...prev,
                          assist: { ...prev.assist, defender: Math.max(0, value) },
                        }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.assistMidfielder')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={playerScoringConfig.assist.midfielder}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({
                          ...prev,
                          assist: { ...prev.assist, midfielder: Math.max(0, value) },
                        }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.assistForward')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={playerScoringConfig.assist.forward}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({
                          ...prev,
                          assist: { ...prev.assist, forward: Math.max(0, value) },
                        }));
                      }}
                    />
                  </FormField>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgb(var(--fg-subtle))',
                    marginBottom: '0.5rem',
                  }}
                >
                  {t('adminResults.config.players.subgroups.individualActions')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <FormField label={t('adminResults.players.scoring.missedPenalty')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.missedPenalty}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, missedPenalty: value }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.mvp')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.mvp}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, mvp: value }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.penaltySaved')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.penaltySaved}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, penaltySaved: value }));
                      }}
                    />
                  </FormField>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgb(var(--fg-subtle))',
                    marginBottom: '0.5rem',
                  }}
                >
                  {t('adminResults.config.players.subgroups.discipline')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <FormField
                    label={t('adminResults.players.scoring.yellowCard')}
                    hint={t('adminResults.players.scoring.cardHint')}
                  >
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.yellowCard}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10);
                        setPlayerScoringConfig((prev) => ({
                          ...prev,
                          yellowCard: Number.isFinite(value) ? value : 0,
                        }));
                      }}
                    />
                  </FormField>
                  <FormField
                    label={t('adminResults.players.scoring.redCard')}
                    hint={t('adminResults.players.scoring.cardHint')}
                  >
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.redCard}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10);
                        setPlayerScoringConfig((prev) => ({
                          ...prev,
                          redCard: Number.isFinite(value) ? value : 0,
                        }));
                      }}
                    />
                  </FormField>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgb(var(--fg-subtle))',
                    marginBottom: '0.5rem',
                  }}
                >
                  {t('adminResults.config.players.subgroups.cleanSheetsByPosition')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <FormField label={t('adminResults.players.scoring.cleanSheetGoalkeeper')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.cleanSheet.goalkeeper}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, cleanSheet: { ...prev.cleanSheet, goalkeeper: Math.max(0, value) } }));
                      }}
                      min="0"
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.cleanSheetDefender')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.cleanSheet.defender}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, cleanSheet: { ...prev.cleanSheet, defender: Math.max(0, value) } }));
                      }}
                      min="0"
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.cleanSheetMidfielder')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.cleanSheet.midfielder}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, cleanSheet: { ...prev.cleanSheet, midfielder: Math.max(0, value) } }));
                      }}
                      min="0"
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.cleanSheetForward')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={playerScoringConfig.cleanSheet.forward}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({ ...prev, cleanSheet: { ...prev.cleanSheet, forward: Math.max(0, value) } }));
                      }}
                      min="0"
                    />
                  </FormField>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgb(var(--fg-subtle))',
                    marginBottom: '0.5rem',
                  }}
                >
                  {t('adminResults.config.players.subgroups.awards')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  <FormField label={t('adminResults.players.scoring.goldenBoot')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={playerScoringConfig.award.goldenBoot}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({
                          ...prev,
                          award: { ...prev.award, goldenBoot: Math.max(0, value) },
                        }));
                      }}
                    />
                  </FormField>
                  <FormField label={t('adminResults.players.scoring.tournamentMvp')}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={playerScoringConfig.award.tournamentMvp}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPlayerScoringConfig((prev) => ({
                          ...prev,
                          award: { ...prev.award, tournamentMvp: Math.max(0, value) },
                        }));
                      }}
                    />
                  </FormField>
                </div>
              </div>

              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgb(var(--fg-subtle))',
                    marginBottom: '0.5rem',
                  }}
                >
                  {t('adminResults.config.players.subgroups.awardWinners')}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <FormField
                    label={t('adminResults.players.awardWinners.goldenBoot')}
                    hint={t('adminResults.players.awardWinners.goldenBootHint')}
                  >
                    <select
                      multiple
                      value={playerAwardWinnersConfig.goldenBootPlayerIds}
                      onChange={(e) => {
                        const selected = Array.from(e.currentTarget.selectedOptions).map((option) => option.value);
                        setPlayerAwardWinnersConfig((prev) => ({ ...prev, goldenBootPlayerIds: selected }));
                      }}
                      style={{
                        width: '100%',
                        minHeight: '8rem',
                        padding: '0.55rem 0.7rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgb(var(--border))',
                        background: 'rgb(var(--bg-elevated))',
                        color: 'rgb(var(--fg))',
                      }}
                    >
                      {players.map((player) => (
                        <option key={player.playerId} value={player.playerId}>
                          <ReactCountryFlag countryCode={countryIsoCode(player.teamName)} svg style={{ width: '2em', height: '2em' }} /> - {player.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField
                    label={t('adminResults.players.awardWinners.tournamentMvp')}
                    hint={t('adminResults.players.awardWinners.tournamentMvpHint')}
                  >
                    <select
                      value={playerAwardWinnersConfig.tournamentMvpPlayerId}
                      onChange={(e) =>
                        setPlayerAwardWinnersConfig((prev) => ({
                          ...prev,
                          tournamentMvpPlayerId: e.currentTarget.value,
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '0.55rem 0.7rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgb(var(--border))',
                        background: 'rgb(var(--bg-elevated))',
                        color: 'rgb(var(--fg))',
                      }}
                    >
                      <option value="">{t('adminResults.players.awardWinners.none')}</option>
                      {players.map((player) => (
                        <option key={player.playerId} value={player.playerId}>
                          <ReactCountryFlag countryCode={countryIsoCode(player.teamName)} svg style={{ width: '2em', height: '2em' }} /> - {player.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          </Section>

          <div
            aria-live="polite"
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '0.4rem',
              minHeight: '1.4rem',
              fontSize: '0.78rem',
              color: 'rgb(var(--fg-muted))',
              fontStyle: 'italic',
            }}
          >
            {savingConfig ? (
              <>
                <span
                  aria-hidden
                  className="btn-spinner"
                  style={{ width: '0.75rem', height: '0.75rem', borderWidth: 2 }}
                />
                {t('adminResults.scoring.savingAuto')}
              </>
            ) : prizeTotalInvalid ? (
              <span style={{ color: 'rgb(var(--live))', fontStyle: 'normal', fontWeight: 600 }}>
                {t('adminResults.scoring.prizeTotalInvalid')}
              </span>
            ) : poolNotSelected ? (
              <span style={{ fontStyle: 'normal' }}>{t('adminResults.errors.selectPoolFirst')}</span>
            ) : (
              <span aria-hidden>{t('adminResults.scoring.savedAuto')}</span>
            )}
          </div>
        </div>
      ) : null}

      {activeTab === 'groups' ? (
        <div className="tabs-panel tabs-panel-compact">
          {groups.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {groups.map((group) => {
                const groupMatches = matchesByGroup[group] || [];
                return (
                  <Section
                    key={group}
                    title={t('adminResults.groupPhase.group', { group })}
                    collapsible
                    defaultExpanded
                    density="compact"
                    tone="subtle"
                    contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
                    style={{ padding: '0.45rem 0.55rem' }}
                  >
                    {groupMatches.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {groupMatches.map((match) => (
                          <ResultEntryRow
                            key={match.matchId}
                            match={match}
                            locale={locale}
                            result={results[match.matchId] || { homeResult: '', awayResult: '' }}
                            submitting={submitting === match.matchId}
                            onChange={handleResultChange}
                            savingLabel={t('common.saving')}
                          />
                        ))}
                      </div>
                    ) : null}
                  </Section>
                );
              })}
            </div>
          ) : (
            <p
              style={{
                color: 'rgb(var(--fg-muted))',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '1.5rem',
                margin: 0,
              }}
            >
              {t('adminResults.groupPhase.empty')}
            </p>
          )}
        </div>
      ) : null}

      {activeTab === 'final' ? (
        <div className="tabs-panel">
          <BracketVisualization
            bracket={bracket}
            teams={teams}
            poolId={poolId}
            mode="admin"
            updatingMatch={updatingMatch}
            onUpdateTeam={handleUpdateTeam}
            onBracketResultChange={(id, h, a) => handleBracketResultChange(id, h, a)}
            onUpdateResult={handleSaveBracketResult}
            bracketResults={bracketResults}
            submittingResult={submittingBracketResult}
          />
        </div>
      ) : null}

      {activeTab === 'players' ? (
        <div className="tabs-panel tabs-panel-compact">
          {(() => {
            // Build the country list from the loaded players, sorted alpha by
            // localised team name. Cheap recompute on every render — the list
            // is small (≤ 48 teams) and avoids stale memo invalidation.
            const countries = Array.from(
              players.reduce((acc, player) => {
                if (player.teamId && !acc.has(player.teamId)) {
                  acc.set(player.teamId, player.teamName || player.teamId);
                }
                return acc;
              }, new Map<string, string>()).entries(),
            ).sort((a, b) => a[1].localeCompare(b[1], locale));

            const search = playerFilter.trim().toLowerCase();
            const filtered = players
              .filter((player) =>
                playerCountryFilter ? player.teamId === playerCountryFilter : true,
              )
              .filter((player) =>
                search
                  ? player.name.toLowerCase().includes(search) ||
                    (player.teamName || '').toLowerCase().includes(search)
                  : true,
              );

            const filtersActive = Boolean(search) || Boolean(playerCountryFilter);

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(180px, 1fr) minmax(160px, 220px) auto',
                    gap: '0.6rem',
                    alignItems: 'center',
                  }}
                >
                  <Input
                    type="search"
                    value={playerFilter}
                    onChange={(e) => setPlayerFilter(e.target.value)}
                    placeholder={t('adminResults.players.searchPlaceholder')}
                    aria-label={t('adminResults.players.searchPlaceholder')}
                  />
                  <select
                    value={playerCountryFilter}
                    onChange={(e) => setPlayerCountryFilter(e.target.value)}
                    aria-label={t('adminResults.players.countryFilterLabel')}
                    className="input"
                    style={{ width: '100%' }}
                  >
                    <option value="">{t('adminResults.players.countryAll')}</option>
                    {countries.map(([teamId, teamName]) => (
                      <option key={teamId} value={teamId}>
                        <ReactCountryFlag countryCode={countryIsoCode(teamName)} svg style={{ width: '2em', height: '2em' }} />
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      color: 'rgb(var(--fg-muted))',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {t('adminResults.players.matchCount', { count: filtered.length })}
                  </span>
                </div>

                {filtered.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))',
                      gap: '0.6rem',
                    }}
                  >
                    {filtered.map((player) => (
                <article
                  key={player.playerId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr)',
                    gap: '0.55rem',
                    padding: '0.7rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgb(var(--border))',
                    background: 'rgb(var(--bg-elevated))',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
                    <span
                      aria-hidden
                      style={{
                        width: '2.15rem',
                        height: '2.15rem',
                        borderRadius: '999px',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                        background: 'rgb(var(--bg-subtle))',
                        border: '1px solid rgb(var(--border))',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {player.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={player.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '999px', objectFit: 'cover' }} />
                      ) : (
                        player.name.slice(0, 2).toUpperCase()
                      )}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, color: 'rgb(var(--fg))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player.name}
                      </p>
                      <p
                        style={{
                          margin: '0.1rem 0 0',
                          color: 'rgb(var(--fg-muted))',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <ReactCountryFlag countryCode={countryIsoCode(player.teamName)} svg style={{ width: '2em', height: '2em' }} />
                        {player.teamName}
                      </p>
                    </div>
                    <Badge variant="gold" style={{ marginLeft: 'auto' }}>
                      {t('adminResults.players.points', { points: player.totalPoints || 0 })}
                    </Badge>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(5.25rem, 1fr))', gap: '0.35rem' }}>
                    {PLAYER_STAT_ACTIONS.map((action) => {
                      const value = player[action.key] || 0;
                      const isUpdating = updatingPlayerStat === `${player.playerId}:${action.key}`;
                      return (
                        <div
                          key={action.key}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1.65rem minmax(1.3rem, 1fr) 1.65rem',
                            alignItems: 'center',
                            gap: '0.2rem',
                            padding: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid rgb(var(--border-subtle))',
                            background: 'rgb(var(--bg-subtle) / 0.55)',
                          }}
                        >
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            disabled={isUpdating || value <= 0}
                            title={t('adminResults.players.decrease')}
                            aria-label={t('adminResults.players.decrease')}
                            onClick={() => handlePlayerStatChange(player, action.key, -1)}
                            style={{ width: '1.65rem', height: '1.65rem' }}
                          >
                            -
                          </button>
                          <span
                            title={t(action.labelKey)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.18rem',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              color: 'rgb(var(--fg))',
                            }}
                          >
                            {action.icon}
                            {value}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            disabled={isUpdating}
                            title={t('adminResults.players.increase')}
                            aria-label={t('adminResults.players.increase')}
                            onClick={() => handlePlayerStatChange(player, action.key, 1)}
                            style={{ width: '1.65rem', height: '1.65rem' }}
                          >
                            +
                          </button>
                        </div>
                      );
                    })}
                  </div>
                    </article>
                  ))}
                  </div>
                ) : players.length === 0 ? (
                  <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                    {t('adminResults.players.empty')}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1.5rem', margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.875rem' }}>
                    <p style={{ margin: 0 }}>{t('adminResults.players.noResults')}</p>
                    {filtersActive ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPlayerFilter('');
                          setPlayerCountryFilter('');
                        }}
                      >
                        {t('adminResults.players.clearFilters')}
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : null}
      </div>
    </>
  );
}

interface ResultEntryRowProps {
  match: Match;
  locale: string;
  result: { homeResult: number | ''; awayResult: number | '' };
  submitting: boolean;
  onChange: (matchId: string, side: 'home' | 'away', value: string) => void;
  savingLabel: string;
}

function ResultEntryRow({
  match,
  locale,
  result,
  submitting,
  onChange,
  savingLabel,
}: Readonly<ResultEntryRowProps>) {
  const formattedDate = new Date(match.scheduledAt).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const matchDate = match.matchNumber ? `P${match.matchNumber} · ${formattedDate}` : formattedDate;
  const alreadyHadResult =
    typeof match.homeResult === 'number' && typeof match.awayResult === 'number';

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 4.65rem minmax(0, 1fr) 9rem',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.38rem 0.5rem',
        background: 'rgb(var(--bg-elevated))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <ReactCountryFlag countryCode={countryIsoCode(match.homeTeamName)} svg style={{ width: '2em', height: '2em' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.homeTeamName}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2rem 0.45rem 2rem', alignItems: 'center' }}>
        <ScoreInput
          value={result.homeResult ?? ''}
          onChange={(v) => onChange(match.matchId, 'home', v)}
          ariaLabel={`${match.homeTeamName} result`}
        />
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '1.1rem',
            color: 'rgb(var(--fg-subtle))',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          –
        </span>
        <ScoreInput
          value={result.awayResult ?? ''}
          onChange={(v) => onChange(match.matchId, 'away', v)}
          ariaLabel={`${match.awayTeamName} result`}
        />
      </div>

      <div style={{ minWidth: 0, textAlign: 'right' }}>
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.awayTeamName}</span>
          <ReactCountryFlag countryCode={countryIsoCode(match.awayTeamName)} svg style={{ width: '2em', height: '2em' }} />
        </p>
      </div>

      <div
        style={{
          minWidth: 0,
          display: 'grid',
          justifyItems: 'end',
          gap: '0.15rem',
          fontSize: '0.65rem',
          lineHeight: 1.1,
          color: 'rgb(var(--fg-muted))',
        }}
      >
        <span
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 600,
            color: 'rgb(var(--fg-subtle))',
          }}
        >
          {matchDate}
        </span>
        {submitting ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              color: 'rgb(var(--fg-muted))',
              fontWeight: 600,
              fontStyle: 'italic',
            }}
            aria-live="polite"
          >
            <span
              aria-hidden
              className="btn-spinner"
              style={{ width: '0.7rem', height: '0.7rem', borderWidth: 2 }}
            />
            {savingLabel}
          </span>
        ) : alreadyHadResult ? (
          <Badge variant="info" style={{ fontSize: '0.6rem', padding: '0.05rem 0.4rem' }}>
            FT
          </Badge>
        ) : null}
      </div>
    </article>
  );
}

function ScoreInput({
  value,
  onChange,
  ariaLabel,
}: Readonly<{
  value: number | '';
  onChange: (next: string) => void;
  ariaLabel: string;
}>) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value === '' ? '' : String(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '' || /^\d+$/.test(v)) onChange(v);
      }}
      onKeyDown={(e) => {
        if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') e.preventDefault();
      }}
      aria-label={ariaLabel}
      style={{
        width: '2rem',
        padding: '0.18rem 0.1rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display, inherit)',
        fontSize: '0.98rem',
        fontWeight: 700,
        color: 'rgb(var(--fg))',
        background: 'rgb(var(--bg-elevated))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 'var(--radius-sm)',
        fontVariantNumeric: 'tabular-nums',
      }}
    />
  );
}

export default function AdminResultsPage() {
  return (
    <ProtectedRoute>
      <AdminResultsContent />
    </ProtectedRoute>
  );
}
