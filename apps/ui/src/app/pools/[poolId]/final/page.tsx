'use client';

import toast from 'react-hot-toast';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { FaMagic } from 'react-icons/fa';
import { useI18n } from '@/i18n/client';
import { usePoolContext } from '@/contexts/PoolContext';
import type { MatchInsightsTarget } from '@/components/pool/MatchInsightsModal';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Section } from '@/components/ui/Section';
import { apiClient } from '@/lib/api';
import { buildBracketProjection } from '@/lib/bracket-projection';
import { countryDisplayName, countryIsoCode } from '@/lib/country-flags';
import {
  FinalScoringInfoSection,
  resolvePlayerInfoScoring,
} from '@/components/pool/PoolInfoSections';
import ReactCountryFlag from 'react-country-flag';
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
  const { t, locale } = useI18n();
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
  const [matchdayNow, setMatchdayNow] = useState(() => Date.now());
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
  const nextMatchdayMatches = useMemo(
    () => findNextFinalMatchdayMatches(bracket, pool?.config?.matchdaySeparatorTime, matchdayNow),
    [bracket, matchdayNow, pool?.config?.matchdaySeparatorTime],
  );

  useEffect(() => {
    const timer = globalThis.setInterval(() => setMatchdayNow(Date.now()), 60_000);
    return () => globalThis.clearInterval(timer);
  }, []);

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

  const renderUpcomingFinalMatchCard = (match: BracketMatch) => {
    const formattedDate = match.scheduledAt
      ? new Date(match.scheduledAt).toLocaleString(locale, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '';
    const matchDate = match.matchNumber ? `P${match.matchNumber} · ${formattedDate}` : formattedDate;
    const homeName = match.homeTeamName || match.homeSourceLabel || '';
    const awayName = match.awayTeamName || match.awaySourceLabel || '';
    const canOpenInsights = isPastPoolDeadline;

    return (
      <article
        key={match.bracketMatchId}
        role={canOpenInsights ? 'button' : undefined}
        tabIndex={canOpenInsights ? 0 : undefined}
        onClick={
          canOpenInsights
            ? () => setInsightsTarget({
                matchId: match.bracketMatchId,
                matchType: 'final',
              })
            : undefined
        }
        onKeyDown={(event) => {
          if (canOpenInsights && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setInsightsTarget({
              matchId: match.bracketMatchId,
              matchType: 'final',
            });
          }
        }}
        style={{
          background: 'rgb(var(--match-neutral-bg))',
          border: '1px solid rgb(var(--control-border))',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          cursor: canOpenInsights ? 'pointer' : undefined,
          display: 'grid',
          gap: '0.4rem',
          padding: '0.65rem 0.75rem',
        }}
      >
        <span
          style={{
            color: 'rgb(var(--fg-muted))',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {matchDate}
        </span>
        <UpcomingFinalTeamsLine homeTeamName={homeName} awayTeamName={awayName} t={t} />
      </article>
    );
  };

  return (
    <div className="content-panel main-view-stack">
      {Object.keys(bracket).length > 0 ? (
        <>
          {nextMatchdayMatches.length > 0 ? (
            <Section
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span aria-hidden style={{ width: 3, height: '1rem', borderRadius: '999px', background: 'rgb(var(--fg))' }} />
                  {t('poolDetail.finalPhase.nextMatchdayTitle')}
                </span>
              }
              density="compact"
              tone="plain"
              className="main-section-plain"
              contentStyle={{ marginTop: '0.35rem', paddingTop: '0.45rem' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {nextMatchdayMatches.map(renderUpcomingFinalMatchCard)}
              </div>
            </Section>
          ) : null}
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
              tournamentWinnerPoints={bracketScoringConfig.tournamentWinnerPoints}
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
        </>
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

type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

const DEFAULT_MATCHDAY_SEPARATOR_TIME = '14:00';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const BRACKET_PHASES = [
  '16th-finals',
  '8th-finals',
  'quarter-finals',
  'semi-finals',
  'finals',
] as const;

function findNextFinalMatchdayMatches(
  bracket: Record<string, BracketMatch[]>,
  separatorTime: unknown,
  nowMs: number,
): BracketMatch[] {
  const separator = parseMatchdaySeparatorTime(separatorTime);
  const now = new Date(nowMs);
  const windowStart = currentMatchdaySeparator(now, separator);
  const candidates = Object.entries(bracket)
    .flatMap(([phaseKey, matches]) => matches.map((match, index) => ({ match, phaseKey, index })))
    .filter(({ match, phaseKey, index }) => {
      if (!match.scheduledAt || isFinishedFinalMatch(bracket, phaseKey, index, match)) return false;
      const scheduledAt = new Date(match.scheduledAt).getTime();
      return Number.isFinite(scheduledAt) && scheduledAt >= windowStart.getTime();
    })
    .sort((a, b) => {
      const dateDiff =
        new Date(a.match.scheduledAt || '').getTime() -
        new Date(b.match.scheduledAt || '').getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.match.matchNumber ?? 0) - (b.match.matchNumber ?? 0);
    })
    .map(({ match }) => match);

  if (candidates.length === 0) return [];

  let windowStartMs = windowStart.getTime();
  let windowEndMs = windowStartMs + ONE_DAY_MS;
  const lastMatchMs = new Date(candidates[candidates.length - 1].scheduledAt || '').getTime();

  while (windowStartMs <= lastMatchMs) {
    const matchesInWindow = candidates.filter((match) => {
      const scheduledAt = new Date(match.scheduledAt || '').getTime();
      return scheduledAt >= windowStartMs && scheduledAt < windowEndMs;
    });
    if (matchesInWindow.length > 0) return matchesInWindow;
    windowStartMs = windowEndMs;
    windowEndMs += ONE_DAY_MS;
  }

  return [];
}

function parseMatchdaySeparatorTime(value: unknown): { hours: number; minutes: number } {
  if (typeof value !== 'string') return { hours: 14, minutes: 0 };
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim() || DEFAULT_MATCHDAY_SEPARATOR_TIME);
  if (!match) return { hours: 14, minutes: 0 };
  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return { hours: 14, minutes: 0 };
  }
  return { hours, minutes };
}

function currentMatchdaySeparator(
  from: Date,
  separator: { hours: number; minutes: number },
): Date {
  const current = new Date(from);
  current.setHours(separator.hours, separator.minutes, 0, 0);
  if (current.getTime() > from.getTime()) {
    current.setDate(current.getDate() - 1);
  }
  return current;
}

function isCompletedBracketMatch(match: BracketMatch): boolean {
  const hasDecidedResult =
    typeof match.homeResult === 'number' &&
    typeof match.awayResult === 'number' &&
    match.homeResult !== match.awayResult;

  return match.status === 'completed' || hasDecidedResult;
}

function isFinishedFinalMatch(
  bracket: Record<string, BracketMatch[]>,
  phaseKey: string,
  matchIndex: number,
  match: BracketMatch,
): boolean {
  const advancedTeamId = getAdvancedTeamId(bracket, phaseKey, matchIndex);
  const hasAdvancedTeam =
    Boolean(advancedTeamId) &&
    (advancedTeamId === match.homeTeamId || advancedTeamId === match.awayTeamId);

  return isCompletedBracketMatch(match) || hasAdvancedTeam;
}

function getAdvancedTeamId(
  bracket: Record<string, BracketMatch[]>,
  phaseKey: string,
  matchIndex: number,
): string {
  const phaseIndex = BRACKET_PHASES.findIndex((phase) => phase === phaseKey);
  const nextPhase = phaseIndex >= 0 ? BRACKET_PHASES[phaseIndex + 1] : undefined;
  if (!nextPhase) return '';

  const nextMatch = bracket[nextPhase]?.[Math.floor(matchIndex / 2)];
  if (!nextMatch) return '';

  return matchIndex % 2 === 0 ? nextMatch.homeTeamId || '' : nextMatch.awayTeamId || '';
}

function UpcomingFinalTeamsLine({
  homeTeamName,
  awayTeamName,
  t,
}: Readonly<{
  homeTeamName: string;
  awayTeamName: string;
  t: TranslationFn;
}>) {
  const homeDisplayName = countryDisplayName(homeTeamName, t);
  const awayDisplayName = countryDisplayName(awayTeamName, t);

  return (
    <div
      style={{
        alignItems: 'center',
        display: 'flex',
        gap: '0.4rem',
        minWidth: 0,
      }}
    >
      {homeTeamName ? (
        <ReactCountryFlag
          countryCode={countryIsoCode(homeTeamName)}
          svg
          style={{ flexShrink: 0, height: '1.35em', width: '1.35em' }}
        />
      ) : null}
      <span
        style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {homeDisplayName}
      </span>
      <span
        aria-hidden
        style={{ color: 'rgb(var(--fg-muted))', flexShrink: 0, fontWeight: 700 }}
      >
        -
      </span>
      {awayTeamName ? (
        <ReactCountryFlag
          countryCode={countryIsoCode(awayTeamName)}
          svg
          style={{ flexShrink: 0, height: '1.35em', width: '1.35em' }}
        />
      ) : null}
      <span
        style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {awayDisplayName}
      </span>
    </div>
  );
}
