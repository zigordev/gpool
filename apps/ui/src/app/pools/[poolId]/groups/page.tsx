'use client';

import { useI18n } from '@/i18n/client';
import { usePoolContext } from '@/contexts/PoolContext';
import { Section } from '@/components/ui/Section';
import { MatchPredictionCard } from '@/components/pool/MatchPredictionCard';
import { MatchPredictionState } from '@/types/matchPredictionState.type';

export default function GroupsPage() {
  const { t, locale } = useI18n();
  const { groups, matchesByGroup, predictions, poolDeadline, handleScoreChange } = usePoolContext();

  return (
    <div className="content-panel">
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
                      const prediction = predictions[match.matchId] || ({ homeScore: '', awayScore: '' } as Prediction);
                      const isPastDeadline = Date.now() >= poolDeadline;
                      const formattedDate = new Date(match.scheduledAt).toLocaleString(locale, {
                        month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                      });
                      const matchDate = match.matchNumber ? `P${match.matchNumber} · ${formattedDate}` : formattedDate;

                      const hasResults = typeof match.homeResult === 'number' && typeof match.awayResult === 'number';
                      const isExactMatch = isPastDeadline && hasResults && prediction.isExactMatch === true;
                      const isCorrectWinner = isPastDeadline && hasResults && prediction.isCorrect === true && !isExactMatch;
                      const hasUserPrediction = prediction.homeScore !== '' && prediction.awayScore !== '';
                      const isIncorrect = isPastDeadline && hasResults && hasUserPrediction && prediction.isCorrect === false;
                      const isIncomplete =
                        !isPastDeadline &&
                        (prediction.homeScore === '' || prediction.awayScore === '' ||
                          (prediction.homeScore === 0 && prediction.awayScore === 0));

                      let state: MatchPredictionState;
                      let badgeLabel: string | undefined;
                      if (isExactMatch) { state = 'exact'; badgeLabel = t('poolDetail.match.exactBadge'); }
                      else if (isCorrectWinner) { state = 'correct-winner'; badgeLabel = t('poolDetail.match.correctWinnerBadge'); }
                      else if (isIncorrect) { state = 'incorrect'; badgeLabel = t('poolDetail.match.incorrectBadge'); }
                      else if (hasResults && !hasUserPrediction && isPastDeadline) { state = 'pending'; badgeLabel = t('poolDetail.match.pendingBadge'); }
                      else if (!hasResults && isPastDeadline) { state = 'locked'; badgeLabel = t('poolDetail.deadline.passedShort'); }
                      else if (isIncomplete) { state = 'incomplete'; badgeLabel = t('poolDetail.match.incomplete'); }
                      else { state = 'open'; }

                      return (
                        <MatchPredictionCard
                          key={match.matchId}
                          matchDate={matchDate}
                          homeTeamName={match.homeTeamName}
                          awayTeamName={match.awayTeamName}
                          homeScore={prediction.homeScore}
                          awayScore={prediction.awayScore}
                          homeResult={typeof match.homeResult === 'number' ? match.homeResult : undefined}
                          awayResult={typeof match.awayResult === 'number' ? match.awayResult : undefined}
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
  );
}
