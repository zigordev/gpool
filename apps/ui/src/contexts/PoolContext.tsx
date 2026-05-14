'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { buildBracketProjection } from '@/lib/bracket-projection';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';
import { BracketScoringConfig } from '@/types/bracketScoringConfig.type';
import { PlayerPosition } from '@/types/playerPosition.type';
import { PlayerSelection } from '@/types/playerSelection.interface';
import { PlayerAward } from '@/types/playerAward.type';
import { PlayerAwardSelection } from '@/types/playerAwardSelection.interface';
import { SpyPicksData } from '@/types/spyPicksData.interface';
import { PrizePayout } from '@/types/prizePayout.type';
import { FaStar } from 'react-icons/fa';
import { GiLeatherBoot } from 'react-icons/gi';

// ─── Constants ────────────────────────────────────────────────────────────────

export const BRACKET_PHASES = [
  { key: '16th-finals', labelKey: 'bracket.round.16th' },
  { key: '8th-finals', labelKey: 'bracket.round.8th' },
  { key: 'quarter-finals', labelKey: 'bracket.round.quarter' },
  { key: 'semi-finals', labelKey: 'bracket.round.semi' },
  { key: 'finals', labelKey: 'bracket.round.final' },
] as const;

export const DEFAULT_POOL_DEADLINE = new Date('2026-06-08T00:00:00Z').getTime();
export const PLAYER_SELECTION_LIMIT = 6;

export const PLAYER_POSITIONS: Array<{ key: PlayerPosition; labelKey: string }> = [
  { key: 'goalkeeper', labelKey: 'poolDetail.players.positions.goalkeeper' },
  { key: 'defender', labelKey: 'poolDetail.players.positions.defender' },
  { key: 'midfielder', labelKey: 'poolDetail.players.positions.midfielder' },
  { key: 'forward', labelKey: 'poolDetail.players.positions.forward' },
];

export const PLAYER_AWARDS: Array<{ key: PlayerAward; labelKey: string; descriptionKey: string; icon: any }> = [
  {
    key: 'golden_boot',
    labelKey: 'poolDetail.players.awards.goldenBoot',
    descriptionKey: 'poolDetail.players.awards.goldenBootDescription',
    icon: <GiLeatherBoot style={{ color: 'gold' }} size="27" />,
  },
  {
    key: 'tournament_mvp',
    labelKey: 'poolDetail.players.awards.tournamentMvp',
    descriptionKey: 'poolDetail.players.awards.tournamentMvpDescription',
    icon: <FaStar style={{ color: 'gold' }} size="27" />,
  },
];

export const REQUIRED_PLAYER_SELECTIONS = PLAYER_POSITIONS.length * PLAYER_SELECTION_LIMIT + PLAYER_AWARDS.length;

const DEFAULT_BRACKET_EXACT_POSITION_POINTS = 0;
const DEFAULT_BRACKET_WRONG_POSITION_POINTS = 0;
const DEFAULT_TOURNAMENT_WINNER_POINTS = 0;
const DEFAULT_GROUP_WINNER_POINTS = 0;
const DEFAULT_GROUP_EXACT_POINTS = 0;

// ─── Utility functions ────────────────────────────────────────────────────────

export function resolveDeadline(pool: any): number {
  const raw = pool?.config?.deadline;
  if (raw == null) return DEFAULT_POOL_DEADLINE;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POOL_DEADLINE;
}

export function resolvePrizeDistribution(pool: any): PrizePayout[] {
  const entryFee = pool?.config?.entryFee;
  if (typeof entryFee === 'number' && entryFee === 0) return [];
  const raw = pool?.config?.prizeDistribution;
  if (raw && Array.isArray(raw.payouts) && raw.payouts.length > 0) {
    const valid = raw.payouts
      .filter(
        (p: any) =>
          p &&
          typeof p.rank === 'number' &&
          Number.isFinite(p.rank) &&
          p.rank >= 1 &&
          typeof p.percentage === 'number' &&
          Number.isFinite(p.percentage) &&
          p.percentage >= 0,
      )
      .map((p: any) => ({ rank: p.rank, percentage: p.percentage }));
    if (valid.length > 0) return valid.sort((a: PrizePayout, b: PrizePayout) => a.rank - b.rank);
  }
  return [{ rank: 1, percentage: 100 }];
}

export function computePrize(total: number, distribution: PrizePayout[], rank: number): number {
  const payout = distribution.find((p) => p.rank === rank);
  if (!payout) return 0;
  const sum = distribution.reduce((acc, p) => acc + p.percentage, 0);
  if (sum <= 0) return 0;
  return total * (payout.percentage / sum);
}

function normalizeBracketScoring(value: any): BracketScoringConfig {
  const baseExact = Number.isFinite(value?.exactPositionPoints)
    ? Math.max(0, Number(value.exactPositionPoints))
    : DEFAULT_BRACKET_EXACT_POSITION_POINTS;
  const baseWrong = Number.isFinite(value?.correctTeamWrongPositionPoints)
    ? Math.max(0, Number(value.correctTeamWrongPositionPoints))
    : DEFAULT_BRACKET_WRONG_POSITION_POINTS;
  const tournamentWinnerPoints = Number.isFinite(value?.tournamentWinnerPoints)
    ? Math.max(0, Number(value.tournamentWinnerPoints))
    : DEFAULT_TOURNAMENT_WINNER_POINTS;
  const rounds = BRACKET_PHASES.reduce<Record<string, any>>((acc, phase) => {
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
  return { exactPositionPoints: baseExact, correctTeamWrongPositionPoints: baseWrong, tournamentWinnerPoints, rounds };
}

export function resolveGroupScoring(value: any) {
  return {
    winnerPoints: Number.isFinite(Number(value?.winnerPoints))
      ? Math.max(0, Number(value.winnerPoints))
      : DEFAULT_GROUP_WINNER_POINTS,
    exactResultPoints: Number.isFinite(Number(value?.exactResultPoints))
      ? Math.max(0, Number(value.exactResultPoints))
      : DEFAULT_GROUP_EXACT_POINTS,
  };
}

export function phaseShortKey(phase: string): string {
  switch (phase) {
    case '16th-finals': return '16th';
    case '8th-finals': return '8th';
    case 'quarter-finals': return 'quarter';
    case 'semi-finals': return 'semi';
    case 'finals': return 'final';
    default: return phase;
  }
}

export function formatEur(amount: number, locale: string): string {
  if (!Number.isFinite(amount)) return '';
  const isInt = Math.abs(amount - Math.round(amount)) < 0.005;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: isInt ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(isInt ? 0 : 2)} €`;
  }
}

// ─── Context value type ───────────────────────────────────────────────────────

export type PlayerOption = { value: string; label: string; teamName: string; teamId: string; isDisabled: boolean };

interface PoolContextValue {
  poolId: string;
  pool: any | null;
  loading: boolean;
  matchesByGroup: Record<string, Match[]>;
  groups: string[];
  predictions: Record<string, Prediction>;
  ranking: Array<{ rank: number; userName: string; userId?: string; groupPhasePoints: number; finalPhasePoints: number; playerPoints: number }>;
  bracket: Record<string, any[]>;
  bracketPredictions: Record<string, any>;
  effectiveBracketPredictions: Record<string, any>;
  bracketProjection: any;
  bracketScoringConfig: BracketScoringConfig;
  teams: Array<{ teamId: string; name: string; group?: string; code?: string }>;
  players: TournamentPlayer[];
  playerSelections: Record<string, PlayerSelection>;
  playerAwardSelections: Record<PlayerAward, PlayerAwardSelection | undefined>;
  savingPlayerSlot: string | null;
  poolDeadline: number;
  isPastPoolDeadline: boolean;
  groupMissingCount: number;
  finalMissingCount: number;
  playerAwardSelectionCount: number;
  playersMissingCount: number;
  spy: { target: { userId: string; userName: string }; loading: boolean; error: string | null; data: SpyPicksData | null } | null;
  setSpy: (spy: PoolContextValue['spy']) => void;
  handleScoreChange: (matchId: string, side: 'home' | 'away', value: string) => void;
  handleStartSpy: (target: { userId: string; userName: string }) => Promise<void>;
  handlePlayerSelection: (position: PlayerPosition, slot: number, playerId: string) => Promise<void>;
  handlePlayerAwardSelection: (award: PlayerAward, playerId: string) => Promise<void>;
  setBracketPredictions: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

const PoolContext = createContext<PoolContextValue | null>(null);

export function usePoolContext(): PoolContextValue {
  const ctx = useContext(PoolContext);
  if (!ctx) throw new Error('usePoolContext must be used inside PoolProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function PoolProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const poolId =
    typeof params?.poolId === 'string'
      ? params.poolId
      : Array.isArray(params?.poolId)
      ? params.poolId[0]
      : '';

  const [pool, setPool] = useState<any>(null);
  const [matchesByGroup, setMatchesByGroup] = useState<Record<string, Match[]>>({});
  const [groups, setGroups] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState(true);
  const [saveTimers, setSaveTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [ranking, setRanking] = useState<Array<{ rank: number; userName: string; userId?: string; groupPhasePoints: number; finalPhasePoints: number; playerPoints: number }>>([]);
  const [bracket, setBracket] = useState<Record<string, any[]>>({});
  const [bracketPredictions, setBracketPredictions] = useState<Record<string, any>>({});
const [teams, setTeams] = useState<Array<{ teamId: string; name: string; group?: string; code?: string }>>([]);
  const [players, setPlayers] = useState<TournamentPlayer[]>([]);
  const [playerSelections, setPlayerSelections] = useState<Record<string, PlayerSelection>>({});
  const [playerAwardSelections, setPlayerAwardSelections] = useState<Record<PlayerAward, PlayerAwardSelection | undefined>>({
    golden_boot: undefined,
    tournament_mvp: undefined,
  });
  const [savingPlayerSlot, setSavingPlayerSlot] = useState<string | null>(null);
  const [spy, setSpy] = useState<PoolContextValue['spy']>(null);
  const [bracketScoringConfig, setBracketScoringConfig] = useState<BracketScoringConfig>(normalizeBracketScoring(null));

  useEffect(() => {
    if (!poolId) { setLoading(false); return; }

    setPool(null);
    setMatchesByGroup({});
    setGroups([]);
    setPredictions({});
    setRanking([]);
    setBracket({});
    setBracketPredictions({});
    setTeams([]);
    setPlayers([]);
    setPlayerSelections({});
    setPlayerAwardSelections({ golden_boot: undefined, tournament_mvp: undefined });
    setSpy(null);

    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          poolResponse,
          matchesResponse,
          predictionsResponse,
          rankingResponse,
          bracketResponse,
          bracketPredictionsResponse,
          teamsResponse,
          playersResponse,
        ] = await Promise.all([
          apiClient.get(`/pools/${poolId}`),
          apiClient.get(`/pools/${poolId}/matches`),
          apiClient.get(`/pools/${poolId}/matches/predictions`).catch(() => ({ data: [] })),
          apiClient.get(`/pools/${poolId}/matches/ranking`).catch(() => ({ data: [] })),
          apiClient.get(`/pools/${poolId}/bracket`).catch(() => ({ data: {} })),
          apiClient.get(`/pools/${poolId}/bracket/predictions`).catch(() => ({ data: [] })),
          apiClient.get(`/pools/${poolId}/matches/teams`).catch(() => ({ data: [] })),
          apiClient.get(`/pools/${poolId}/players`).catch(() => ({ data: { players: [], selections: [] } })),
        ]);

        setPool(poolResponse.data);

        const matchesData = matchesResponse.data || {};
        setMatchesByGroup(matchesData.matchesByGroup || {});
        setGroups(matchesData.groups || []);

        const predictionsMap: Record<string, Prediction> = {};
        (predictionsResponse.data || []).forEach((pred: any) => {
          predictionsMap[pred.matchId] = {
            matchId: pred.matchId,
            homeScore: pred.homeScore,
            awayScore: pred.awayScore,
            isCorrect: pred.isCorrect,
            isExactMatch: pred.isExactMatch,
            points: pred.points,
          };
        });
        setPredictions(predictionsMap);

        setRanking(rankingResponse.data || []);
        setBracket(bracketResponse.data || {});

        const bracketPredictionsMap: Record<string, any> = {};
        (bracketPredictionsResponse.data || []).forEach((pred: any) => {
          bracketPredictionsMap[pred.bracketMatchId] = pred;
        });
        setBracketPredictions(bracketPredictionsMap);

        if (poolResponse.data?.config?.bracketScoring) {
          setBracketScoringConfig(normalizeBracketScoring(poolResponse.data.config.bracketScoring));
        }

        setTeams(teamsResponse.data || []);

        const playersData = playersResponse.data || {};
        setPlayers(playersData.players || []);

        const selectionsMap: Record<string, PlayerSelection> = {};
        (playersData.selections || []).forEach((sel: any) => {
          const key = `${sel.position}:${sel.slot}`;
          selectionsMap[key] = sel;
        });
        setPlayerSelections(selectionsMap);

        const awardSelectionsMap: Record<PlayerAward, PlayerAwardSelection | undefined> = {
          golden_boot: undefined,
          tournament_mvp: undefined,
        };
        (playersData.awardSelections || []).forEach((sel: any) => {
          if (sel.award === 'golden_boot' || sel.award === 'tournament_mvp') {
            awardSelectionsMap[sel.award as PlayerAward] = sel;
          }
        });
        setPlayerAwardSelections(awardSelectionsMap);
      } catch (err: any) {
        toast.error(err.response?.data?.message || t('poolDetail.errors.loadData'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolId]);

  const poolDeadline = resolveDeadline(pool);

  const bracketProjection = useMemo(
    () => buildBracketProjection({ matchesByGroup, groupPredictions: predictions, teams, bracket, bracketPredictions }),
    [matchesByGroup, predictions, teams, bracket, bracketPredictions],
  );
  const effectiveBracketPredictions = bracketProjection.effectivePredictions;

  const isPastPoolDeadline = Date.now() >= poolDeadline;

  const groupMissingCount = Object.values(matchesByGroup)
    .flat()
    .filter((match) => {
      const prediction = predictions[match.matchId];
      return prediction?.homeScore === '' || prediction?.homeScore === undefined ||
        prediction?.awayScore === '' || prediction?.awayScore === undefined;
    }).length;

  // All knockout rounds count now that the round of 32 is only filled on explicit user action.
  const KNOCKOUT_PHASES_FOR_COUNT = ['16th-finals', '8th-finals', 'quarter-finals', 'semi-finals', 'finals'] as const;

  const bracketTeamsMissing = KNOCKOUT_PHASES_FOR_COUNT
    .flatMap((phase) => (bracket[phase] || []) as any[])
    .reduce((count, match: any) => {
      const prediction = effectiveBracketPredictions[match.bracketMatchId];
      // Count each team slot independently so that both-empty = 2, one-empty = 1, none-empty = 0
      if (!prediction?.homeTeamId) count++;
      if (!prediction?.awayTeamId) count++;
      return count;
    }, 0);

  const finalsMatches = (bracket['finals'] as any[]) || [];
  const winnerMissing = finalsMatches.reduce((count, match: any) => {
    const effective = effectiveBracketPredictions[match.bracketMatchId];
    const raw = bracketPredictions[match.bracketMatchId];
    // "has teams" is true when the cascade has resolved teams OR the user explicitly picked them in the raw prediction
    const hasTeams =
      (effective?.homeTeamId && effective?.awayTeamId) ||
      (raw?.homeTeamId && raw?.awayTeamId);
    return hasTeams && !raw?.predictedWinnerTeamId ? count + 1 : count;
  }, 0);

  const finalMissingCount = bracketTeamsMissing + winnerMissing;

  const playerAwardSelectionCount = PLAYER_AWARDS.filter((award) => playerAwardSelections[award.key]).length;

  const playersMissingCount = Math.max(
    0,
    REQUIRED_PLAYER_SELECTIONS - Object.keys(playerSelections).length - playerAwardSelectionCount,
  );

  const autoSavePrediction = async (matchId: string, prediction: Prediction) => {
    const clearingPrediction = prediction.homeScore === '' && prediction.awayScore === '';
    if (!clearingPrediction && (prediction.homeScore === '' || prediction.awayScore === '')) return;
    try {
      const response = await apiClient.post(`/pools/${poolId}/matches/${matchId}/predict`, {
        homeScore: clearingPrediction ? null : Number(prediction.homeScore),
        awayScore: clearingPrediction ? null : Number(prediction.awayScore),
      });
      if (response.data?.cleared) {
        setPredictions((prev) => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
        return;
      }
      setPredictions((prev) => ({
        ...prev,
        [matchId]: { ...prev[matchId], ...response.data },
      }));
      setRanking(response.data?.ranking || ranking);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('poolDetail.errors.savePrediction'));
    }
  };

  const handleScoreChange = (matchId: string, side: 'home' | 'away', value: string) => {
    if (Date.now() >= poolDeadline) return;
    const numValue = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);
    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        matchId,
        homeScore: side === 'home' ? (numValue as number | '') : (prev[matchId]?.homeScore ?? ''),
        awayScore: side === 'away' ? (numValue as number | '') : (prev[matchId]?.awayScore ?? ''),
      },
    }));

    if (saveTimers[matchId]) clearTimeout(saveTimers[matchId]);
    const timer = setTimeout(() => {
      setPredictions((current) => {
        const latest = current[matchId];
        if (latest) autoSavePrediction(matchId, latest);
        return current;
      });
      setSaveTimers((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
    }, 500);
    setSaveTimers((prev) => ({ ...prev, [matchId]: timer }));
  };

  const handleStartSpy = async (target: { userId: string; userName: string }) => {
    setSpy({ target, loading: true, error: null, data: null });
    try {
      const response = await apiClient.get(`/pools/${poolId}/members/${target.userId}/picks`);
      const raw = response.data || {};
      const data: SpyPicksData = {
        user: raw.user || { userId: target.userId, userName: target.userName },
        predictions: raw.predictions || [],
        bracketPredictions: raw.bracketPredictions || [],
        playerSelections: raw.playerSelections || [],
        playerAwardSelections: raw.playerAwardSelections || [],
      };
      setSpy({ target, loading: false, error: null, data });
    } catch (err: any) {
      const message = err.response?.data?.message || t('poolDetail.spy.loadError');
      setSpy({ target, loading: false, error: message, data: null });
    }
  };

  const handlePlayerSelection = async (position: PlayerPosition, slot: number, playerId: string) => {
    if (Date.now() >= poolDeadline) { toast.error(t('poolDetail.finalPhase.deadlinePassed')); return; }
    const key = `${position}:${slot}`;
    const nextPlayer = players.find((player) => player.playerId === playerId);
    try {
      setSavingPlayerSlot(key);
      await apiClient.put(`/pools/${poolId}/players/selection`, { position, slot, playerId: playerId || null });
      setPlayerSelections((prev) => {
        const next = { ...prev };
        if (!playerId || !nextPlayer) {
          delete next[key];
        } else {
          next[key] = { ...nextPlayer, poolId, userId: user?.userId || '', slot };
        }
        return next;
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('poolDetail.players.saveError'));
    } finally {
      setSavingPlayerSlot(null);
    }
  };

  const handlePlayerAwardSelection = async (award: PlayerAward, playerId: string) => {
    if (Date.now() >= poolDeadline) { toast.error(t('poolDetail.finalPhase.deadlinePassed')); return; }
    const nextPlayer = players.find((player) => player.playerId === playerId);
    try {
      setSavingPlayerSlot(`award:${award}`);
      await apiClient.put(`/pools/${poolId}/players/award-selection`, { award, playerId: playerId || null });
      setPlayerAwardSelections((prev) => ({
        ...prev,
        [award]: playerId && nextPlayer
          ? { ...nextPlayer, poolId, userId: user?.userId || '', award }
          : undefined,
      }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('poolDetail.players.saveError'));
    } finally {
      setSavingPlayerSlot(null);
    }
  };

  const value: PoolContextValue = {
    poolId,
    pool,
    loading,
    matchesByGroup,
    groups,
    predictions,
    ranking,
    bracket,
    bracketPredictions,
    effectiveBracketPredictions,
    bracketProjection,
    bracketScoringConfig,
    teams,
    players,
    playerSelections,
    playerAwardSelections,
    savingPlayerSlot,
    poolDeadline,
    isPastPoolDeadline,
    groupMissingCount,
    finalMissingCount,
    playerAwardSelectionCount,
    playersMissingCount,
    spy,
    setSpy,
    handleScoreChange,
    handleStartSpy,
    handlePlayerSelection,
    handlePlayerAwardSelection,
    setBracketPredictions,
  };

  return <PoolContext.Provider value={value}>{children}</PoolContext.Provider>;
}
