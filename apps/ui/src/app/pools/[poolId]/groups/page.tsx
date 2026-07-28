'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '@/i18n/client';
import { usePoolContext, resolveGroupScoring } from '@/contexts/PoolContext';
import { Section } from '@/components/ui/Section';
import { MatchPredictionCard } from '@/components/pool/MatchPredictionCard';
import type { MatchInsightsTarget } from '@/components/pool/MatchInsightsModal';
import { MatchPredictionState } from '@/types/matchPredictionState.type';
import {
  GroupScoringInfoSection,
  resolvePlayerInfoScoring,
} from '@/components/pool/PoolInfoSections';
import { PoolDetailModalButton } from '@/components/pool/PoolDetailModalButton';
import { compareRows, computeGroupStandings, computeRealGroupStandings } from '@/lib/bracket-projection';
import { countryDisplayName, countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { FaRankingStar } from 'react-icons/fa6';
import { IoWarning } from 'react-icons/io5';
import { PoolSectionHeader } from '@/components/pool/PoolSectionHeader';

const MatchInsightsModal = dynamic(
  () => import('@/components/pool/MatchInsightsModal').then((mod) => mod.MatchInsightsModal),
  { ssr: false },
);

export default function GroupsPage() {
  const { t, locale } = useI18n();
  const {
    groups,
    matchesByGroup,
    predictions,
    poolDeadline,
    pool,
    poolId,
    teams,
    handleScoreChange,
  } = usePoolContext();
  const [insightsTarget, setInsightsTarget] = useState<MatchInsightsTarget | null>(null);
  const [matchdayNow, setMatchdayNow] = useState(() => Date.now());
  const groupScoringConfig = useMemo(
    () => resolveGroupScoring(pool?.config?.scoring),
    [pool?.config?.scoring],
  );

  const playerScoringConfig = useMemo(
    () => resolvePlayerInfoScoring(pool?.config?.playerScoring),
    [pool?.config?.playerScoring],
  );
  const groupStandings = useMemo(
    () => computeGroupStandings(matchesByGroup, predictions, teams),
    [matchesByGroup, predictions, teams],
  );
  const realGroupStandings = useMemo(
    () => computeRealGroupStandings(matchesByGroup, teams),
    [matchesByGroup, teams],
  );
  const bestThirdsRanking = useMemo(
    () => Object.values(groupStandings)
      .map((standings) => standings[2])
      .filter(Boolean)
      .sort(compareRows),
    [groupStandings],
  );
  const realBestThirdsRanking = useMemo(
    () => Object.values(realGroupStandings)
      .map((standings) => standings[2])
      .filter(Boolean)
      .sort(compareRows),
    [realGroupStandings],
  );
  const nextMatchdayMatches = useMemo(
    () => findNextMatchdayMatches(matchesByGroup, pool?.config?.matchdaySeparatorTime, matchdayNow),
    [matchesByGroup, matchdayNow, pool?.config?.matchdaySeparatorTime],
  );

  useEffect(() => {
    const timer = globalThis.setInterval(() => setMatchdayNow(Date.now()), 60_000);
    return () => globalThis.clearInterval(timer);
  }, []);

  const sectionActions = (
    <>
      <GroupScoringInfoSection groupScoring={groupScoringConfig} />
      {bestThirdsRanking.length > 0 || realBestThirdsRanking.length > 0 ? (
        <PoolDetailModalButton
          title={t('poolDetail.groupPhase.bestThirdsTitle')}
          icon={<FaRankingStar size={14} />}
          label={t('poolDetail.groupPhase.bestThirdsTitle')}
        >
          <BestThirdsStandingsContent
            standings={bestThirdsRanking}
            realStandings={realBestThirdsRanking}
            t={t}
          />
        </PoolDetailModalButton>
      ) : null}
    </>
  );

  const renderMatchCard = (match: Match) => {
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
      (prediction.homeScore === '' || prediction.awayScore === '');

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
        onOpenInsights={
          isPastDeadline
            ? () => setInsightsTarget({
                matchId: match.matchId,
                matchType: 'group',
              })
            : undefined
        }
      />
    );
  };

  return (
    <div className="content-panel main-view-stack">
      <PoolSectionHeader actions={sectionActions} />
      {groups.length > 0 ? (
        <div className="main-section-list">
          {nextMatchdayMatches.length > 0 ? (
            <Section
              title={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span aria-hidden style={{ width: 3, height: '1rem', borderRadius: '999px', background: 'rgb(var(--fg))' }} />
                  {t('poolDetail.groupPhase.nextMatchdayTitle')}
                </span>
              }
              density="compact"
              tone="plain"
              className="main-section-plain"
              contentStyle={{ marginTop: '0.35rem', paddingTop: '0.45rem' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {nextMatchdayMatches.map(renderMatchCard)}
              </div>
            </Section>
          ) : null}
          {groups.map((group) => {
            const groupMatches = matchesByGroup[group] || [];
            const standings = groupStandings[group] || [];
            const realStandings = realGroupStandings[group] || [];
            return (
              <Section
                key={group}
                title={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span aria-hidden style={{ width: 3, height: '1rem', borderRadius: '999px', background: 'rgb(var(--pitch))' }} />
                    {t('poolDetail.groupPhase.group', { group })}
                  </span>
                }
                trailing={
                  standings.length > 0 || realStandings.length > 0 ? (
                    <PoolDetailModalButton
                      title={`${t('poolDetail.groupPhase.group', { group })} · ${t('poolDetail.groupPhase.standingsTitle')}`}
                      icon={<FaRankingStar size={14} />}
                    >
                      <GroupStandingsContent
                        standings={standings}
                        realStandings={realStandings}
                        t={t}
                      />
                    </PoolDetailModalButton>
                  ) : null
                }
                collapsible
                defaultExpanded
                density="compact"
                tone="plain"
                className="main-section-plain"
                contentStyle={{ marginTop: '0.35rem', paddingTop: '0.45rem' }}
              >
                {groupMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {groupMatches.map(renderMatchCard)}
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

      <MatchInsightsModal
        poolId={poolId}
        target={insightsTarget}
        onClose={() => setInsightsTarget(null)}
        playerScoring={playerScoringConfig}
      />
    </div>
  );
}

type TranslationFn = (key: string, values?: Record<string, string | number>) => string;

const DEFAULT_MATCHDAY_SEPARATOR_TIME = '14:00';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function findNextMatchdayMatches(
  matchesByGroup: Record<string, Match[]>,
  separatorTime: unknown,
  nowMs: number,
): Match[] {
  const separator = parseMatchdaySeparatorTime(separatorTime);
  const now = new Date(nowMs);
  const windowStart = currentMatchdaySeparator(now, separator);
  const candidates = Object.values(matchesByGroup)
    .flat()
    .filter((match) => {
      const scheduledAt = new Date(match.scheduledAt).getTime();
      return Number.isFinite(scheduledAt) && scheduledAt >= windowStart.getTime();
    })
    .sort((a, b) => {
      const dateDiff = new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.matchNumber ?? 0) - (b.matchNumber ?? 0);
    });

  if (candidates.length === 0) return [];

  let windowStartMs = windowStart.getTime();
  let windowEndMs = windowStartMs + ONE_DAY_MS;
  const lastMatchMs = new Date(candidates[candidates.length - 1].scheduledAt).getTime();

  while (windowStartMs <= lastMatchMs) {
    const matchesInWindow = candidates.filter((match) => {
      const scheduledAt = new Date(match.scheduledAt).getTime();
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

function GroupStandingsContent({
  standings,
  realStandings,
  t,
}: Readonly<{
  standings: StandingRow[];
  realStandings: StandingRow[];
  t: TranslationFn;
}>) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {standings.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.45rem' }}>
          <StandingsNotice text={t('poolDetail.rules.points.notRealStanding')} />
          <PredictionStandingsTable
            rows={standings}
            t={t}
            caption={t('poolDetail.groupPhase.standingsTitle')}
            minWidth={460}
            qualificationCutoff={2}
          />
        </div>
      ) : null}
      {realStandings.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.45rem' }}>
          <StandingsNotice text={t('poolDetail.rules.points.realVirtualStanding')} />
          <PredictionStandingsTable
            rows={realStandings}
            t={t}
            caption={t('poolDetail.rules.points.realVirtualStanding')}
            minWidth={460}
            qualificationCutoff={2}
          />
        </div>
      ) : null}
      <FifaStandingsCriteriaLink t={t} />
    </div>
  );
}

function BestThirdsStandingsContent({
  standings,
  realStandings,
  t,
}: Readonly<{
  standings: StandingRow[];
  realStandings: StandingRow[];
  t: TranslationFn;
}>) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {standings.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.45rem' }}>
          <StandingsNotice text={t('poolDetail.rules.points.notRealStanding')} />
          <PredictionStandingsTable
            rows={standings}
            t={t}
            caption={t('poolDetail.groupPhase.bestThirdsPredictedTitle')}
            showGroup
            minWidth={520}
            qualificationCutoff={8}
          />
        </div>
      ) : null}
      {realStandings.length > 0 ? (
        <div style={{ display: 'grid', gap: '0.45rem' }}>
          <StandingsNotice text={t('poolDetail.rules.points.realVirtualStanding')} />
          <PredictionStandingsTable
            rows={realStandings}
            t={t}
            caption={t('poolDetail.groupPhase.bestThirdsRealTitle')}
            showGroup
            minWidth={520}
            qualificationCutoff={8}
          />
        </div>
      ) : null}
      <FifaStandingsCriteriaLink t={t} />
    </div>
  );
}

function FifaStandingsCriteriaLink({ t }: Readonly<{ t: TranslationFn }>) {
  return (
    <a
      href="https://digitalhub.fifa.com/m/636f5c9c6f29771f/original/FWC2026_regulations_EN.pdf"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifySelf: 'start',
        gap: '0.3rem',
        color: 'rgb(var(--fg))',
        fontSize: '0.8rem',
        fontWeight: 650,
      }}
    >
      {t('poolDetail.rules.points.fifaRegulationsLink')}
      <FaExternalLinkAlt size={11} aria-hidden />
    </a>
  );
}

function StandingsNotice({ text }: Readonly<{ text: string }>) {
  return (
    <p
      style={{
        display: 'grid',
        gridTemplateColumns: '1.25rem minmax(0, 1fr)',
        gap: '0.45rem',
        alignItems: 'start',
        margin: 0,
        color: 'rgb(var(--fg-muted))',
        fontSize: '0.8rem',
        lineHeight: 1.4,
      }}
    >
      <IoWarning aria-hidden style={{ color: 'rgb(var(--gold))', marginTop: '0.08rem' }} />
      <span>{text}</span>
    </p>
  );
}

function PredictionStandingsTable({
  rows,
  t,
  caption,
  showGroup = false,
  showStatus = false,
  minWidth,
  qualificationCutoff,
  style,
}: Readonly<{
  rows: StandingRow[];
  t: TranslationFn;
  caption?: string;
  showGroup?: boolean;
  showStatus?: boolean;
  minWidth: number;
  qualificationCutoff: number;
  style?: CSSProperties;
}>) {
  const columns = [
    { key: 'position', label: t('poolDetail.groupPhase.standings.position'), align: 'center' as const },
    { key: 'team', label: t('poolDetail.groupPhase.standings.team'), align: 'left' as const },
    ...(showGroup
      ? [{ key: 'group', label: t('poolDetail.groupPhase.standings.group'), align: 'center' as const }]
      : []),
    { key: 'points', label: t('poolDetail.groupPhase.standings.points'), align: 'right' as const },
    { key: 'played', label: t('poolDetail.groupPhase.standings.played'), align: 'right' as const },
    { key: 'goalsFor', label: t('poolDetail.groupPhase.standings.goalsFor'), align: 'right' as const },
    { key: 'goalsAgainst', label: t('poolDetail.groupPhase.standings.goalsAgainst'), align: 'right' as const },
    { key: 'goalDifference', label: t('poolDetail.groupPhase.standings.goalDifference'), align: 'right' as const },
    ...(showStatus
      ? [{ key: 'status', label: t('poolDetail.groupPhase.standings.status'), align: 'center' as const }]
      : []),
  ];

  return (
    <div
      className="data-table-frame"
      style={{
        ...style,
      }}
    >
      {caption ? (
        <div className="data-table-caption">
          {caption}
        </div>
      ) : null}
      <div className="data-table-scroll">
        <table
          className="data-table"
          style={{
            minWidth,
          }}
        >
          <thead>
            <tr
              style={{
                background: 'rgb(var(--panel-muted-bg-solid))',
                borderBottom: '1px solid rgb(var(--border))',
              }}
            >
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{
                    ...standingsThStyle,
                    ...standingsStickyHeaderStyle(column.key),
                    ...standingsColumnStyle(column.key),
                    textAlign: column.align,
                  }}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const qualified = index < qualificationCutoff;
              return (
                <tr key={`${row.group}-${row.teamId}`} style={{ borderBottom: '1px solid rgb(var(--border) / 0.65)' }}>
                  <td style={{ ...standingsTdStyle, ...standingsStickyCellStyle('position'), textAlign: 'center', fontWeight: 800, color: qualified ? 'rgb(var(--pitch))' : 'rgb(var(--fg-muted))' }}>
                    {index + 1}
                  </td>
                  <td style={{ ...standingsTdStyle, ...standingsStickyCellStyle('team'), textAlign: 'left', fontWeight: 700 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', minWidth: 0 }}>
                      <ReactCountryFlag countryCode={countryIsoCode(row.name)} svg style={{ width: '1.5em', height: '1.5em', flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{countryDisplayName(row.name, t)}</span>
                    </span>
                  </td>
                  {showGroup ? (
                    <td style={{ ...standingsTdStyle, ...standingsColumnStyle('group'), textAlign: 'center', fontWeight: 800 }}>{row.group}</td>
                  ) : null}
                  <td style={standingsPointsStyle}>{row.points}</td>
                  <td style={standingsNumberStyle}>{row.played}</td>
                  <td style={standingsNumberStyle}>{row.goalsFor}</td>
                  <td style={standingsNumberStyle}>{row.goalsAgainst}</td>
                  <td style={standingsNumberStyle}>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</td>
                  {showStatus ? (
                    <td style={{ ...standingsTdStyle, textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.14rem 0.45rem',
                          borderRadius: '999px',
                          border: `1px solid ${qualified ? 'rgb(var(--pitch) / 0.45)' : 'rgb(var(--border))'}`,
                          background: qualified ? 'rgb(var(--pitch) / 0.10)' : 'rgb(var(--bg-subtle))',
                          color: qualified ? 'rgb(var(--pitch))' : 'rgb(var(--fg-muted))',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {qualified ? t('poolDetail.groupPhase.standings.qualified') : t('poolDetail.groupPhase.standings.eliminated')}
                      </span>
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const standingsThStyle: CSSProperties = {
  padding: '0.5rem 0.45rem',
  fontSize: '0.72rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'rgb(var(--fg-muted))',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 2,
  background: 'rgb(var(--panel-muted-bg-solid))',
};

const standingsTdStyle: CSSProperties = {
  padding: '0.5rem 0.45rem',
  fontSize: '0.76rem',
  color: 'rgb(var(--fg))',
  verticalAlign: 'middle',
};

const standingsNumberStyle: CSSProperties = {
  ...standingsTdStyle,
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  color: 'rgb(var(--fg-muted))',
};

const standingsPointsStyle: CSSProperties = {
  ...standingsNumberStyle,
  fontWeight: 900,
  color: 'rgb(var(--fg))',
};

function standingsStickyHeaderStyle(key: string): CSSProperties {
  if (key === 'position') {
    return {
      left: 0,
      zIndex: 6,
      width: '3.2rem',
      minWidth: '3.2rem',
      background: 'rgb(var(--panel-muted-bg-solid))',
    };
  }
  if (key === 'team') {
    return {
      left: '3.2rem',
      zIndex: 6,
      width: '8rem',
      minWidth: '8rem',
      maxWidth: '8rem',
      background: 'rgb(var(--panel-muted-bg-solid))',
      borderRight: '1px solid rgb(var(--border))',
    };
  }
  return {};
}

function standingsStickyCellStyle(key: string): CSSProperties {
  if (key === 'position') {
    return {
      position: 'sticky',
      left: 0,
      zIndex: 4,
      width: '3.2rem',
      minWidth: '3.2rem',
      background: 'rgb(var(--bg-elevated))',
      backgroundClip: 'padding-box',
    };
  }
  if (key === 'team') {
    return {
      position: 'sticky',
      left: '3.2rem',
      zIndex: 4,
      width: '8rem',
      minWidth: '8rem',
      maxWidth: '8rem',
      background: 'rgb(var(--bg-elevated))',
      backgroundClip: 'padding-box',
      borderRight: '1px solid rgb(var(--border))',
    };
  }
  return {};
}

function standingsColumnStyle(key: string): CSSProperties {
  if (key === 'group') {
    return {
      width: '2.6rem',
      minWidth: '2.6rem',
      maxWidth: '2.6rem',
      paddingLeft: '0.35rem',
      paddingRight: '0.35rem',
    };
  }
  if (
    key === 'points' ||
    key === 'played' ||
    key === 'goalsFor' ||
    key === 'goalsAgainst' ||
    key === 'goalDifference'
  ) {
    return {
      width: '3.4rem',
      minWidth: '3.4rem',
      maxWidth: '3.4rem',
      paddingLeft: '0.3rem',
      paddingRight: '0.3rem',
    };
  }
  return {};
}
