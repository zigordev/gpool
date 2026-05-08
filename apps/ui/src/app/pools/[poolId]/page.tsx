'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { BracketVisualization } from '@/components/BracketVisualization';
import { buildBracketProjection } from '@/lib/bracket-projection';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CountdownChip } from '@/components/ui/CountdownChip';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Section } from '@/components/ui/Section';
import { MatchPredictionCard, type MatchPredictionState } from '@/components/pool/MatchPredictionCard';
import { RankCard } from '@/components/pool/RankCard';
import { countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { FaFutbol, FaMagic, FaStar, FaShieldAlt, FaClock, FaMedal } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { PiBoxingGlove } from 'react-icons/pi';
import { FaPerson } from 'react-icons/fa6';
import { MdOnlinePrediction } from 'react-icons/md';
import { BsFillDiagram3Fill } from 'react-icons/bs';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';
import { PlayerPickerState } from '@/types/playerPickerState.type';
import { BracketRoundScoring } from '@/types/bracketRoundScoring.type';
import { BracketScoringConfig } from '@/types/bracketScoringConfig.type';
import { PlayerPosition } from '@/types/playerPosition.type';
import { PlayerSelection } from '@/types/playerSelection.interface';
import { PoolTab } from '@/types/poolTab.type';
import { SpyPicksData } from '@/types/spyPicksData.interface';
import { PlayerPickerLabels } from '@/types/playerPickerLabels.interface';
import { PrizePayout } from '@/types/prizePayout.type';
import { SpyPicksLabels } from '@/types/spyPicksLabels.interface';
import { Loading } from '@/components/Loading';
import { PlayerTotalPointsBadge } from '@/components/PlayerTotalPointsBadge';
import { RankTable } from '@/components/pool/RankTable';

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
const DEFAULT_GROUP_WINNER_POINTS = 1;
const DEFAULT_GROUP_EXACT_POINTS = 3;
const DEFAULT_PLAYER_RULE_SCORING = {
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

const PLAYER_POSITIONS: Array<{ key: PlayerPosition; labelKey: string; }> = [
  { key: 'goalkeeper', labelKey: 'poolDetail.players.positions.goalkeeper' },
  { key: 'defender', labelKey: 'poolDetail.players.positions.defender' },
  { key: 'midfielder', labelKey: 'poolDetail.players.positions.midfielder' },
  { key: 'forward', labelKey: 'poolDetail.players.positions.forward' },
];

const PLAYER_AWARDS: Array<{ key: PlayerAward; labelKey: string; descriptionKey: string; icon: any }> = [
  {
    key: 'golden_boot',
    labelKey: 'poolDetail.players.awards.goldenBoot',
    descriptionKey: 'poolDetail.players.awards.goldenBootDescription',
    icon: <FaFutbol style={ {color: 'gold' } } size='27'/>,
  },
  {
    key: 'tournament_mvp',
    labelKey: 'poolDetail.players.awards.tournamentMvp',
    descriptionKey: 'poolDetail.players.awards.tournamentMvpDescription',
    icon: <FaStar style={ {color: 'gold' } } size='27'/>,
  },
];

const DEFAULT_POOL_DEADLINE = new Date('2026-06-08T00:00:00Z').getTime();
const PLAYER_SELECTION_LIMIT = 6;
const REQUIRED_PLAYER_SELECTIONS = PLAYER_POSITIONS.length * PLAYER_SELECTION_LIMIT + PLAYER_AWARDS.length;

function resolveDeadline(pool: any): number {
  const raw = pool?.config?.deadline;
  if (raw == null) return DEFAULT_POOL_DEADLINE;
  const value = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_POOL_DEADLINE;
}

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

function resolveGroupScoring(value: any) {
  return {
    winnerPoints: Number.isFinite(Number(value?.winnerPoints))
      ? Math.max(0, Number(value.winnerPoints))
      : DEFAULT_GROUP_WINNER_POINTS,
    exactResultPoints: Number.isFinite(Number(value?.exactResultPoints))
      ? Math.max(0, Number(value.exactResultPoints))
      : DEFAULT_GROUP_EXACT_POINTS,
  };
}

function resolvePositionScoring<T extends Record<PlayerPosition, number>>(
  value: any,
  fallback: T,
): T {
  return {
    goalkeeper: Number.isFinite(Number(value?.goalkeeper)) ? Number(value.goalkeeper) : fallback.goalkeeper,
    defender: Number.isFinite(Number(value?.defender)) ? Number(value.defender) : fallback.defender,
    midfielder: Number.isFinite(Number(value?.midfielder)) ? Number(value.midfielder) : fallback.midfielder,
    forward: Number.isFinite(Number(value?.forward)) ? Number(value.forward) : fallback.forward,
  } as T;
}

function resolvePlayerRuleScoring(value: any) {
  return {
    goal: resolvePositionScoring(value?.goal, DEFAULT_PLAYER_RULE_SCORING.goal),
    missedPenalty: Number.isFinite(Number(value?.missedPenalty))
      ? Number(value.missedPenalty)
      : DEFAULT_PLAYER_RULE_SCORING.missedPenalty,
    mvp: Number.isFinite(Number(value?.mvp)) ? Number(value.mvp) : DEFAULT_PLAYER_RULE_SCORING.mvp,
    penaltySaved: Number.isFinite(Number(value?.penaltySaved))
      ? Number(value.penaltySaved)
      : DEFAULT_PLAYER_RULE_SCORING.penaltySaved,
    cleanSheet: resolvePositionScoring(value?.cleanSheet, DEFAULT_PLAYER_RULE_SCORING.cleanSheet),
    assist: resolvePositionScoring(value?.assist, DEFAULT_PLAYER_RULE_SCORING.assist),
    yellowCard: Number.isFinite(Number(value?.yellowCard))
      ? Number(value.yellowCard)
      : DEFAULT_PLAYER_RULE_SCORING.yellowCard,
    redCard: Number.isFinite(Number(value?.redCard)) ? Number(value.redCard) : DEFAULT_PLAYER_RULE_SCORING.redCard,
    award: {
      goldenBoot: Number.isFinite(Number(value?.award?.goldenBoot))
        ? Math.max(0, Number(value.award.goldenBoot))
        : DEFAULT_PLAYER_RULE_SCORING.award.goldenBoot,
      tournamentMvp: Number.isFinite(Number(value?.award?.tournamentMvp))
        ? Math.max(0, Number(value.award.tournamentMvp))
        : DEFAULT_PLAYER_RULE_SCORING.award.tournamentMvp,
    },
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

function numericPoints(value: unknown): number {
  const points = Number(value);
  return Number.isFinite(points) ? points : 0;
}

function PoolDetailContent() {
  const params = useParams();
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
  const [saveTimers, setSaveTimers] = useState<Record<string, NodeJS.Timeout>>({});
  const [ranking, setRanking] = useState<Array<{ rank: number; userName: string; userId?: string; groupPhasePoints: number; finalPhasePoints: number; playerPoints: number }>>([]);
  const [bracket, setBracket] = useState<Record<string, any[]>>({});
  const [bracketPredictions, setBracketPredictions] = useState<Record<string, any>>({});
  const [resettingBracketDefaults, setResettingBracketDefaults] = useState(false);
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
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [savingRulesPreference, setSavingRulesPreference] = useState(false);
  const [activeTab, setActiveTab] = useState<PoolTab>('ranking');

  useEffect(() => {
    if (!poolId) {
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
        setShowRulesModal(
          Boolean(poolResponse.data?.userMembership) &&
            poolResponse.data?.userMembership?.config?.rulesSummaryDismissed !== true,
        );
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
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || t('poolDetail.errors.loadPool');
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

  const poolDeadline = resolveDeadline(pool);
  const bracketProjection = useMemo(
    () =>
      buildBracketProjection({
        matchesByGroup,
        groupPredictions: predictions,
        teams,
        bracket,
        bracketPredictions,
      }),
    [matchesByGroup, predictions, teams, bracket, bracketPredictions],
  );
  const effectiveBracketPredictions = bracketProjection.effectivePredictions;

  const handleDismissRulesModal = async () => {
    try {
      setSavingRulesPreference(true);
      const response = await apiClient.put(`/pools/${poolId}/membership/config`, {
        rulesSummaryDismissed: true,
      });
      setPool((current: any) =>
        current
          ? {
              ...current,
              userMembership: {
                ...(current.userMembership || {}),
                ...(response.data || {}),
                config: {
                  ...(current.userMembership?.config || {}),
                  ...(response.data?.config || {}),
                  rulesSummaryDismissed: true,
                },
              },
            }
          : current,
      );
      setShowRulesModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('poolDetail.rules.savePreferenceError'));
    } finally {
      setSavingRulesPreference(false);
    }
  };

  const handleResetBracketDefaults = async () => {
    if (Date.now() >= poolDeadline) {
      toast.error(t('poolDetail.finalPhase.deadlinePassed'));
      return;
    }

    const resetPredictions = bracketProjection.resetPredictions;
    const matches = Object.values(bracket).flat();
    if (matches.length === 0) return;

    try {
      setResettingBracketDefaults(true);
      const savedEntries = await Promise.all(
        matches.map(async (match: any) => {
          const prediction = resetPredictions[match.bracketMatchId] || {
            bracketMatchId: match.bracketMatchId,
            homeTeamId: '',
            homeTeamName: '',
            awayTeamId: '',
            awayTeamName: '',
            predictedWinnerTeamId: '',
            predictedWinnerTeamName: '',
          };
          const response = await apiClient.post(
            `/pools/${poolId}/bracket/matches/${match.bracketMatchId}/predict`,
            {
              homeTeamId: prediction.homeTeamId || '',
              homeTeamName: prediction.homeTeamName || '',
              awayTeamId: prediction.awayTeamId || '',
              awayTeamName: prediction.awayTeamName || '',
              predictedWinnerTeamId: '',
              predictedWinnerTeamName: '',
            },
          );
          return [match.bracketMatchId, response.data] as const;
        }),
      );

      setBracketPredictions(Object.fromEntries(savedEntries));
      toast.success(t('poolDetail.finalPhase.defaultsReset'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('poolDetail.errors.savePrediction'));
    } finally {
      setResettingBracketDefaults(false);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('poolDetail.loading')} />
      </main>
    );
  }

  const memberCount = pool.memberCount ?? (pool.members ? pool.members.length : 0);
  const isPastPoolDeadline = Date.now() >= poolDeadline;
  const entryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;
  const groupScoringConfig = resolveGroupScoring(pool?.config?.scoring);
  const playerRuleScoring = resolvePlayerRuleScoring(pool?.config?.playerScoring);
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
      const prediction = effectiveBracketPredictions[match.bracketMatchId];
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
        <div style={{ minWidth: 0, flex: '1 1 22rem' }}>
          <h1
            style={{
              fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
            }}
          >
            <span>{t('poolDetail.title')}</span>
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
            <RankTable
              ranking={ranking}
              currentUserId={user?.userId}
              currentUserEmail={user?.email}
              prizeForRank={prizeForRank}
              formatCurrency={formatCurrency}
              onSpy={handleStartSpy}
            />
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
                          const formattedDate = new Date(match.scheduledAt).toLocaleString(locale, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          });
                          const matchDate = match.matchNumber
                            ? `P${match.matchNumber} · ${formattedDate}`
                            : formattedDate;

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
                              homeTeamName={match.homeTeamName}
                              awayTeamName={match.awayTeamName}
                              homeScore={prediction.homeScore}
                              awayScore={prediction.awayScore}
                              pointsEarned={prediction.points || 0}
                              state={state}
                              badgeLabel={badgeLabel}
                              disabled={isPastDeadline}
                              onChange={(side, value) => handleScoreChange(match.matchId, side, value)}
                              isPastDeadline={isPastDeadline}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetBracketDefaults}
                  disabled={isPastPoolDeadline || resettingBracketDefaults}
                  loading={resettingBracketDefaults}
                >
                  {resettingBracketDefaults
                    ? t('poolDetail.finalPhase.resettingDefaults')
                    : t('poolDetail.finalPhase.resetDefaults')}
                </Button>
              </div>
              <BracketVisualization
                bracket={bracket}
                teams={teams}
                poolId={poolId}
                mode="user"
                bracketPredictions={effectiveBracketPredictions}
                candidateOptions={bracketProjection.candidateOptions}
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
                    const prediction = effectiveBracketPredictions[bracketMatchId];
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

                    const response = await apiClient.post(
                      `/pools/${poolId}/bracket/matches/${bracketMatchId}/predict`,
                      updates,
                    );

                    setBracketPredictions((prev) => ({
                      ...prev,
                      [bracketMatchId]: response.data || { ...prediction, ...updates },
                    }));

                    toast.success(t('poolDetail.finalPhase.predictionSaved'));
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || t('poolDetail.errors.savePrediction'));
                  }
                }}
              />
            </div>
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
                      <p
                        style={{
                          margin: '0.1rem 0 0',
                          fontSize: '0.7rem',
                          color: 'rgb(var(--fg-muted))',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        {selected ? (
                          <> 
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.name}</span>                           
                            <ReactCountryFlag countryCode={countryIsoCode(selected.teamName)} svg style={{ width: '2em', height: '2em' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.teamName}</span>
                          </>
                        ) : (
                          t(award.descriptionKey)
                        )}
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
                            color: 'rgb(var(--pitch))',
                            background: 'rgb(var(--bg-elevated) / 0.95)',
                            border: '1px solid rgb(var(--pitch) / 0.50)',
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
                              background: 'rgb(var(--pitch))',
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
                                borderTop: '3px solid rgb(var(--pitch))',
                                background: 'rgb(var(--bg-elevated) / 0.62)',
                                backdropFilter: 'blur(6px) saturate(120%)',
                                WebkitBackdropFilter: 'blur(6px) saturate(120%)',
                                boxShadow: '0 4px 14px rgb(15 23 42 / 0.10)',
                                opacity: isSaving ? 0.7 : 1,
                                transition: 'opacity 0.15s ease, background 0.15s ease',
                              }}
                            >
                              {selected && isPastPoolDeadline ? (
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
                                  background: 'rgb(var(--pitch) / 0.18)',
                                  border: '1px solid rgb(var(--pitch) / 0.50)',
                                  color: 'rgb(var(--pitch))',
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
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                >
                                  {selected ? (
                                    <>
                                      <ReactCountryFlag countryCode={countryIsoCode(selected.teamName)} svg style={{ width: '2em', height: '2em' }} />
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selected.teamName}</span>
                                    </>
                                  ) : (
                                    t('poolDetail.players.slotLabel', { slot })
                                  )}
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
                                  color: 'rgb(var(--pitch))',
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
      <RulesSummaryModal
        open={showRulesModal}
        busy={savingRulesPreference}
        poolName={pool.name}
        deadlineLabel={deadlineHint}
        groupScoring={groupScoringConfig}
        bracketScoring={bracketScoringConfig}
        playerScoring={playerRuleScoring}
        entryFeeLabel={entryFee && entryFee > 0 ? formatCurrency(entryFee) : t('poolDetail.info.entryFeeFree')}
        prizeDistribution={prizeDistribution}
        onClose={() => setShowRulesModal(false)}
        onDismissForever={handleDismissRulesModal}
        t={t}
      />
    </>
  );
}

function pointsLabel(points: number): string {
  return points > 0 ? `+${points}` : String(points);
}

function RulesSummaryModal({
  open,
  busy,
  poolName,
  deadlineLabel,
  groupScoring,
  bracketScoring,
  playerScoring,
  entryFeeLabel,
  prizeDistribution,
  onClose,
  onDismissForever,
  t,
}: Readonly<{
  open: boolean;
  busy: boolean;
  poolName: string;
  deadlineLabel: string;
  groupScoring: { winnerPoints: number; exactResultPoints: number };
  bracketScoring: BracketScoringConfig;
  playerScoring: ReturnType<typeof resolvePlayerRuleScoring>;
  entryFeeLabel: string;
  prizeDistribution: PrizePayout[];
  onClose: () => void;
  onDismissForever: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}>) {
  const playerRows = [
    {
      label: t('poolDetail.rules.points.goals'),
      values: playerScoring.goal,
      icon: <FaFutbol style={ {color: 'black' } }/>
    },
    {
      label: t('poolDetail.rules.points.assists'),
      values: playerScoring.assist,
      icon: <FaMagic style={ {color: 'black' } }/>
    },
    {
      label: t('poolDetail.rules.points.cleanSheets'),
      values: playerScoring.cleanSheet,
      icon: <FaShieldAlt style={ {color: 'black' } }/>
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      size="lg"
      title={t('poolDetail.rules.title', { pool: poolName })}
      description={t('poolDetail.rules.description')}
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            {t('poolDetail.rules.showAgain')}
          </Button>
          <Button type="button" variant="primary" onClick={onDismissForever} loading={busy}>
            {t('poolDetail.rules.doNotShowAgain')}
          </Button>
        </>
      }
    >
      <div style={{ display: 'grid', gap: '1rem' }}>
        <section className="surface" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>{t('poolDetail.rules.howTo.title')}</h3>
          <div style={{ display: 'grid', gap: '0.55rem' }}>
            {['predict', 'final', 'players', 'deadline', 'ranking'].map((key) => (
              <div key={key} style={{ display: 'grid', gridTemplateColumns: '1.3rem minmax(0, 1fr)', gap: '0.55rem' }}>
                {(() => {
                  switch(key) {
                    case 'predict':
                      return <MdOnlinePrediction style={ {color: 'black' } }/>
                    case 'final':
                      return <BsFillDiagram3Fill style={ {color: 'black' } }/>
                    case 'players':
                      return <FaPerson style={ {color: 'black' } }/>
                    case 'deadline':
                      return <FaClock style={ {color: 'black' } }/>
                    case 'ranking':
                      return <FaMedal style={ {color: 'black' } }/>
                  }
                })()}
                <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  {t(`poolDetail.rules.howTo.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>{t('poolDetail.rules.points.title')}</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.groupPhase')}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                <Badge variant="info">
                  {t('poolDetail.rules.points.exactResult', { points: groupScoring.exactResultPoints })}
                </Badge>
                <Badge variant="pitch">
                  {t('poolDetail.rules.points.correctWinner', { points: groupScoring.winnerPoints })}
                </Badge>
              </div>
            </div>

            <div>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.finalPhase')}</p>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                {BRACKET_PHASES.map((phase) => {
                  const round = bracketScoring.rounds[phase.key] || bracketScoring;
                  return (
                    <div
                      key={phase.key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        padding: '0.45rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgb(var(--bg-subtle) / 0.68)',
                        fontSize: '0.82rem',
                        color: 'rgb(var(--fg-muted))',
                      }}
                    >
                      <strong style={{ color: 'rgb(var(--fg))' }}>{t(phase.labelKey)}</strong>
                      <span>
                        {t('poolDetail.rules.points.bracketRound', {
                          exact: round.exactPositionPoints,
                          wrong: round.correctTeamWrongPositionPoints,
                        })}
                      </span>
                    </div>
                  );
                })}
                <Badge variant="gold">
                  {t('poolDetail.rules.points.tournamentWinner', { points: bracketScoring.tournamentWinnerPoints })}
                </Badge>
              </div>
            </div>

            <div>
              <p className="eyebrow" style={{ marginBottom: '0.35rem' }}>{t('poolDetail.tabs.players')}</p>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                {playerRows.map((row) => (
                  <div
                    key={row.label}
                    style={{ display: 'grid', gridTemplateColumns: '1.3rem minmax(0, 1fr)', gap: '0.55rem' }}
                  >
                    {row.icon}
                    <strong>{row.label}</strong>
                    {PLAYER_POSITIONS.map((position) => (
                      <span key={position.key} className="display-number" style={{ color: 'rgb(var(--fg-muted))' }}>
                        {t(`poolDetail.players.positionShort.${position.key}`)} {pointsLabel(row.values[position.key])}
                      </span>
                    ))}
                  </div>
                ))}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <Badge variant="neutral">{t('poolDetail.rules.points.mvp', { points: playerScoring.mvp })}</Badge>
                  <Badge variant="neutral">{t('poolDetail.rules.points.penaltySaved', { points: playerScoring.penaltySaved })}</Badge>
                  <Badge variant="live">{t('poolDetail.rules.points.missedPenalty', { points: playerScoring.missedPenalty })}</Badge>
                  <Badge variant="live">{t('poolDetail.rules.points.yellowCard', { points: playerScoring.yellowCard })}</Badge>
                  <Badge variant="live">{t('poolDetail.rules.points.redCard', { points: playerScoring.redCard })}</Badge>
                  <Badge variant="gold">{t('poolDetail.rules.points.goldenBoot', { points: playerScoring.award.goldenBoot })}</Badge>
                  <Badge variant="gold">{t('poolDetail.rules.points.tournamentMvp', { points: playerScoring.award.tournamentMvp })}</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface" style={{ padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.65rem' }}>{t('poolDetail.rules.poolConfig.title')}</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
            <Badge variant="neutral">{t('poolDetail.rules.poolConfig.deadline', { deadline: deadlineLabel })}</Badge>
            <Badge variant="neutral">{t('poolDetail.rules.poolConfig.entryFee', { fee: entryFeeLabel })}</Badge>
            {prizeDistribution.length > 0 ? (
              <Badge variant="gold">
                {t('poolDetail.rules.poolConfig.prizes', { count: prizeDistribution.length })}
              </Badge>
            ) : null}
          </div>
        </section>
      </div>
    </Modal>
  );
}

/**
 * "You at a glance" hero block at the top of the ranking tab. Shows the four
 * numbers a member opens the app to check: their rank, their points, how many
 * picks they still owe, and (when there's an entry fee) what they'd take home
 * at their current standing. Each cell uses tabular figures so the column
 * stays optically aligned as values change.
 */
function PersonalCommandTile({
  rank,
  rankSuffix,
  points,
  pointsLabel,
  prizeLabel,
  rankCaption,
  pointsCaption,
  prizeCaption,
}: Readonly<{
  rank: number | undefined;
  rankSuffix?: string;
  points: number;
  pointsLabel: string;
  prizeLabel?: string;
  rankCaption: string;
  pointsCaption: string;
  prizeCaption: string;
}>) {
  const cells: Array<{
    caption: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    accent?: boolean;
  }> = [
    {
      caption: rankCaption,
      value: rank ? `#${rank}` : '—',
      sub: rankSuffix,
    },
    {
      caption: pointsCaption,
      value: points,
      sub: pointsLabel,
      accent: true,
    },
  ];
  if (prizeLabel) {
    cells.push({
      caption: prizeCaption,
      value: prizeLabel,
      sub: undefined,
    });
  }

  return (
    <section
      aria-label={pointsCaption}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
        gap: '0.65rem',
        padding: '1rem 1.1rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgb(var(--border))',
        background:
          'linear-gradient(135deg, rgb(var(--accent-from) / 0.06), rgb(var(--accent-to) / 0.04))',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {cells.map((cell, index) => (
        <div
          key={cell.caption}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            paddingLeft: index === 0 ? 0 : '0.85rem',
            borderLeft: index === 0 ? 'none' : '1px solid rgb(var(--border-subtle))',
            minWidth: 0,
          }}
        >
          <span
            className="eyebrow"
            style={{ fontSize: '0.6rem', color: 'rgb(var(--fg-subtle))' }}
          >
            {cell.caption}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 'clamp(1.4rem, 3vw, 1.85rem)',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.05,
              color: cell.accent ? 'rgb(var(--accent-from))' : 'rgb(var(--fg))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {cell.value}
          </span>
          {cell.sub ? (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: 'rgb(var(--fg-muted))',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {cell.sub}
            </span>
          ) : null}
        </div>
      ))}
    </section>
  );
}

function PlayerActionSummary({
  player,
  labels,
}: Readonly<{
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
}>) {
  const PLAYER_STAT_ACTIONS: Array<{ key: string; value: number; label: string; icon: React.ReactNode }> = [
    { key: 'goals', value: player.goals || 0, label: labels.goals, icon: <FaFutbol style={ {color: 'black' } } size='17'/> },
    { key: 'assists', value: player.assists || 0, label: labels.assists, icon: <FaMagic style={ {color: 'black' } } size='17'/> },
    { key: 'mvps', value: player.mvps || 0, label: labels.mvps, icon: <FaStar style={ {color: 'gold' } } size='17'/> },
    { key: 'penaltiesSaved', value: player.penaltiesSaved || 0, label: labels.penaltiesSaved, icon: <PiBoxingGlove style={ {color: 'green' } } size='17'/> },
    { key: 'cleanSheets', value: player.cleanSheets || 0, label: labels.cleanSheets, icon: <FaShieldAlt style={ {color: 'black' } } size='17'/> },
    { key: 'yellowCards', value: player.yellowCards || 0, label: labels.yellowCards, icon: <LuRectangleVertical style={ {color: 'yellow', fill: 'yellow' } } size='17'/> },
    { key: 'redCards', value: player.redCards || 0, label: labels.redCards, icon: <LuRectangleVertical style={ {color: 'red', fill: 'red' } } size='17'/> },
    { key: 'missedPenalties', value: player.missedPenalties || 0, label: labels.missedPenalties, icon: <IoMdCloseCircle style={ {color: 'red' } } size='17'/> },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.22rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
      {PLAYER_STAT_ACTIONS.map((item) => {
        const isZero = item.value === 0;
        return (
          <span
            key={item.key}
            title={`${item.label}: ${item.value}`}
            aria-label={`${item.label}: ${item.value}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.18rem',
              padding: '0.1rem 0.32rem',
              borderRadius: '999px',
              background: isZero ? 'transparent' : 'rgb(var(--bg-subtle) / 0.92)',
              border: isZero
                ? '1px dashed rgb(var(--border-subtle))'
                : '1px solid rgb(var(--border-subtle))',
              color: isZero ? 'rgb(var(--fg-subtle))' : 'rgb(var(--fg))',
              opacity: isZero ? 0.5 : 1,
              fontSize: '0.6rem',
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            {item.icon}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
          </span>
        );
      })}
    </div>
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
}: Readonly<PlayerPickerModalProps>) {
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
                  <ReactCountryFlag countryCode={countryIsoCode(group.teamName)} svg style={{ width: '2em', height: '2em' }} />
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
}: Readonly<SpyPicksModalProps>) {
  const [tab, setTab] = useState<'groups' | 'final' | 'players'>('groups');

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
}: Readonly<{
  data: SpyPicksData;
  groups: string[];
  matchesByGroup: Record<string, Match[]>;
  predictionByMatch: Map<string, SpyPicksData['predictions'][number]>;
  labels: SpyPicksLabels;
  locale: string;
}>) {
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
                      {hasPick ? `${pick.homeScore} – ${pick.awayScore}` : labels.noPick}
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
}: Readonly<{
  bracketStructure: Record<string, any[]>;
  bracketPickByMatch: Map<string, SpyBracketPrediction>;
  labels: SpyPicksLabels;
}>) {
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
}: Readonly<{
  tournamentPlayers: TournamentPlayer[];
  playerByPositionSlot: Map<string, PlayerSelection>;
  playerByAward: Map<PlayerAward, PlayerAwardSelection>;
  labels: SpyPicksLabels;
}>) {
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
}: Readonly<{
  label: string;
  selection?: PlayerSelection | PlayerAwardSelection;
  fallbackIcon: string | number;
}>) {
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
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.65rem',
              color: 'rgb(var(--fg-muted))',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <ReactCountryFlag countryCode={countryIsoCode(selection.teamName)} svg style={{ width: '2em', height: '2em' }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{selection.teamName}</span>
          </span>
        ) : null}
      </span>
    </li>
  );
}

function SpyEmpty({ text }: Readonly<{ text: string }>) {
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
