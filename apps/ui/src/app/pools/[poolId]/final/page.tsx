'use client';

import toast from 'react-hot-toast';
import { useMemo } from 'react';
import { useI18n } from '@/i18n/client';
import { usePoolContext } from '@/contexts/PoolContext';
import { BracketVisualization } from '@/components/BracketVisualization';
import { apiClient } from '@/lib/api';
import { FinalScoringInfoSection } from '@/components/pool/PoolInfoSections';

export default function FinalPage() {
  const { t } = useI18n();
  const {
    bracket, teams, poolId, poolDeadline, isPastPoolDeadline,
    bracketPredictions, effectiveBracketPredictions, bracketProjection, bracketScoringConfig,
    setBracketPredictions,
  } = usePoolContext();

  // effectiveBracketPredictions has projected team slots but lacks scoring flags
  // (homeTeamExactPosition, etc.) which only exist in raw bracketPredictions from the API.
  const mergedBracketPredictions = useMemo(() => {
    const result: Record<string, any> = { ...effectiveBracketPredictions };
    for (const [id, raw] of Object.entries(bracketPredictions)) {
      result[id] = {
        ...result[id],
        homeTeamExactPosition: raw.homeTeamExactPosition,
        awayTeamExactPosition: raw.awayTeamExactPosition,
        homeTeamCorrectButWrongPosition: raw.homeTeamCorrectButWrongPosition,
        awayTeamCorrectButWrongPosition: raw.awayTeamCorrectButWrongPosition,
        tournamentWinnerCorrect: raw.tournamentWinnerCorrect,
        points: raw.points,
      };
    }
    return result;
  }, [effectiveBracketPredictions, bracketPredictions]);

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <FinalScoringInfoSection bracketScoring={bracketScoringConfig} />

      {Object.keys(bracket).length > 0 ? (
        <section className="surface" style={{ padding: '1rem' }}>
          <BracketVisualization
            bracket={bracket}
            teams={teams}
            poolId={poolId}
            mode="user"
            bracketPredictions={mergedBracketPredictions}
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
                await apiClient.post(`/pools/${poolId}/bracket/matches/${bracketMatchId}/predict`, updates);
                // Reload all predictions so scoring flags (evaluated after save) are fresh.
                const predsResponse = await apiClient.get(`/pools/${poolId}/bracket/predictions`);
                const newMap: Record<string, any> = {};
                (predsResponse.data || []).forEach((pred: any) => { newMap[pred.bracketMatchId] = pred; });
                setBracketPredictions(newMap);
                toast.success(t('poolDetail.finalPhase.predictionSaved'));
              } catch (err: any) {
                toast.error(err.response?.data?.message || t('poolDetail.errors.savePrediction'));
              }
            }}
          />
        </section>
      ) : (
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
          {t('poolDetail.finalPhase.bracketUnavailable')}
        </p>
      )}
    </div>
  );
}
