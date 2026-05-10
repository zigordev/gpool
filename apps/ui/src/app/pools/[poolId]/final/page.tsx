'use client';

import toast from 'react-hot-toast';
import { useI18n } from '@/i18n/client';
import { usePoolContext } from '@/contexts/PoolContext';
import { BracketVisualization } from '@/components/BracketVisualization';
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api';

export default function FinalPage() {
  const { t } = useI18n();
  const {
    bracket, teams, poolId, poolDeadline, isPastPoolDeadline,
    effectiveBracketPredictions, bracketProjection, bracketScoringConfig,
    resettingBracketDefaults, handleResetBracketDefaults, setBracketPredictions,
  } = usePoolContext();

  return (
    <div className="content-panel">
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
            onPredictionChange={async (bracketMatchId, side, teamId, teamName) => {
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
                  updates.homeTeamId = teamId; updates.homeTeamName = teamName;
                  updates.awayTeamId = prediction?.awayTeamId || ''; updates.awayTeamName = prediction?.awayTeamName || '';
                  if (updates.predictedWinnerTeamId && updates.predictedWinnerTeamId !== teamId && updates.predictedWinnerTeamId !== updates.awayTeamId) {
                    updates.predictedWinnerTeamId = ''; updates.predictedWinnerTeamName = '';
                  }
                } else if (side === 'away') {
                  updates.homeTeamId = prediction?.homeTeamId || ''; updates.homeTeamName = prediction?.homeTeamName || '';
                  updates.awayTeamId = teamId; updates.awayTeamName = teamName;
                  if (updates.predictedWinnerTeamId && updates.predictedWinnerTeamId !== updates.homeTeamId && updates.predictedWinnerTeamId !== teamId) {
                    updates.predictedWinnerTeamId = ''; updates.predictedWinnerTeamName = '';
                  }
                } else {
                  updates.homeTeamId = prediction?.homeTeamId || ''; updates.homeTeamName = prediction?.homeTeamName || '';
                  updates.awayTeamId = prediction?.awayTeamId || ''; updates.awayTeamName = prediction?.awayTeamName || '';
                  updates.predictedWinnerTeamId = teamId; updates.predictedWinnerTeamName = teamName;
                }
                const response = await apiClient.post(`/pools/${poolId}/bracket/matches/${bracketMatchId}/predict`, updates);
                setBracketPredictions((prev) => ({ ...prev, [bracketMatchId]: response.data || { ...prediction, ...updates } }));
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
  );
}
