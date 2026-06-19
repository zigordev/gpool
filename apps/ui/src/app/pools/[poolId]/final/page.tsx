'use client';

import toast from 'react-hot-toast';
import { useLayoutEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { FaMagic } from 'react-icons/fa';
import { useI18n } from '@/i18n/client';
import { usePoolContext } from '@/contexts/PoolContext';
import type { MatchInsightsTarget } from '@/components/pool/MatchInsightsModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api';
import { buildBracketProjection } from '@/lib/bracket-projection';
import {
  FinalScoringInfoSection,
  resolvePlayerInfoScoring,
} from '@/components/pool/PoolInfoSections';
import { useNavCenter } from '@/contexts/NavCenterContext';

const BracketVisualization = dynamic(
  () => import('@/components/BracketVisualization').then((mod) => mod.BracketVisualization),
  { ssr: false },
);
const MatchInsightsModal = dynamic(
  () => import('@/components/pool/MatchInsightsModal').then((mod) => mod.MatchInsightsModal),
  { ssr: false },
);
const WinnerInsightsModal = dynamic(
  () => import('@/components/pool/WinnerInsightsModal').then((mod) => mod.WinnerInsightsModal),
  { ssr: false },
);

export default function FinalPage() {
  const { t } = useI18n();
  const { setPoolActions } = useNavCenter();
  const {
    bracket, teams, pool, poolId, poolDeadline, isPastPoolDeadline, matchesByGroup, predictions,
    bracketPredictions, effectiveBracketPredictions, bracketProjection, bracketScoringConfig,
    setBracketPredictions,
  } = usePoolContext();
  const [showAutoFillConfirm, setShowAutoFillConfirm] = useState(false);
  const [autoFillingRoundOf32, setAutoFillingRoundOf32] = useState(false);
  const [insightsTarget, setInsightsTarget] = useState<MatchInsightsTarget | null>(null);
  const [showWinnerInsights, setShowWinnerInsights] = useState(false);
  const playerScoringConfig = resolvePlayerInfoScoring(pool?.config?.playerScoring);

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

  useLayoutEffect(() => {
    setPoolActions(
      <>
        <FinalScoringInfoSection bracketScoring={bracketScoringConfig} />
        {Object.keys(bracket).length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            className="pool-detail-action-trigger pool-detail-modal-trigger"
            disabled={isPastPoolDeadline}
            loading={autoFillingRoundOf32}
            leadingIcon={<FaMagic size={13} />}
            onClick={() => setShowAutoFillConfirm(true)}
            style={{ maxWidth: '100%', whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.2 }}
          >
            {t('poolDetail.finalPhase.autoFillRoundOf32')}
          </Button>
        ) : null}
      </>,
    );
    return () => setPoolActions(null);
  }, [
    autoFillingRoundOf32,
    bracket,
    bracketScoringConfig,
    isPastPoolDeadline,
    setPoolActions,
    t,
  ]);

  const handleAutoFillRoundOf32 = async () => {
    if (Date.now() >= poolDeadline) {
      toast.error(t('poolDetail.finalPhase.deadlinePassed'));
      return;
    }

    try {
      setAutoFillingRoundOf32(true);
      const autoProjection = buildBracketProjection({
        matchesByGroup,
        groupPredictions: predictions,
        teams,
        bracket,
        bracketPredictions: {},
        prefillRoundOf32: true,
      });
      const allBracketMatches = Object.values(bracket).flat();

      await Promise.all(
        allBracketMatches.map((match: any) => {
          const generated =
            match.phase === '16th-finals'
              ? autoProjection.effectivePredictions[match.bracketMatchId]
              : null;

          return apiClient.post(`/pools/${poolId}/bracket/matches/${match.bracketMatchId}/predict`, {
            homeTeamId: generated?.homeTeamId || '',
            homeTeamName: generated?.homeTeamName || '',
            awayTeamId: generated?.awayTeamId || '',
            awayTeamName: generated?.awayTeamName || '',
            predictedWinnerTeamId: '',
            predictedWinnerTeamName: '',
          });
        }),
      );

      const predsResponse = await apiClient.get(`/pools/${poolId}/bracket/predictions`);
      const newMap: Record<string, any> = {};
      (predsResponse.data || []).forEach((pred: any) => {
        newMap[pred.bracketMatchId] = pred;
      });
      setBracketPredictions(newMap);
      setShowAutoFillConfirm(false);
      toast.success(t('poolDetail.finalPhase.autoFillSuccess'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('poolDetail.finalPhase.autoFillError'));
    } finally {
      setAutoFillingRoundOf32(false);
    }
  };

  return (
    <div className="content-panel main-view-stack">
      {Object.keys(bracket).length > 0 ? (
        <section className="bracket-workspace main-view-surface">
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
            onMatchClick={
              isPastPoolDeadline
                ? (match) => setInsightsTarget({
                    matchId: match.bracketMatchId,
                    matchType: 'final',
                  })
                : undefined
            }
            onWinnerClick={
              isPastPoolDeadline ? () => setShowWinnerInsights(true) : undefined
            }
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

      <Modal
        open={showAutoFillConfirm}
        onClose={() => setShowAutoFillConfirm(false)}
        title={t('poolDetail.finalPhase.autoFillConfirmTitle')}
        busy={autoFillingRoundOf32}
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={autoFillingRoundOf32}
              onClick={() => setShowAutoFillConfirm(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={autoFillingRoundOf32}
              onClick={handleAutoFillRoundOf32}
            >
              {t('poolDetail.finalPhase.autoFillConfirmAccept')}
            </Button>
          </>
        }
      >
        <p style={{ margin: 0, color: 'rgb(var(--fg-muted))', fontSize: '0.92rem', lineHeight: 1.55 }}>
          {t('poolDetail.finalPhase.autoFillConfirmDescription')}
        </p>
      </Modal>

      <MatchInsightsModal
        poolId={poolId}
        target={insightsTarget}
        onClose={() => setInsightsTarget(null)}
        playerScoring={playerScoringConfig}
      />
      <WinnerInsightsModal
        poolId={poolId}
        open={showWinnerInsights}
        onClose={() => setShowWinnerInsights(false)}
      />
    </div>
  );
}
