'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import { countryFlag, countryWithFlag } from '@/lib/country-flags';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { BracketVisualization } from '@/components/BracketVisualization';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Section } from '@/components/ui/Section';
import { MatchPredictionCard, type MatchPredictionState } from '@/components/pool/MatchPredictionCard';
import { RankCard } from '@/components/pool/RankCard';

interface Match {
  matchId: string;
  groupId: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledAt: string;
  phase: string;
  status: string;
  homeResult?: number | null;
  awayResult?: number | null;
}

interface Prediction {
  matchId: string;
  homeScore: number | '';
  awayScore: number | '';
  isCorrect?: boolean | null;
  isExactMatch?: boolean | null;
  points?: number;
}

type PoolTab = 'ranking' | 'groups' | 'final' | 'players';
type PlayerPosition = 'goalkeeper' | 'defender' | 'midfielder' | 'forward';
type PlayerAward = 'golden_boot' | 'tournament_mvp';
type BracketRoundScoring = {
  exactPositionPoints: number;
  correctTeamWrongPositionPoints: number;
};
type BracketScoringConfig = BracketRoundScoring & {
  rounds: Record<string, BracketRoundScoring>;
  tournamentWinnerPoints: number;
};

const BRACKET_PHASES = [
  { key: '16th-finals', labelKey: 'bracket.round.16th' },
  { key: '8th-finals', labelKey: 'bracket.round.8th' },
  { key: 'quarter-finals', labelKey: 'bracket.round.quarter' },
  { key: 'semi-finals', labelKey: 'bracket.round.semi' },
  { key: 'finals', labelKey: 'bracket.round.final' },
] as const;

const DEFAULT_BRACKET_EXACT_POSITION_POINTS = 5;
const DEFAULT_BRACKET_WRONG_POSITION_POINTS = 3;
const DEFAULT_TOURNAMENT_WINNER_POINTS = 10;
type PlayerPickerState =
  | { kind: 'regular'; position: PlayerPosition; slot: number }
  | { kind: 'award'; award: PlayerAward };

interface TournamentPlayer {
  playerId: string;
  teamId: string;
  teamName: string;
  name: string;
  position: PlayerPosition;
  imageUrl?: string;
  countryCode?: string;
  flagEmoji?: string;
  goals?: number;
  missedPenalties?: number;
  mvps?: number;
  penaltiesSaved?: number;
  cleanSheets?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  totalPoints?: number;
}

interface PlayerSelection extends TournamentPlayer {
  poolId: string;
  userId: string;
  slot: number;
}

interface PlayerAwardSelection extends TournamentPlayer {
  poolId: string;
  userId: string;
  award: PlayerAward;
  awardPoints?: number;
}

interface SpyBracketPrediction {
  bracketMatchId: string;
  homeTeamId?: string;
  homeTeamName?: string;
  awayTeamId?: string;
  awayTeamName?: string;
  predictedWinnerTeamId?: string;
  predictedWinnerTeamName?: string;
  points?: number;
  homeTeamExactPosition?: boolean;
  awayTeamExactPosition?: boolean;
  homeTeamCorrectButWrongPosition?: boolean;
  awayTeamCorrectButWrongPosition?: boolean;
  tournamentWinnerCorrect?: boolean;
}

interface SpyPicksData {
  user: { userId: string; userName: string; userEmail?: string };
  predictions: Array<{
    matchId: string;
    homeScore: number;
    awayScore: number;
    isCorrect?: boolean | null;
    isExactMatch?: boolean | null;
    points?: number;
  }>;
  bracketPredictions: SpyBracketPrediction[];
  playerSelections: PlayerSelection[];
  playerAwardSelections: PlayerAwardSelection[];
}

// Order matches the visual layout on the soccer field, attacking left → right:
//   GK → DEF → (halfway) → MID → FWD.
const PLAYER_POSITIONS: Array<{ key: PlayerPosition; labelKey: string; }> = [
  { key: 'goalkeeper', labelKey: 'poolDetail.players.positions.goalkeeper' },
  { key: 'defender', labelKey: 'poolDetail.players.positions.defender' },
  { key: 'midfielder', labelKey: 'poolDetail.players.positions.midfielder' },
  { key: 'forward', labelKey: 'poolDetail.players.positions.forward' },
];

const PLAYER_AWARDS: Array<{ key: PlayerAward; labelKey: string; descriptionKey: string; icon: string }> = [
  {
    key: 'golden_boot',
    labelKey: 'poolDetail.players.awards.goldenBoot',
    descriptionKey: 'poolDetail.players.awards.goldenBootDescription',
    icon: '🦶',
  },
  {
    key: 'tournament_mvp',
    labelKey: 'poolDetail.players.awards.tournamentMvp',
    descriptionKey: 'poolDetail.players.awards.tournamentMvpDescription',
    icon: '⭐️',
  },
];

const POSITION_TONE: Record<
  PlayerPosition,
  { label: string; tint: string; border: string; chipFg: string }
> = {
  goalkeeper: {
    label: 'rgb(var(--gold))',
    tint: 'rgb(var(--gold) / 0.18)',
    border: 'rgb(var(--gold) / 0.50)',
    chipFg: 'rgb(var(--gold))',
  },
  defender: {
    label: 'rgb(var(--info))',
    tint: 'rgb(var(--info) / 0.16)',
    border: 'rgb(var(--info) / 0.45)',
    chipFg: 'rgb(var(--info))',
  },
  midfielder: {
    label: 'rgb(var(--pitch))',
    tint: 'rgb(var(--pitch) / 0.18)',
    border: 'rgb(var(--pitch) / 0.50)',
    chipFg: 'rgb(var(--pitch))',
  },
  forward: {
    label: 'rgb(var(--sunset))',
    tint: 'rgb(var(--sunset) / 0.18)',
    border: 'rgb(var(--sunset) / 0.50)',
    chipFg: 'rgb(var(--sunset))',
  },
};

const DEFAULT_POOL_DEADLINE = new Date('2026-06-08T00:00:00Z').getTime();
const PLAYER_SELECTION_LIMIT = 6;
const REQUIRED_PLAYER_SELECTIONS = PLAYER_POSITIONS.length * PLAYER_SELECTION_LIMIT + PLAYER_AWARDS.length;

function resolveDeadline(pool: any): number {
  const raw = pool?.config?.deadline;
  if (raw == null) return DEFAULT_POOL_DEADLINE;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POOL_DEADLINE;
}

interface PrizePayout {
  rank: number;
  percentage: number;
}

/**
 * Pool prize distribution as a list of payouts (rank → percentage). Defaults
 * to winner-takes-all if not configured. Percentages don't strictly have to
 * sum to 100 — they're normalised to a share of the pot at compute time.
 */
function resolvePrizeDistribution(pool: any): PrizePayout[] {
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

function computePrize(total: number, distribution: PrizePayout[], rank: number): number {
  const payout = distribution.find((p) => p.rank === rank);
  if (!payout) return 0;
  const sum = distribution.reduce((acc, p) => acc + p.percentage, 0);
  if (sum <= 0) return 0;
  return total * (payout.percentage / sum);
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
  const rounds = BRACKET_PHASES.reduce<Record<string, BracketRoundScoring>>((acc, phase) => {
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

function phaseShortKey(phase: string): string {
  switch (phase) {
    case '16th-finals':
      return '16th';
    case '8th-finals':
      return '8th';
    case 'quarter-finals':
      return 'quarter';
    case 'semi-finals':
      return 'semi';
    case 'finals':
      return 'final';
    default:
      return phase;
  }
}

function formatEur(amount: number, locale: string): string {
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

function PoolDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useI18n();
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [saveTimers, setSaveTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [ranking, setRanking] = useState<Array<{ rank: number; userName: string; userId?: string; points: number }>>([]);
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
  const [playerPicker, setPlayerPicker] = useState<PlayerPickerState | null>(null);
  const [playerPickerSearch, setPlayerPickerSearch] = useState('');
  const [spy, setSpy] = useState<
    | {
        target: { userId: string; userName: string };
        loading: boolean;
        error: string | null;
        data: SpyPicksData | null;
      }
    | null
  >(null);
  const [bracketScoringConfig, setBracketScoringConfig] = useState<BracketScoringConfig>(
    normalizeBracketScoring(null),
  );
  const [activeTab, setActiveTab] = useState<PoolTab>('ranking');

  useEffect(() => {
    if (!poolId) {
      setError(t('poolDetail.errors.invalidPoolId'));
      setLoading(false);
      return;
    }

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

        setTeams(teamsResponse.data || []);
        setPlayers(playersResponse.data?.players || []);
        const selectionMap: Record<string, PlayerSelection> = {};
        (playersResponse.data?.selections || []).forEach((selection: PlayerSelection) => {
          selectionMap[`${selection.position}:${selection.slot}`] = selection;
        });
        setPlayerSelections(selectionMap);
        const awardSelectionMap: Record<PlayerAward, PlayerAwardSelection | undefined> = {
          golden_boot: undefined,
          tournament_mvp: undefined,
        };
        (playersResponse.data?.awardSelections || []).forEach((selection: PlayerAwardSelection) => {
          awardSelectionMap[selection.award] = selection;
        });
        setPlayerAwardSelections(awardSelectionMap);

        if (poolResponse.data?.config?.bracketScoring) {
          setBracketScoringConfig(normalizeBracketScoring(poolResponse.data.config.bracketScoring));
        }

        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || t('poolDetail.errors.loadPool');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [poolId, user, t]);

  const autoSavePrediction = async (matchId: string, prediction: Prediction) => {
    if (!prediction) return;

    const homeScore =
      typeof prediction.homeScore === 'number'
        ? prediction.homeScore
        : prediction.homeScore === ''
        ? 0
        : parseInt(String(prediction.homeScore), 10) || 0;
    const awayScore =
      typeof prediction.awayScore === 'number'
        ? prediction.awayScore
        : prediction.awayScore === ''
        ? 0
        : parseInt(String(prediction.awayScore), 10) || 0;

    if (homeScore === 0 && awayScore === 0) return;
    if (prediction.homeScore === '' || prediction.awayScore === '') return;

    if (Date.now() >= resolveDeadline(pool)) return;

    try {
      setSubmitting(matchId);
      await apiClient.post(`/pools/${poolId}/matches/${matchId}/predict`, {
        homeScore,
        awayScore,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('poolDetail.errors.savePrediction');
      toast.error(errorMessage);
    } finally {
      setSubmitting(null);
    }
  };

  const handleScoreChange = (matchId: string, side: 'home' | 'away', value: string) => {
    const numValue = value === '' ? '' : Math.max(0, parseInt(value, 10) || 0);

    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        matchId,
        [side === 'home' ? 'homeScore' : 'awayScore']: numValue,
        [side === 'home' ? 'awayScore' : 'homeScore']:
          prev[matchId]?.[side === 'home' ? 'awayScore' : 'homeScore'] ?? '',
      },
    }));

    const existingTimer = saveTimers[matchId];
    if (existingTimer) clearTimeout(existingTimer);

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
    if (Date.now() >= poolDeadline) {
      toast.error(t('poolDetail.finalPhase.deadlinePassed'));
      return;
    }
    const key = `${position}:${slot}`;
    const nextPlayer = players.find((player) => player.playerId === playerId);
    try {
      setSavingPlayerSlot(key);
      await apiClient.put(`/pools/${poolId}/players/selection`, {
        position,
        slot,
        playerId: playerId || null,
      });
      setPlayerSelections((prev) => {
        const next = { ...prev };
        if (!playerId || !nextPlayer) {
          delete next[key];
        } else {
          next[key] = {
            ...nextPlayer,
            poolId,
            userId: user?.userId || '',
            slot,
          };
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
    if (Date.now() >= poolDeadline) {
      toast.error(t('poolDetail.finalPhase.deadlinePassed'));
      return;
    }
    const key = `award:${award}`;
    const nextPlayer = players.find((player) => player.playerId === playerId);
    try {
      setSavingPlayerSlot(key);
      await apiClient.put(`/pools/${poolId}/players/award-selection`, {
        award,
        playerId: playerId || null,
      });
      setPlayerAwardSelections((prev) => ({
        ...prev,
        [award]:
          playerId && nextPlayer
            ? {
                ...nextPlayer,
                poolId,
                userId: user?.userId || '',
                award,
              }
            : undefined,
      }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('poolDetail.players.saveError'));
    } finally {
      setSavingPlayerSlot(null);
    }
  };

  const matchPredictionLabels = useMemo(
    () => ({
      saving: t('common.saving'),
      incomplete: t('poolDetail.match.incomplete'),
      exactPoints: (points: number) => t('poolDetail.match.exactResultPoints', { points }),
      correctWinnerPoints: (points: number) =>
        t('poolDetail.match.correctWinnerPoints', { points }),
      incorrect: t('poolDetail.match.incorrect'),
      result: (home: number | string, away: number | string) =>
        t('poolDetail.match.result', { home, away }),
      locked: t('poolDetail.deadline.passedShort'),
    }),
    [t],
  );

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <div className="container-app">
          <p style={{ color: 'rgb(var(--fg-muted))', textAlign: 'center', padding: '3rem 0' }}>
            {t('poolDetail.loading')}
          </p>
        </div>
      </main>
    );
  }

  const memberCount = pool.memberCount ?? (pool.members ? pool.members.length : 0);
  const poolDeadline = resolveDeadline(pool);
  const isPastPoolDeadline = Date.now() >= poolDeadline;
  const entryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;
  const prizeDistribution = resolvePrizeDistribution(pool);
  const totalPrizePool = (entryFee ?? 0) * memberCount;
  const prizeForRank = (rank: number): number =>
    totalPrizePool > 0 ? computePrize(totalPrizePool, prizeDistribution, rank) : 0;
  const formatCurrency = (amount: number) => formatEur(amount, locale);
  const groupMissingCount = Object.values(matchesByGroup)
    .flat()
    .filter((match) => {
      const prediction = predictions[match.matchId];
      return prediction?.homeScore === '' || prediction?.homeScore === undefined ||
        prediction?.awayScore === '' || prediction?.awayScore === undefined;
    }).length;
  const finalMissingCount = Object.values(bracket)
    .flat()
    .filter((match: any) => {
      const prediction = bracketPredictions[match.bracketMatchId];
      return !prediction?.homeTeamId || !prediction?.awayTeamId;
    }).length;
  const playerAwardSelectionCount = PLAYER_AWARDS.filter((award) => playerAwardSelections[award.key]).length;
  const playersMissingCount = Math.max(
    0,
    REQUIRED_PLAYER_SELECTIONS - Object.keys(playerSelections).length - playerAwardSelectionCount,
  );
  const tabs: Array<{ key: PoolTab; label: string; missingCount?: number }> = [
    { key: 'ranking', label: t('poolDetail.tabs.ranking') },
    { key: 'groups', label: t('poolDetail.tabs.groupPhase'), missingCount: isPastPoolDeadline ? 0 : groupMissingCount },
    { key: 'final', label: t('poolDetail.tabs.finalPhase'), missingCount: isPastPoolDeadline ? 0 : finalMissingCount },
    { key: 'players', label: t('poolDetail.tabs.players'), missingCount: isPastPoolDeadline ? 0 : playersMissingCount },
  ];
  const deadlineHint = new Date(poolDeadline).toLocaleDateString(locale, {
    second: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <main style={{
        position: 'relative',
        minHeight: 'calc(100vh - 4rem)',
        background: 'rgb(var(--bg))',
      }}>
      <div className="container-app" style={{ position: 'relative' }}>
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
            <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>
              {t('poolDetail.title')}
            </p>
            <h1
              style={{
                fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
              }}
            >
              <span className="gradient-text">{pool.name}</span>
            </h1>
          </div>
          <div style={{ alignSelf: 'flex-start' }}>
            <CountdownChip
              deadline={poolDeadline}
              label={t('poolDetail.deadline.general')}
              dateTime={deadlineHint}
              passedLabel={t('poolDetail.deadline.passed')}
            />
          </div>
        </header>

        <div className="tabs-frame">
          <div
            role="tablist"
            aria-label={t('poolDetail.tabs.label')}
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
                  <span>{tab.label}</span>
                  {tab.missingCount ? (
                    <Badge
                      variant="sunset"
                      className="badge-attention"
                      title={t('poolDetail.tabs.missingCount', { count: tab.missingCount })}
                      aria-label={t('poolDetail.tabs.missingCount', { count: tab.missingCount })}
                      leadingIcon={
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                          <path d="M12 9v4" />
                          <path d="M12 17h.01" />
                        </svg>
                      }
                    >
                      {tab.missingCount}
                    </Badge>
                  ) : null}
                </button>
              );
            })}
          </div>

          {activeTab === 'ranking' ? (
            <div className="tabs-panel">
            {ranking.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {ranking.map((entry) => {
                  const isCurrentUser =
                    (entry.userId && entry.userId === user?.userId) ||
                    entry.userName === user?.email;
                  const prize = prizeForRank(entry.rank);
                  return (
                    <RankCard
                      key={`${entry.rank}-${entry.userName}`}
                      rank={entry.rank}
                      name={entry.userName}
                      points={entry.points}
                      pointsLabel={entry.points === 1 ? t('common.point') : t('common.points')}
                      isCurrentUser={isCurrentUser}
                      prizeLabel={prize > 0 ? formatCurrency(prize) : undefined}
                      onSpy={
                        !isCurrentUser && entry.userId
                          ? () =>
                              handleStartSpy({ userId: entry.userId!, userName: entry.userName })
                          : undefined
                      }
                      spyLabel={t('poolDetail.spy.action')}
                    />
                  );
                })}
              </div>
            ) : (
              <p
                style={{
                  color: 'rgb(var(--fg-muted))',
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '1.5rem 0.5rem',
                }}
              >
                {t('poolDetail.ranking.empty')}
              </p>
            )}

            <SpyPicksModal
              spy={spy}
              onClose={() => setSpy(null)}
              groups={groups}
              matchesByGroup={matchesByGroup}
              bracketStructure={bracket}
              tournamentPlayers={players}
              poolDeadline={poolDeadline}
              labels={{
                title: (name) => t('poolDetail.spy.title', { name }),
                description: t('poolDetail.spy.description'),
                close: t('poolDetail.spy.close'),
                loading: t('poolDetail.spy.loading'),
                tabs: {
                  groups: t('poolDetail.spy.tabs.groups'),
                  final: t('poolDetail.spy.tabs.final'),
                  players: t('poolDetail.spy.tabs.players'),
                },
                empty: {
                  predictions: t('poolDetail.spy.empty.predictions'),
                  bracket: t('poolDetail.spy.empty.bracket'),
                  players: t('poolDetail.spy.empty.players'),
                },
                noPick: t('poolDetail.spy.noPick'),
                groupLabel: (group) => t('poolDetail.spy.groupLabel', { group }),
                positionLabel: (p) => t(`poolDetail.players.positions.${p}`),
                awardLabel: (award) =>
                  t(`poolDetail.players.awards.${award === 'golden_boot' ? 'goldenBoot' : 'tournamentMvp'}`),
                bracketRoundLabel: (phase) => t(`bracket.round.${phaseShortKey(phase)}`),
                vs: t('bracket.vs'),
                slotLabel: (slot) => t('poolDetail.players.slotLabel', { slot }),
                pointsLabel: (n) => (n === 1 ? t('common.point') : t('common.points')),
                ftLabel: t('poolDetail.spy.ftLabel') || 'FT',
              }}
              locale={locale}
            />
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
                      title={t('poolDetail.groupPhase.group', { group })}
                      collapsible
                      defaultExpanded
                      density="compact"
                      tone="subtle"
                      contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
                      style={{ padding: '0.45rem 0.55rem' }}
                    >
                      {groupMatches.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {groupMatches.map((match) => {
                            const prediction =
                              predictions[match.matchId] || ({ homeScore: '', awayScore: '' } as Prediction);
                            const isPastDeadline = Date.now() >= poolDeadline;
                            const matchDate = new Date(match.scheduledAt).toLocaleString(locale, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            });

                            const hasResults =
                              typeof match.homeResult === 'number' &&
                              typeof match.awayResult === 'number';
                            const isExactMatch = hasResults && prediction.isExactMatch === true;
                            const isCorrectWinner =
                              hasResults && prediction.isCorrect === true && !isExactMatch;
                            const hasUserPrediction =
                              prediction.homeScore !== '' && prediction.awayScore !== '';
                            const isIncorrect =
                              hasResults && hasUserPrediction && !prediction.isCorrect;
                            const isIncomplete =
                              !isPastDeadline &&
                              !hasResults &&
                              (prediction.homeScore === '' ||
                                prediction.awayScore === '' ||
                                (prediction.homeScore === 0 && prediction.awayScore === 0));

                            let state: MatchPredictionState;
                            let badgeLabel: string | undefined;
                            if (isExactMatch) {
                              state = 'exact';
                              badgeLabel = t('poolDetail.match.exactBadge');
                            } else if (isCorrectWinner) {
                              state = 'correct-winner';
                              badgeLabel = t('poolDetail.match.correctWinnerBadge');
                            } else if (isIncorrect) {
                              state = 'incorrect';
                              badgeLabel = t('poolDetail.match.incorrectBadge');
                            } else if (hasResults && !hasUserPrediction) {
                              state = 'pending';
                              badgeLabel = t('poolDetail.match.pendingBadge');
                            } else if (!hasResults && isPastDeadline) {
                              state = 'locked';
                              badgeLabel = t('poolDetail.deadline.passedShort');
                            } else if (isIncomplete) {
                              state = 'incomplete';
                              badgeLabel = t('poolDetail.match.incomplete');
                            } else {
                              state = 'open';
                            }

                            return (
                              <MatchPredictionCard
                                key={match.matchId}
                                matchDate={matchDate}
                                homeTeamName={countryWithFlag(match.homeTeamName)}
                                awayTeamName={countryWithFlag(match.awayTeamName)}
                                homeScore={prediction.homeScore}
                                awayScore={prediction.awayScore}
                                homeResult={match.homeResult ?? undefined}
                                awayResult={match.awayResult ?? undefined}
                                pointsEarned={prediction.points || 0}
                                state={state}
                                badgeLabel={badgeLabel}
                                disabled={isPastDeadline}
                                saving={submitting === match.matchId}
                                compact
                                onChange={(side, value) => handleScoreChange(match.matchId, side, value)}
                                labels={matchPredictionLabels}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '0.75rem', margin: 0 }}>
                          {t('poolDetail.groupPhase.noMatches')}
                        </p>
                      )}
                    </Section>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                {t('poolDetail.groupPhase.noMatches')}
              </p>
            )}
          </div>
        ) : null}

        {activeTab === 'final' ? (
          <div className="tabs-panel">
            {Object.keys(bracket).length > 0 ? (
              <BracketVisualization
                bracket={bracket}
                teams={teams}
                poolId={poolId}
                mode="user"
                bracketPredictions={bracketPredictions}
                deadline={poolDeadline}
                exactPositionPoints={bracketScoringConfig.exactPositionPoints}
                correctTeamWrongPositionPoints={bracketScoringConfig.correctTeamWrongPositionPoints}
                roundScoring={bracketScoringConfig.rounds}
                onPredictionChange={async (
                  bracketMatchId: string,
                  side: 'home' | 'away' | 'winner',
                  teamId: string,
                  teamName: string,
                ) => {
                  if (Date.now() >= poolDeadline) {
                    toast.error(t('poolDetail.finalPhase.deadlinePassed'));
                    return;
                  }

                  try {
                    const prediction = bracketPredictions[bracketMatchId];
                    const updates: any = {
                      predictedWinnerTeamId: prediction?.predictedWinnerTeamId || '',
                      predictedWinnerTeamName: prediction?.predictedWinnerTeamName || '',
                    };
                    if (side === 'home') {
                      updates.homeTeamId = teamId;
                      updates.homeTeamName = teamName;
                      updates.awayTeamId = prediction?.awayTeamId || '';
                      updates.awayTeamName = prediction?.awayTeamName || '';
                      if (
                        updates.predictedWinnerTeamId &&
                        updates.predictedWinnerTeamId !== teamId &&
                        updates.predictedWinnerTeamId !== updates.awayTeamId
                      ) {
                        updates.predictedWinnerTeamId = '';
                        updates.predictedWinnerTeamName = '';
                      }
                    } else if (side === 'away') {
                      updates.homeTeamId = prediction?.homeTeamId || '';
                      updates.homeTeamName = prediction?.homeTeamName || '';
                      updates.awayTeamId = teamId;
                      updates.awayTeamName = teamName;
                      if (
                        updates.predictedWinnerTeamId &&
                        updates.predictedWinnerTeamId !== updates.homeTeamId &&
                        updates.predictedWinnerTeamId !== teamId
                      ) {
                        updates.predictedWinnerTeamId = '';
                        updates.predictedWinnerTeamName = '';
                      }
                    } else {
                      updates.homeTeamId = prediction?.homeTeamId || '';
                      updates.homeTeamName = prediction?.homeTeamName || '';
                      updates.awayTeamId = prediction?.awayTeamId || '';
                      updates.awayTeamName = prediction?.awayTeamName || '';
                      updates.predictedWinnerTeamId = teamId;
                      updates.predictedWinnerTeamName = teamName;
                    }

                    await apiClient.post(
                      `/pools/${poolId}/bracket/matches/${bracketMatchId}/predict`,
                      updates,
                    );

                    setBracketPredictions((prev) => ({
                      ...prev,
                      [bracketMatchId]: { ...prediction, ...updates },
                    }));

                    toast.success(t('poolDetail.finalPhase.predictionSaved'));
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || t('poolDetail.errors.savePrediction'));
                  }
                }}
              />
            ) : (
              <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                {t('poolDetail.finalPhase.bracketUnavailable')}
              </p>
            )}
          </div>
        ) : null}

        {activeTab === 'players' ? (
          <div className="tabs-panel">
            {players.length > 0 ? (
              <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.65rem',
                  marginBottom: '0.9rem',
                }}
              >
                {PLAYER_AWARDS.map((award) => {
                  const selected = playerAwardSelections[award.key];
                  const isSaving = savingPlayerSlot === `award:${award.key}`;
                  return (
                    <article
                      key={award.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgb(var(--border))',
                        background: 'rgb(var(--bg-elevated))',
                        opacity: isSaving ? 0.7 : 1,
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          width: '2.15rem',
                          height: '2.15rem',
                          borderRadius: '999px',
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgb(var(--gold) / 0.16)',
                          border: '1px solid rgb(var(--gold) / 0.4)',
                          fontSize: '1.05rem',
                        }}
                      >
                        {selected?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={selected.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '999px', objectFit: 'cover' }} />
                        ) : (
                          award.icon
                        )}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, color: 'rgb(var(--fg))' }}>
                          {t(award.labelKey)}
                        </p>
                        <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'rgb(var(--fg-muted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selected
                            ? `${selected.flagEmoji || countryFlag(selected.teamName)} ${selected.name}`
                            : t(award.descriptionKey)}
                        </p>
                      </div>
                      {selected?.awardPoints ? (
                        <Badge variant="gold">{t('poolDetail.players.points', { points: selected.awardPoints })}</Badge>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        disabled={isSaving || isPastPoolDeadline}
                        title={isPastPoolDeadline ? t('poolDetail.deadline.passed') : t('poolDetail.players.editTitle')}
                        aria-label={isPastPoolDeadline ? t('poolDetail.deadline.passed') : t('poolDetail.players.editTitle')}
                        onClick={() => {
                          setPlayerPickerSearch('');
                          setPlayerPicker({ kind: 'award', award: award.key });
                        }}
                        style={{ width: '1.8rem', height: '1.8rem', flexShrink: 0, color: 'rgb(var(--gold))' }}
                      >
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                    </article>
                  );
                })}
              </div>
              <div style={{ overflowX: 'auto', overflowY: 'visible', margin: '0 -0.25rem', padding: '0 0.25rem' }}>
                {/* Soccer field. Goals sit just outside the green rectangle on
                    the left (defended by the team) and right (attacked by the
                    forwards). Player columns flow GK → DEF → MID → FWD. */}
                <div
                  style={{
                    position: 'relative',
                    minWidth: 720,
                    margin: '0.25rem 1.75rem',
                    padding: '1rem 0.85rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '2px solid rgb(255 255 255 / 0.85)',
                    background:
                      'repeating-linear-gradient(90deg, rgb(var(--pitch) / 0.16) 0 60px, rgb(var(--pitch) / 0.10) 60px 120px), linear-gradient(180deg, rgb(var(--pitch) / 0.18), rgb(var(--pitch) / 0.10))',
                    boxShadow: '0 12px 36px rgb(15 23 42 / 0.10)',
                  }}
                >
                  {/* Field markings */}
                  <svg
                    aria-hidden
                    viewBox="0 0 1000 500"
                    preserveAspectRatio="none"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                    }}
                  >
                    <g
                      stroke="rgb(255 255 255 / 0.85)"
                      strokeWidth="2"
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    >
                      <line x1="500" y1="0" x2="500" y2="500" />
                      <circle cx="500" cy="250" r="60" />
                      <circle cx="500" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
                      <rect x="0" y="120" width="160" height="260" />
                      <rect x="0" y="190" width="60" height="120" />
                      <circle cx="100" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
                      <path d="M 160 200 A 50 50 0 0 1 160 300" />
                      <rect x="840" y="120" width="160" height="260" />
                      <rect x="940" y="190" width="60" height="120" />
                      <circle cx="900" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
                      <path d="M 840 200 A 50 50 0 0 0 840 300" />
                      <path d="M 0 14 A 14 14 0 0 1 14 0" />
                      <path d="M 1000 14 A 14 14 0 0 0 986 0" />
                      <path d="M 0 486 A 14 14 0 0 0 14 500" />
                      <path d="M 1000 486 A 14 14 0 0 0 986 500" />
                    </g>
                  </svg>

                  {/* Goals (drawn outside the green field) */}
                  {(['left', 'right'] as const).map((side) => (
                    <div
                      key={side}
                      aria-hidden
                      style={{
                        position: 'absolute',
                        top: '50%',
                        [side]: '-1.4rem',
                        transform: 'translateY(-50%)',
                        width: '1.3rem',
                        height: '36%',
                        background:
                          'repeating-linear-gradient(0deg, rgb(255 255 255 / 0.40) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.40) 0 1px, transparent 1px 6px)',
                        border: '2px solid rgb(255 255 255 / 0.85)',
                        ...(side === 'left'
                          ? { borderRight: 'none', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }
                          : { borderLeft: 'none', borderTopRightRadius: 4, borderBottomRightRadius: 4 }),
                      }}
                    />
                  ))}

                  {/* Player columns */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 1,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {PLAYER_POSITIONS.map(({ key: position, labelKey }) => {
                      const tone = POSITION_TONE[position];
                      const options = players.filter((player) => player.position === position);
                      return (
                        <section
                          key={position}
                          style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', minWidth: 0 }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignSelf: 'center',
                              alignItems: 'center',
                              gap: '0.3rem',
                              padding: '0.25rem 0.6rem',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              letterSpacing: '0.14em',
                              textTransform: 'uppercase',
                              color: tone.chipFg,
                              background: 'rgb(var(--bg-elevated) / 0.95)',
                              border: `1px solid ${tone.border}`,
                              borderRadius: '999px',
                              boxShadow: '0 2px 6px rgb(15 23 42 / 0.06)',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={t(labelKey)}
                          >
                            <span
                              aria-hidden
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '999px',
                                background: tone.label,
                                flexShrink: 0,
                              }}
                            />
                            <span className="md-only" style={{ display: 'inline' }}>{t(labelKey)}</span>
                          </span>
                          {Array.from({ length: PLAYER_SELECTION_LIMIT }, (_, index) => {
                            const slot = index + 1;
                            const selectionKey = `${position}:${slot}`;
                            const selected = playerSelections[selectionKey];
                            const isSaving = savingPlayerSlot === selectionKey;
                            const editLabel = `${t('poolDetail.players.editTitle')} — ${t(labelKey)} ${slot}`;
                            return (
                              <article
                                key={selectionKey}
                                style={{
                                  position: 'relative',
                                  minWidth: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.45rem',
                                  padding: '0.45rem 0.5rem',
                                  borderRadius: 'var(--radius-md)',
                                  border: '1px solid rgb(255 255 255 / 0.55)',
                                  borderTop: `3px solid ${tone.label}`,
                                  background: 'rgb(var(--bg-elevated) / 0.62)',
                                  backdropFilter: 'blur(6px) saturate(120%)',
                                  WebkitBackdropFilter: 'blur(6px) saturate(120%)',
                                  boxShadow: '0 4px 14px rgb(15 23 42 / 0.10)',
                                  opacity: isSaving ? 0.7 : 1,
                                  transition: 'opacity 0.15s ease, background 0.15s ease',
                                }}
                              >
                                {selected ? (
                                  <PlayerTotalPointsBadge
                                    points={selected.totalPoints || 0}
                                    label={t('poolDetail.players.points', { points: selected.totalPoints || 0 })}
                                  />
                                ) : null}
                                <div
                                  style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '999px',
                                    overflow: 'hidden',
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                    background: tone.tint,
                                    border: `1px solid ${tone.border}`,
                                    color: tone.chipFg,
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                  }}
                                >
                                  {selected?.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={selected.imageUrl}
                                      alt=""
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                  ) : selected?.name ? (
                                    selected.name.slice(0, 2).toUpperCase()
                                  ) : (
                                    slot
                                  )}
                                </div>
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      color: 'rgb(var(--fg))',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {selected?.name || t('poolDetail.players.emptySlot')}
                                  </p>
                                  <p
                                    style={{
                                      margin: '0.1rem 0 0',
                                      fontSize: '0.66rem',
                                      color: 'rgb(var(--fg-muted))',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {selected
                                      ? `${selected.flagEmoji || countryFlag(selected.teamName)} ${selected.teamName}`
                                      : t('poolDetail.players.slotLabel', { slot })}
                                  </p>
                                  {selected ? (
                                    <PlayerActionSummary
                                      player={selected}
                                      labels={{
                                        goals: t('poolDetail.players.actions.goals'),
                                        missedPenalties: t('poolDetail.players.actions.missedPenalties'),
                                        mvps: t('poolDetail.players.actions.mvps'),
                                        penaltiesSaved: t('poolDetail.players.actions.penaltiesSaved'),
                                        cleanSheets: t('poolDetail.players.actions.cleanSheets'),
                                        assists: t('poolDetail.players.actions.assists'),
                                        yellowCards: t('poolDetail.players.actions.yellowCards'),
                                        redCards: t('poolDetail.players.actions.redCards'),
                                      }}
                                    />
                                  ) : null}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon"
                                  onClick={() => {
                                    setPlayerPickerSearch('');
                                    setPlayerPicker({ kind: 'regular', position, slot });
                                  }}
                                  disabled={isSaving || isPastPoolDeadline}
                                  title={isPastPoolDeadline ? t('poolDetail.deadline.passed') : editLabel}
                                  aria-label={isPastPoolDeadline ? t('poolDetail.deadline.passed') : editLabel}
                                  style={{
                                    width: '1.7rem',
                                    height: '1.7rem',
                                    flexShrink: 0,
                                    color: tone.chipFg,
                                  }}
                                >
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    aria-hidden
                                  >
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                                  </svg>
                                </button>
                              </article>
                            );
                          })}
                        </section>
                      );
                    })}
                  </div>
                </div>
              </div>
              </>
            ) : (
              <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
                {t('poolDetail.players.empty')}
              </p>
            )}

            <PlayerPickerModal
              picker={playerPicker}
              players={players}
              selections={playerSelections}
              awardSelections={playerAwardSelections}
              search={playerPickerSearch}
              onSearchChange={setPlayerPickerSearch}
              onClose={() => setPlayerPicker(null)}
              onPick={async (playerId) => {
                if (!playerPicker) return;
                if (playerPicker.kind === 'regular') {
                  await handlePlayerSelection(playerPicker.position, playerPicker.slot, playerId);
                } else {
                  await handlePlayerAwardSelection(playerPicker.award, playerId);
                }
                setPlayerPicker(null);
              }}
              isSaving={savingPlayerSlot !== null}
              labels={{
                edit: t('poolDetail.players.editTitle'),
                positionLabel: (p) => t(`poolDetail.players.positions.${p}`),
                awardLabel: (award) => t(`poolDetail.players.awards.${award === 'golden_boot' ? 'goldenBoot' : 'tournamentMvp'}`),
                awardDescription: (award) =>
                  t(
                    `poolDetail.players.awards.${
                      award === 'golden_boot' ? 'goldenBootDescription' : 'tournamentMvpDescription'
                    }`,
                  ),
                slotLabel: (slot: number) => t('poolDetail.players.modalDescription', { slot }),
                searchPlaceholder: t('poolDetail.players.searchPlaceholder'),
                clear: t('poolDetail.players.clearSelection'),
                cancel: t('poolDetail.players.cancel'),
                noResults: t('poolDetail.players.noResults'),
              }}
            />
          </div>
        ) : null}
        </div>
      </div>
    </main>
  );
}

interface PlayerPickerLabels {
  edit: string;
  positionLabel: (position: PlayerPosition) => string;
  awardLabel: (award: PlayerAward) => string;
  awardDescription: (award: PlayerAward) => string;
  slotLabel: (slot: number) => string;
  searchPlaceholder: string;
  clear: string;
  cancel: string;
  noResults: string;
}

function PlayerActionSummary({
  player,
  labels,
}: {
  player: Pick<
    TournamentPlayer,
    | 'goals'
    | 'missedPenalties'
    | 'mvps'
    | 'penaltiesSaved'
    | 'cleanSheets'
    | 'assists'
    | 'yellowCards'
    | 'redCards'
  >;
  labels: {
    goals: string;
    missedPenalties: string;
    mvps: string;
    penaltiesSaved: string;
    cleanSheets: string;
    assists: string;
    yellowCards: string;
    redCards: string;
  };
}) {
  // All 8 stats render as pills regardless of value — zero-valued ones are
  // visually muted so the user always sees what scoring categories exist.
  const items = [
    { key: 'goals', value: player.goals || 0, label: labels.goals, icon: '⚽' },
    { key: 'assists', value: player.assists || 0, label: labels.assists, icon: '🅰' },
    { key: 'missedPenalties', value: player.missedPenalties || 0, label: labels.missedPenalties, icon: '❌' },
    { key: 'mvps', value: player.mvps || 0, label: labels.mvps, icon: '⭐️' },
    { key: 'penaltiesSaved', value: player.penaltiesSaved || 0, label: labels.penaltiesSaved, icon: '🧤' },
    { key: 'cleanSheets', value: player.cleanSheets || 0, label: labels.cleanSheets, icon: '🛡' },
    { key: 'yellowCards', value: player.yellowCards || 0, label: labels.yellowCards, icon: '🟨' },
    { key: 'redCards', value: player.redCards || 0, label: labels.redCards, icon: '🟥' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.22rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
      {items.map((item) => {
        const isZero = item.value === 0;
        return (
          <span
            key={item.key}
            title={`${item.label}: ${item.value}`}
            aria-label={`${item.label}: ${item.value}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.12rem',
              padding: '0.08rem 0.28rem',
              borderRadius: '999px',
              background: isZero ? 'transparent' : 'rgb(var(--bg-subtle) / 0.92)',
              border: isZero
                ? '1px dashed rgb(var(--border-subtle))'
                : '1px solid rgb(var(--border-subtle))',
              color: isZero ? 'rgb(var(--fg-subtle))' : 'rgb(var(--fg))',
              opacity: isZero ? 0.45 : 1,
              filter: isZero ? 'grayscale(85%)' : 'none',
              fontSize: '0.58rem',
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            <span aria-hidden>{item.icon}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Prominent total-points pill that anchors the top-right corner of a player
 * card. Uses the gold accent so it pops against both the green pitch and the
 * neutral surface beneath the cards.
 */
function PlayerTotalPointsBadge({ points, label }: { points: number; label: string }) {
  return (
    <span
      title={label}
      aria-label={label}
      style={{
        position: 'absolute',
        top: '-0.45rem',
        right: '-0.45rem',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '1.6rem',
        padding: '0.18rem 0.45rem',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, rgb(var(--gold)), rgb(var(--sunset)))',
        color: 'rgb(var(--accent-fg))',
        fontSize: '0.72rem',
        fontWeight: 800,
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        border: '2px solid rgb(var(--bg-elevated))',
        boxShadow: '0 4px 12px rgb(15 23 42 / 0.20)',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      {points}
    </span>
  );
}

interface PlayerPickerModalProps {
  picker: PlayerPickerState | null;
  players: TournamentPlayer[];
  selections: Record<string, PlayerSelection>;
  awardSelections: Record<PlayerAward, PlayerAwardSelection | undefined>;
  search: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onPick: (playerId: string) => Promise<void> | void;
  isSaving: boolean;
  labels: PlayerPickerLabels;
}

function PlayerPickerModal({
  picker,
  players,
  selections,
  awardSelections,
  search,
  onSearchChange,
  onClose,
  onPick,
  isSaving,
  labels,
}: PlayerPickerModalProps) {
  const open = picker !== null;
  const isRegular = picker?.kind === 'regular';
  const position = isRegular ? picker.position : undefined;
  const slot = isRegular ? picker.slot : 0;
  const award = picker?.kind === 'award' ? picker.award : undefined;

  const currentKey = picker
    ? picker.kind === 'regular'
      ? `${picker.position}:${picker.slot}`
      : picker.award
    : '';
  const currentSelected = picker?.kind === 'regular' ? selections[currentKey] : award ? awardSelections[award] : undefined;

  // Regular player selections allow only one player per team. Award picks are
  // intentionally excluded from this rule and may reuse any player.
  const takenTeamIds = new Set(
    Object.entries(selections)
      .filter(([key]) => picker?.kind === 'regular' && key !== currentKey)
      .map(([, value]) => value.teamId),
  );

  const normalizedSearch = search.trim().toLowerCase();
  const eligible = position
    ? players
        .filter((p) => p.position === position)
        .filter((p) =>
          !normalizedSearch
            ? true
            : p.name.toLowerCase().includes(normalizedSearch) ||
              p.teamName.toLowerCase().includes(normalizedSearch),
        )
        .sort((a, b) => {
          const teamCmp = a.teamName.localeCompare(b.teamName);
          if (teamCmp !== 0) return teamCmp;
          return a.name.localeCompare(b.name);
        })
    : award
    ? players
        .filter((p) =>
          !normalizedSearch
            ? true
            : p.name.toLowerCase().includes(normalizedSearch) ||
              p.teamName.toLowerCase().includes(normalizedSearch),
        )
        .sort((a, b) => {
          const teamCmp = a.teamName.localeCompare(b.teamName);
          if (teamCmp !== 0) return teamCmp;
          return a.name.localeCompare(b.name);
        })
    : [];

  // Group by team for visual readability — each team becomes a labelled
  // section in the list.
  const grouped: Array<{ teamId: string; teamName: string; flagEmoji?: string; players: TournamentPlayer[] }> = [];
  for (const player of eligible) {
    const last = grouped[grouped.length - 1];
    if (last && last.teamId === player.teamId) {
      last.players.push(player);
    } else {
      grouped.push({
        teamId: player.teamId,
        teamName: player.teamName,
        flagEmoji: player.flagEmoji,
        players: [player],
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isSaving}
      title={position ? labels.positionLabel(position) : award ? labels.awardLabel(award) : ''}
      description={position ? labels.slotLabel(slot) : award ? labels.awardDescription(award) : ''}
      size="md"
      footer={
        <>
          {currentSelected ? (
            <Button
              variant="danger"
              onClick={() => onPick('')}
              disabled={isSaving}
            >
              {labels.clear}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            {labels.cancel}
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <Input
          type="search"
          placeholder={labels.searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          autoComplete="off"
          autoFocus
        />
        <div
          style={{
            maxHeight: 'min(60vh, 460px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            paddingRight: '0.25rem',
          }}
        >
          {grouped.length === 0 ? (
            <p
              style={{
                color: 'rgb(var(--fg-muted))',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '1.5rem 0.5rem',
                margin: 0,
              }}
            >
              {labels.noResults}
            </p>
          ) : (
            grouped.map((group) => (
              <section key={group.teamId} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <header
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgb(var(--fg-subtle))',
                  }}
                >
                  <span aria-hidden>{group.flagEmoji || countryFlag(group.teamName)}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {group.teamName}
                  </span>
                </header>
                <ul
                  style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    display: 'grid',
                    gap: '0.3rem',
                  }}
                >
                  {group.players.map((player) => {
                    const isCurrent = currentSelected?.playerId === player.playerId;
                    const isTaken = takenTeamIds.has(player.teamId);
                    return (
                      <li key={player.playerId}>
                        <button
                          type="button"
                          onClick={() => !isTaken && onPick(player.playerId)}
                          disabled={isSaving || isTaken}
                          aria-pressed={isCurrent}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.55rem 0.7rem',
                            borderRadius: 'var(--radius-md)',
                            border: `1px solid ${
                              isCurrent ? 'rgb(var(--accent-from) / 0.55)' : 'rgb(var(--border))'
                            }`,
                            background: isCurrent
                              ? 'rgb(var(--accent-from) / 0.08)'
                              : isTaken
                              ? 'rgb(var(--bg-subtle))'
                              : 'rgb(var(--bg-elevated))',
                            color: 'rgb(var(--fg))',
                            cursor: isTaken ? 'not-allowed' : 'pointer',
                            opacity: isTaken && !isCurrent ? 0.55 : 1,
                            transition: 'background 0.15s ease, border-color 0.15s ease',
                          }}
                        >
                          <span
                            aria-hidden
                            style={{
                              width: '1.85rem',
                              height: '1.85rem',
                              borderRadius: '999px',
                              overflow: 'hidden',
                              display: 'grid',
                              placeItems: 'center',
                              flexShrink: 0,
                              background: 'rgb(var(--bg-subtle))',
                              border: '1px solid rgb(var(--border))',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: 'rgb(var(--fg-muted))',
                            }}
                          >
                            {player.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={player.imageUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              player.name.slice(0, 2).toUpperCase()
                            )}
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span
                              style={{
                                display: 'block',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {player.name}
                            </span>
                          </span>
                          {isCurrent ? (
                            <Badge variant="pitch">✓</Badge>
                          ) : isTaken ? (
                            <Badge variant="neutral">·</Badge>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

interface SpyPicksLabels {
  title: (name: string) => string;
  description: string;
  close: string;
  loading: string;
  tabs: { groups: string; final: string; players: string };
  empty: { predictions: string; bracket: string; players: string };
  noPick: string;
  groupLabel: (group: string) => string;
  positionLabel: (p: PlayerPosition) => string;
  awardLabel: (award: PlayerAward) => string;
  bracketRoundLabel: (phase: string) => string;
  vs: string;
  slotLabel: (slot: number) => string;
  pointsLabel: (n: number) => string;
  ftLabel: string;
}

interface SpyPicksModalProps {
  spy: {
    target: { userId: string; userName: string };
    loading: boolean;
    error: string | null;
    data: SpyPicksData | null;
  } | null;
  onClose: () => void;
  groups: string[];
  matchesByGroup: Record<string, Match[]>;
  bracketStructure: Record<string, any[]>;
  tournamentPlayers: TournamentPlayer[];
  poolDeadline: number;
  labels: SpyPicksLabels;
  locale: string;
}

function SpyPicksModal({
  spy,
  onClose,
  groups,
  matchesByGroup,
  bracketStructure,
  tournamentPlayers,
  labels,
  locale,
}: SpyPicksModalProps) {
  const [tab, setTab] = useState<'groups' | 'final' | 'players'>('groups');

  // Reset to default tab whenever a different user is opened. We intentionally
  // depend on the target user id only — re-render on data/loading shouldn't
  // bounce the active tab back to "groups".
  const targetUserId = spy?.target.userId;
  useEffect(() => {
    if (targetUserId) setTab('groups');
  }, [targetUserId]);

  const open = spy !== null;
  const data = spy?.data ?? null;
  const loading = spy?.loading ?? false;
  const error = spy?.error ?? null;
  const userName = spy?.target.userName ?? '';

  const predictionByMatch = new Map<string, SpyPicksData['predictions'][number]>();
  if (data) {
    for (const p of data.predictions) predictionByMatch.set(p.matchId, p);
  }

  const bracketPickByMatch = new Map<string, SpyBracketPrediction>();
  if (data) {
    for (const p of data.bracketPredictions) bracketPickByMatch.set(p.bracketMatchId, p);
  }

  const playerByPositionSlot = new Map<string, PlayerSelection>();
  const playerByAward = new Map<PlayerAward, PlayerAwardSelection>();
  if (data) {
    for (const sel of data.playerSelections) {
      playerByPositionSlot.set(`${sel.position}:${sel.slot}`, sel);
    }
    for (const sel of data.playerAwardSelections || []) {
      playerByAward.set(sel.award, sel);
    }
  }

  const tabButton = (key: typeof tab, label: string) => {
    const selected = tab === key;
    return (
      <button
        key={key}
        type="button"
        role="tab"
        aria-selected={selected}
        onClick={() => setTab(key)}
        style={{
          flex: 1,
          padding: '0.5rem 0.75rem',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-sm)',
          background: selected ? 'rgb(var(--pitch) / 0.12)' : 'rgb(var(--bg-subtle))',
          color: selected ? 'rgb(var(--fg))' : 'rgb(var(--fg-muted))',
          fontWeight: selected ? 700 : 600,
          fontSize: '0.85rem',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={userName ? labels.title(userName) : ''}
      description={labels.description}
      size="lg"
      footer={
        <Button variant="ghost" onClick={onClose}>
          {labels.close}
        </Button>
      }
    >
      <div role="tablist" style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {tabButton('groups', labels.tabs.groups)}
        {tabButton('final', labels.tabs.final)}
        {tabButton('players', labels.tabs.players)}
      </div>

      <div style={{ maxHeight: 'min(65vh, 540px)', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {loading ? (
          <p style={{ color: 'rgb(var(--fg-muted))', textAlign: 'center', padding: '2rem 0' }}>
            {labels.loading}
          </p>
        ) : error ? (
          <p style={{ color: 'rgb(var(--live))', textAlign: 'center', padding: '2rem 0' }}>{error}</p>
        ) : !data ? null : tab === 'groups' ? (
          <SpyGroupsView
            data={data}
            groups={groups}
            matchesByGroup={matchesByGroup}
            predictionByMatch={predictionByMatch}
            labels={labels}
            locale={locale}
          />
        ) : tab === 'final' ? (
          <SpyFinalView
            bracketStructure={bracketStructure}
            bracketPickByMatch={bracketPickByMatch}
            labels={labels}
          />
        ) : (
          <SpyPlayersView
            tournamentPlayers={tournamentPlayers}
            playerByPositionSlot={playerByPositionSlot}
            playerByAward={playerByAward}
            labels={labels}
          />
        )}
      </div>
    </Modal>
  );
}

function SpyGroupsView({
  data,
  groups,
  matchesByGroup,
  predictionByMatch,
  labels,
  locale,
}: {
  data: SpyPicksData;
  groups: string[];
  matchesByGroup: Record<string, Match[]>;
  predictionByMatch: Map<string, SpyPicksData['predictions'][number]>;
  labels: SpyPicksLabels;
  locale: string;
}) {
  if (data.predictions.length === 0 && groups.length === 0) {
    return <SpyEmpty text={labels.empty.predictions} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {groups.map((group) => {
        const matches = matchesByGroup[group] || [];
        return (
          <section key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <header
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgb(var(--fg-subtle))',
              }}
            >
              {labels.groupLabel(group)}
            </header>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem' }}>
              {matches.map((match) => {
                const pick = predictionByMatch.get(match.matchId);
                const hasPick =
                  pick && typeof pick.homeScore === 'number' && typeof pick.awayScore === 'number';
                const hasResult =
                  typeof match.homeResult === 'number' && typeof match.awayResult === 'number';
                const points = pick?.points ?? 0;
                const tone =
                  pick?.isExactMatch === true
                    ? 'rgb(var(--info))'
                    : pick?.isCorrect === true
                    ? 'rgb(var(--pitch))'
                    : hasResult && hasPick
                    ? 'rgb(var(--live))'
                    : 'rgb(var(--fg-subtle))';
                const matchDate = new Date(match.scheduledAt).toLocaleString(locale, {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                });
                return (
                  <li
                    key={match.matchId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.55rem 0.7rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgb(var(--bg-elevated))',
                      border: '1px solid rgb(var(--border))',
                    }}
                  >
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgb(var(--fg-subtle))', fontWeight: 600 }}>
                      <span>{matchDate}</span>
                      {hasResult ? (
                        <span style={{ color: 'rgb(var(--fg-muted))' }}>
                          {labels.ftLabel} {match.homeResult}-{match.awayResult}
                        </span>
                      ) : null}
                    </div>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'rgb(var(--fg))',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {match.homeTeamName}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-display, inherit)',
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: tone,
                        fontVariantNumeric: 'tabular-nums',
                        textAlign: 'center',
                        minWidth: '3.5rem',
                      }}
                    >
                      {hasPick ? `${pick!.homeScore} – ${pick!.awayScore}` : labels.noPick}
                    </span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: 'rgb(var(--fg))',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {match.awayTeamName}
                    </span>
                    {hasPick && hasResult ? (
                      <div
                        style={{
                          gridColumn: '1 / -1',
                          textAlign: 'right',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: tone,
                        }}
                      >
                        {points > 0 ? `+${points} ${labels.pointsLabel(points)}` : '0'}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SpyFinalView({
  bracketStructure,
  bracketPickByMatch,
  labels,
}: {
  bracketStructure: Record<string, any[]>;
  bracketPickByMatch: Map<string, SpyBracketPrediction>;
  labels: SpyPicksLabels;
}) {
  const phases = ['16th-finals', '8th-finals', 'quarter-finals', 'semi-finals', 'finals'];
  const hasAny = phases.some((p) => Array.isArray(bracketStructure[p]) && bracketStructure[p].length > 0);
  if (!hasAny) return <SpyEmpty text={labels.empty.bracket} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {phases.map((phase) => {
        const matches = (bracketStructure[phase] || []).slice().sort((a: any, b: any) => (a.matchNumber || 0) - (b.matchNumber || 0));
        if (matches.length === 0) return null;
        return (
          <section key={phase} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <header
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgb(var(--fg-subtle))',
              }}
            >
              {labels.bracketRoundLabel(phase)}
            </header>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem' }}>
              {matches.map((match: any) => {
                const pick = bracketPickByMatch.get(match.bracketMatchId);
                const homeName = pick?.homeTeamName || '—';
                const awayName = pick?.awayTeamName || '—';
                const homeExact = pick?.homeTeamExactPosition === true;
                const homeWrong = pick?.homeTeamCorrectButWrongPosition === true;
                const awayExact = pick?.awayTeamExactPosition === true;
                const awayWrong = pick?.awayTeamCorrectButWrongPosition === true;
                const points = pick?.points ?? 0;
                return (
                  <li
                    key={match.bracketMatchId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: '0.55rem',
                      padding: '0.5rem 0.7rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgb(var(--bg-elevated))',
                      border: '1px solid rgb(var(--border))',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: pick?.homeTeamId ? 'rgb(var(--fg))' : 'rgb(var(--fg-subtle))',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        borderLeft: homeExact
                          ? '3px solid rgb(var(--info))'
                          : homeWrong
                          ? '3px solid rgb(var(--pitch))'
                          : '3px solid transparent',
                        paddingLeft: '0.4rem',
                      }}
                    >
                      {homeName}
                    </span>
                    <span
                      aria-hidden
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: 'rgb(var(--fg-subtle))',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {labels.vs}
                    </span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: pick?.awayTeamId ? 'rgb(var(--fg))' : 'rgb(var(--fg-subtle))',
                        textAlign: 'right',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        borderRight: awayExact
                          ? '3px solid rgb(var(--info))'
                          : awayWrong
                          ? '3px solid rgb(var(--pitch))'
                          : '3px solid transparent',
                        paddingRight: '0.4rem',
                      }}
                    >
                      {awayName}
                    </span>
                    {points > 0 ? (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: 'rgb(var(--gold))' }}>
                        +{points}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function SpyPlayersView({
  tournamentPlayers,
  playerByPositionSlot,
  playerByAward,
  labels,
}: {
  tournamentPlayers: TournamentPlayer[];
  playerByPositionSlot: Map<string, PlayerSelection>;
  playerByAward: Map<PlayerAward, PlayerAwardSelection>;
  labels: SpyPicksLabels;
}) {
  const positions: PlayerPosition[] = ['goalkeeper', 'defender', 'midfielder', 'forward'];
  const anyPick =
    playerByAward.size > 0 ||
    positions.some((p) => {
      for (let s = 1; s <= PLAYER_SELECTION_LIMIT; s += 1) if (playerByPositionSlot.has(`${p}:${s}`)) return true;
      return false;
    });
  if (tournamentPlayers.length > 0 && !anyPick) return <SpyEmpty text={labels.empty.players} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <header
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgb(var(--fg-subtle))',
          }}
        >
          {labels.awardLabel('golden_boot')} / {labels.awardLabel('tournament_mvp')}
        </header>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '0.35rem',
          }}
        >
          {PLAYER_AWARDS.map((award) => {
            const sel = playerByAward.get(award.key);
            return (
              <SpyPlayerTile
                key={award.key}
                label={labels.awardLabel(award.key)}
                selection={sel}
                fallbackIcon={award.icon}
              />
            );
          })}
        </ul>
      </section>
      {positions.map((position) => (
        <section key={position} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <header
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgb(var(--fg-subtle))',
            }}
          >
            {labels.positionLabel(position)}
          </header>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '0.35rem',
            }}
          >
            {Array.from({ length: PLAYER_SELECTION_LIMIT }, (_, idx) => {
              const slot = idx + 1;
              const sel = playerByPositionSlot.get(`${position}:${slot}`);
              return <SpyPlayerTile key={`${position}:${slot}`} label={labels.slotLabel(slot)} selection={sel} fallbackIcon={slot} />;
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SpyPlayerTile({
  label,
  selection,
  fallbackIcon,
}: {
  label: string;
  selection?: PlayerSelection | PlayerAwardSelection;
  fallbackIcon: string | number;
}) {
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.4rem 0.55rem',
        borderRadius: 'var(--radius-sm)',
        background: selection ? 'rgb(var(--bg-elevated))' : 'rgb(var(--bg-subtle))',
        border: '1px solid rgb(var(--border))',
      }}
    >
      <span
        aria-hidden
        style={{
          width: '1.4rem',
          height: '1.4rem',
          borderRadius: '999px',
          background: 'rgb(var(--bg-subtle))',
          border: '1px solid rgb(var(--border))',
          display: 'inline-grid',
          placeItems: 'center',
          fontSize: '0.65rem',
          fontWeight: 700,
          color: 'rgb(var(--fg-muted))',
        }}
      >
        {fallbackIcon}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span
          style={{
            display: 'block',
            fontSize: '0.78rem',
            fontWeight: 600,
            color: selection ? 'rgb(var(--fg))' : 'rgb(var(--fg-subtle))',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selection?.name || label}
        </span>
        {selection ? (
          <span
            style={{
              display: 'block',
              fontSize: '0.65rem',
              color: 'rgb(var(--fg-muted))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selection.flagEmoji || countryFlag(selection.teamName)} {selection.teamName}
          </span>
        ) : null}
      </span>
    </li>
  );
}

function SpyEmpty({ text }: { text: string }) {
  return (
    <p
      style={{
        color: 'rgb(var(--fg-muted))',
        fontSize: '0.875rem',
        textAlign: 'center',
        fontStyle: 'italic',
        padding: '2rem 1rem',
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

export default function PoolDetailPage() {
  return (
    <ProtectedRoute>
      <PoolDetailContent />
    </ProtectedRoute>
  );
}
