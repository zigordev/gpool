'use client';

import { useI18n } from '@/i18n/client';
import { MatchPredictionCard } from '@/components/pool/MatchPredictionCard';
import { MatchPredictionState } from '@/types/matchPredictionState.type';

type GroupMatch = {
  matchId: string;
  matchNumber?: number;
  homeTeamName: string;
  awayTeamName: string;
  scheduledAt: string;
  homeResult?: number | null;
  awayResult?: number | null;
};

type GroupPrediction = {
  homeScore?: number | '';
  awayScore?: number | '';
  isExactMatch?: boolean | null;
  isCorrect?: boolean | null;
  points?: number;
} | null;

export function ReadOnlyGroupMatchCard({
  match,
  prediction,
  locale,
  compact = false,
}: Readonly<{
  match: GroupMatch;
  prediction: GroupPrediction;
  locale: string;
  compact?: boolean;
}>) {
  const { t } = useI18n();
  const homeScore = typeof prediction?.homeScore === 'number' ? prediction.homeScore : '';
  const awayScore = typeof prediction?.awayScore === 'number' ? prediction.awayScore : '';
  const hasPrediction = homeScore !== '' && awayScore !== '';
  const hasResult =
    typeof match.homeResult === 'number' &&
    typeof match.awayResult === 'number';

  let state: MatchPredictionState = 'locked';
  let badgeLabel = t('poolDetail.deadline.passedShort');
  if (prediction?.isExactMatch === true) {
    state = 'exact';
    badgeLabel = t('poolDetail.match.exactBadge');
  } else if (prediction?.isCorrect === true) {
    state = 'correct-winner';
    badgeLabel = t('poolDetail.match.correctWinnerBadge');
  } else if (hasResult && hasPrediction && prediction?.isCorrect === false) {
    state = 'incorrect';
    badgeLabel = t('poolDetail.match.incorrectBadge');
  } else if (hasResult && !hasPrediction) {
    state = 'pending';
    badgeLabel = t('poolDetail.match.pendingBadge');
  }

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

  return (
    <MatchPredictionCard
      matchDate={matchDate}
      homeTeamName={match.homeTeamName}
      awayTeamName={match.awayTeamName}
      homeScore={homeScore}
      awayScore={awayScore}
      homeResult={typeof match.homeResult === 'number' ? match.homeResult : undefined}
      awayResult={typeof match.awayResult === 'number' ? match.awayResult : undefined}
      pointsEarned={prediction?.points || 0}
      state={state}
      badgeLabel={badgeLabel}
      disabled
      isPastDeadline
      showTeams={!compact}
      showMatchDate={!compact}
      showRealResult={!compact}
    />
  );
}
