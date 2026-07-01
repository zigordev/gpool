'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '@/i18n/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  usePoolContext,
  formatEur,
  resolvePrizeDistribution,
  PLAYER_AWARDS,
  PLAYER_POSITIONS,
} from '@/contexts/PoolContext';
import { RankTable } from '@/components/pool/RankTable';
import { Modal } from '@/components/ui/Modal';
import { Section } from '@/components/ui/Section';
import ReactCountryFlag from 'react-country-flag';
import { countryDisplayName, countryIsoCode } from '@/lib/country-flags';
import { SpyPicksData } from '@/types/spyPicksData.interface';
import { PlayerSelection } from '@/types/playerSelection.interface';
import { PlayerAward } from '@/types/playerAward.type';
import { PlayerAwardSelection } from '@/types/playerAwardSelection.interface';
import {
  GeneralPoolInfoSection,
  resolvePlayerInfoScoring,
} from '@/components/pool/PoolInfoSections';
import { PlayerActionSummary } from '@/components/pool/PlayerActionSummary';
import { PointsBadge } from '@/components/PointsBadge';
import { PlayerSelectionLimits } from '@/lib/player-selection-limits';
import { ReadOnlyGroupMatchCard } from '@/components/pool/ReadOnlyGroupMatchCard';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { PlayerShirt } from '@/components/pool/PlayerShirt';
import { PlayerEliminatedBadge } from '@/components/pool/PlayerEliminatedBadge';

const BracketVisualization = dynamic(
  () => import('@/components/BracketVisualization').then((mod) => mod.BracketVisualization),
  { ssr: false }
);

const eliminatedSpyCardStyle = {
  border: '1px solid rgb(var(--live) / 0.58)',
  borderLeft: '4px solid rgb(var(--live))',
  background: 'rgb(var(--live) / 0.12)',
  boxShadow: '0 0 0 1px rgb(var(--live) / 0.12)',
};

function EliminatedCornerBadge({ visible }: Readonly<{ visible?: boolean }>) {
  return visible ? (
    <span
      style={{
        position: 'absolute',
        top: '0.42rem',
        right: '0.48rem',
        zIndex: 3,
      }}
    >
      <PlayerEliminatedBadge />
    </span>
  ) : null;
}

// ─── SpyPicksModal ─────────────────────────────────────────────────────────────

function SpyPicksModal({
  spy,
  onClose,
  groups,
  matchesByGroup,
  bracketStructure,
  teams,
  poolId,
  tournamentPlayers,
  playerSelectionLimits,
  playerScoring,
  bracketScoring,
  locale,
}: Readonly<{
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
  teams: Array<{ teamId: string; name: string; group?: string; code?: string }>;
  poolId: string;
  tournamentPlayers: any[];
  playerSelectionLimits: PlayerSelectionLimits;
  playerScoring: ReturnType<typeof resolvePlayerInfoScoring>;
  bracketScoring: ReturnType<typeof usePoolContext>['bracketScoringConfig'];
  locale: string;
}>) {
  const { t } = useI18n();
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

  const predictionByMatch = useMemo(() => {
    const map = new Map<string, SpyPicksData['predictions'][number]>();
    if (data) for (const p of data.predictions) map.set(p.matchId, p);
    return map;
  }, [data]);

  const spyBracketPredictions = useMemo(() => {
    const map: Record<string, any> = {};
    if (data) for (const p of data.bracketPredictions) map[p.bracketMatchId] = p;
    return map;
  }, [data]);

  const playerByPositionSlot = useMemo(() => {
    const map = new Map<string, PlayerSelection>();
    if (data) for (const sel of data.playerSelections) map.set(`${sel.position}:${sel.slot}`, sel);
    return map;
  }, [data]);

  const playerByAward = useMemo(() => {
    const map = new Map<PlayerAward, PlayerAwardSelection>();
    if (data) for (const sel of data.playerAwardSelections || []) map.set(sel.award, sel);
    return map;
  }, [data]);

  return (
    <Modal open={open} onClose={onClose} title={userName} size="lg">
      <div
        className="players-tab-bar"
        role="tablist"
        style={{ display: 'flex', width: 'fit-content', margin: '0 auto 1rem' }}
      >
        {(['groups', 'final', 'players'] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            className={`players-tab-btn${tab === key ? ' players-tab-btn--active' : ''}`}
            onClick={() => setTab(key)}
          >
            {key === 'groups'
              ? t('poolDetail.spy.tabs.groups')
              : key === 'final'
                ? t('poolDetail.spy.tabs.final')
                : t('poolDetail.spy.tabs.players')}
          </button>
        ))}
      </div>

      <div
        style={{
          maxHeight: 'min(68vh, 580px)',
          padding: '0.5rem 0.95rem 0.25rem 0.05rem',
          overflowY: 'auto',
          overflowX: 'clip',
          scrollbarGutter: 'stable',
        }}
      >
        {loading ? (
          <p
            style={{
              color: 'rgb(var(--fg-muted))',
              textAlign: 'center',
              padding: '2rem 0',
              margin: 0,
            }}
          >
            {t('poolDetail.spy.loading')}
          </p>
        ) : error ? (
          <p
            style={{ color: 'rgb(var(--live))', textAlign: 'center', padding: '2rem 0', margin: 0 }}
          >
            {error}
          </p>
        ) : data ? (
          tab === 'groups' ? (
            <SpyGroupsView
              data={data}
              groups={groups}
              matchesByGroup={matchesByGroup}
              predictionByMatch={predictionByMatch}
              locale={locale}
            />
          ) : tab === 'final' ? (
            <SpyFinalView
              bracket={bracketStructure}
              teams={teams}
              poolId={poolId}
              bracketPredictions={spyBracketPredictions}
              hasPredictions={data.bracketPredictions.length > 0}
              bracketScoring={bracketScoring}
            />
          ) : (
            <SpyPlayersView
              playerByPositionSlot={playerByPositionSlot}
              playerByAward={playerByAward}
              playerSelectionLimits={playerSelectionLimits}
              playerScoring={playerScoring}
              hasPredictions={
                data.playerSelections.length > 0 || (data.playerAwardSelections?.length ?? 0) > 0
              }
            />
          )
        ) : null}
      </div>
    </Modal>
  );
}

// ─── Groups tab ───────────────────────────────────────────────────────────────

function SpyGroupsView({
  data,
  groups,
  matchesByGroup,
  predictionByMatch,
  locale,
}: Readonly<{
  data: SpyPicksData;
  groups: string[];
  matchesByGroup: Record<string, Match[]>;
  predictionByMatch: Map<string, SpyPicksData['predictions'][number]>;
  locale: string;
}>) {
  const { t } = useI18n();
  if (data.predictions.length === 0 && groups.length === 0) {
    return <SpyEmpty text={t('poolDetail.spy.empty.predictions')} />;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
        padding: '0.05rem',
        boxSizing: 'border-box',
      }}
    >
      {groups.map((group) => {
        const matches = matchesByGroup[group] || [];
        return (
          <Section
            key={group}
            title={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  aria-hidden
                  style={{
                    width: 3,
                    height: '1rem',
                    borderRadius: '999px',
                    background: 'rgb(var(--pitch))',
                  }}
                />
                {t('poolDetail.spy.groupLabel', { group })}
              </span>
            }
            collapsible
            defaultExpanded
            density="compact"
            tone="plain"
            className="main-section-plain"
            contentStyle={{ marginTop: '0.35rem', paddingTop: '0.45rem' }}
          >
            <ul
              style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem' }}
            >
              {matches.map((match) => {
                const pick = predictionByMatch.get(match.matchId);
                return (
                  <li key={match.matchId}>
                    <ReadOnlyGroupMatchCard
                      match={match}
                      prediction={pick || null}
                      locale={locale}
                    />
                  </li>
                );
              })}
            </ul>
          </Section>
        );
      })}
    </div>
  );
}

// ─── Final phase tab ──────────────────────────────────────────────────────────

function SpyFinalView({
  bracket,
  teams,
  poolId,
  bracketPredictions,
  hasPredictions,
  bracketScoring,
}: Readonly<{
  bracket: Record<string, any[]>;
  teams: Array<{ teamId: string; name: string; group?: string; code?: string }>;
  poolId: string;
  bracketPredictions: Record<string, any>;
  hasPredictions: boolean;
  bracketScoring: ReturnType<typeof usePoolContext>['bracketScoringConfig'];
}>) {
  const { t } = useI18n();
  const hasStructure = Object.values(bracket).some((arr) => arr.length > 0);

  if (!hasStructure) return <SpyEmpty text={t('poolDetail.spy.empty.bracket')} />;

  return (
    <div style={{ margin: '0 -0.25rem' }}>
      <BracketVisualization
        bracket={bracket}
        teams={teams}
        poolId={poolId}
        mode="user"
        bracketPredictions={bracketPredictions}
        deadline={1}
        candidateOptions={{}}
        exactPositionPoints={bracketScoring.exactPositionPoints}
        correctTeamWrongPositionPoints={bracketScoring.correctTeamWrongPositionPoints}
        tournamentWinnerPoints={bracketScoring.tournamentWinnerPoints}
        roundScoring={bracketScoring.rounds}
      />
      {hasPredictions ? null : (
        <p
          style={{
            color: 'rgb(var(--fg-subtle))',
            fontSize: '0.8rem',
            textAlign: 'center',
            marginTop: '0.75rem',
          }}
        >
          {t('poolDetail.spy.empty.bracket')}
        </p>
      )}
    </div>
  );
}

// ─── Players tab ──────────────────────────────────────────────────────────────

function SpyPlayersView({
  playerByPositionSlot,
  playerByAward,
  playerSelectionLimits,
  playerScoring,
  hasPredictions,
}: Readonly<{
  playerByPositionSlot: Map<string, PlayerSelection>;
  playerByAward: Map<PlayerAward, PlayerAwardSelection>;
  playerSelectionLimits: PlayerSelectionLimits;
  playerScoring: ReturnType<typeof resolvePlayerInfoScoring>;
  hasPredictions: boolean;
}>) {
  const { t } = useI18n();
  const actionLabels = {
    goals: t('poolDetail.players.actions.goals'),
    penaltyGoals: t('poolDetail.players.actions.penaltyGoals'),
    missedPenalties: t('poolDetail.players.actions.missedPenalties'),
    mvps: t('poolDetail.players.actions.mvps'),
    penaltiesSaved: t('poolDetail.players.actions.penaltiesSaved'),
    forcedPenaltyMisses: t('poolDetail.players.actions.forcedPenaltyMisses'),
    shootoutPenaltiesSaved: t('poolDetail.players.actions.shootoutPenaltiesSaved'),
    shootoutGoals: t('poolDetail.players.actions.shootoutGoals'),
    shootoutMissedPenalties: t('poolDetail.players.actions.shootoutMissedPenalties'),
    shootoutForcedPenaltyMisses: t('poolDetail.players.actions.shootoutForcedPenaltyMisses'),
    cleanSheets: t('poolDetail.players.actions.cleanSheets'),
    assists: t('poolDetail.players.actions.assists'),
    yellowCards: t('poolDetail.players.actions.yellowCards'),
    doubleYellowCards: t('poolDetail.players.actions.doubleYellowCards'),
    redCards: t('poolDetail.players.actions.redCards'),
  };

  if (!hasPredictions) return <SpyEmpty text={t('poolDetail.spy.empty.players')} />;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.55rem',
        padding: '0.05rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Awards */}
      <Section
        title={t('poolDetail.players.awards.individual')}
        collapsible
        defaultExpanded
        density="compact"
        tone="plain"
        className="main-section-plain"
        contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {PLAYER_AWARDS.map((award) => {
            const sel = playerByAward.get(award.key);
            return (
              <article
                key={award.key}
                className={`player-selection-card player-selection-card--award${sel?.teamEliminated ? ' player-selection-card--eliminated' : ''}`}
                style={{
                  position: 'relative',
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: sel?.teamEliminated ? '0.55rem 5.8rem 0.55rem 0.55rem' : '0.55rem',
                  borderRadius: 'var(--radius-md)',
                  border: sel?.teamEliminated
                    ? eliminatedSpyCardStyle.border
                    : '1px solid rgb(var(--border) / 0.82)',
                  borderLeft: sel?.teamEliminated
                    ? eliminatedSpyCardStyle.borderLeft
                    : '3px solid rgb(var(--gold))',
                  background: sel?.teamEliminated
                    ? eliminatedSpyCardStyle.background
                    : 'rgb(var(--bg-elevated) / 0.82)',
                  boxShadow: sel?.teamEliminated ? eliminatedSpyCardStyle.boxShadow : undefined,
                }}
              >
                <EliminatedCornerBadge visible={sel?.teamEliminated} />
                {sel && (sel.awardPoints ?? 0) > 0 ? (
                  <PointsBadge
                    points={sel.awardPoints ?? 0}
                    label={t('poolDetail.players.points', { points: sel.awardPoints ?? 0 })}
                  />
                ) : null}
                <span aria-hidden style={{ fontSize: '0.9rem', flexShrink: 0 }}>
                  {award.icon}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'rgb(var(--fg-muted))',
                    flexShrink: 0,
                    minWidth: '6rem',
                  }}
                >
                  {t(
                    award.key === 'golden_boot'
                      ? 'poolDetail.players.awards.goldenBoot'
                      : 'poolDetail.players.awards.tournamentMvp'
                  )}
                </span>
                {sel ? (
                  <>
                    <PlayerShirt teamName={sel.teamName} shirtNumber={sel.shirtNumber} size={25} />
                    <div
                      style={{
                        display: 'grid',
                        gap: '0.18rem',
                        minWidth: 0,
                        flex: '1 1 9rem',
                        opacity: sel.teamEliminated ? 0.5 : 1,
                        filter: sel.teamEliminated ? 'grayscale(0.9)' : undefined,
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'rgb(var(--fg))',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {sel.name}
                      </span>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.32rem',
                          minWidth: 0,
                          fontSize: '0.72rem',
                          color: 'rgb(var(--fg-muted))',
                          fontWeight: 650,
                        }}
                      >
                        <ReactCountryFlag
                          countryCode={countryIsoCode(sel.teamName)}
                          svg
                          style={{ width: '1.25em', height: '1.25em', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {countryDisplayName(sel.teamName, t)}
                        </span>
                      </span>
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'rgb(var(--fg-subtle))' }}>—</span>
                )}
              </article>
            );
          })}
        </div>
      </Section>

      {/* By position */}
      {PLAYER_POSITIONS.map(({ key: position, labelKey }) => (
        <Section
          key={position}
          title={t(labelKey)}
          collapsible
          defaultExpanded
          density="compact"
          tone="plain"
          className="main-section-plain"
          contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Array.from({ length: playerSelectionLimits[position] }, (_, idx) => {
              const slot = idx + 1;
              const sel = playerByPositionSlot.get(`${position}:${slot}`);
              return (
                <article
                  key={slot}
                  className={`player-selection-card${sel?.teamEliminated ? ' player-selection-card--eliminated' : ''}`}
                  style={{
                    position: 'relative',
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: sel?.teamEliminated ? '0.55rem 5.8rem 0.55rem 0.55rem' : '0.55rem',
                    borderRadius: 'var(--radius-md)',
                    border: sel?.teamEliminated
                      ? eliminatedSpyCardStyle.border
                      : '1px solid rgb(var(--border) / 0.82)',
                    borderLeft: sel?.teamEliminated
                      ? eliminatedSpyCardStyle.borderLeft
                      : '3px solid rgb(var(--pitch))',
                    background: sel?.teamEliminated
                      ? eliminatedSpyCardStyle.background
                      : 'rgb(var(--bg-elevated) / 0.82)',
                    boxShadow: sel?.teamEliminated ? eliminatedSpyCardStyle.boxShadow : undefined,
                    flexWrap: 'wrap',
                  }}
                >
                  <EliminatedCornerBadge visible={sel?.teamEliminated} />
                  {sel && (sel.totalPoints ?? 0) > 0 ? (
                    <PointsBadge
                      points={sel.totalPoints ?? 0}
                      label={t('poolDetail.players.points', { points: sel.totalPoints ?? 0 })}
                    />
                  ) : null}
                  {sel ? (
                    <>
                      <PlayerShirt
                        teamName={sel.teamName}
                        shirtNumber={sel.shirtNumber}
                        size={25}
                      />
                      <div style={{ minWidth: 0, flex: '1 1 9rem' }}>
                        <span
                          style={{
                            display: 'grid',
                            gap: '0.18rem',
                            minWidth: 0,
                            opacity: sel.teamEliminated ? 0.5 : 1,
                            filter: sel.teamEliminated ? 'grayscale(0.9)' : undefined,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'rgb(var(--fg))',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {sel.name}
                          </span>
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.32rem',
                              minWidth: 0,
                              fontSize: '0.72rem',
                              color: 'rgb(var(--fg-muted))',
                              fontWeight: 650,
                            }}
                          >
                            <ReactCountryFlag
                              countryCode={countryIsoCode(sel.teamName)}
                              svg
                              style={{ width: '1.25em', height: '1.25em', flexShrink: 0 }}
                            />
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {countryDisplayName(sel.teamName, t)}
                            </span>
                          </span>
                        </span>
                      </div>
                      <PlayerActionSummary
                        player={sel}
                        labels={actionLabels}
                        position={sel.position}
                        scoring={playerScoring}
                        compact
                      />
                    </>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'rgb(var(--fg-subtle))' }}>—</span>
                )}
                </article>
              );
            })}
          </div>
        </Section>
      ))}
    </div>
  );
}

function SpyEmpty({ text }: Readonly<{ text: string }>) {
  return (
    <p
      style={{
        color: 'rgb(var(--fg-subtle))',
        fontSize: '0.875rem',
        textAlign: 'center',
        padding: '1.5rem 0',
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

// ─── Ranking page ─────────────────────────────────────────────────────────────

export function RankingContent({
  showGeneralSection = true,
}: Readonly<{ showGeneralSection?: boolean }>) {
  const { t, locale } = useI18n();
  const { setPoolActions } = useNavCenter();
  const { user } = useAuth();
  const {
    ranking,
    spy,
    setSpy,
    handleStartSpy,
    isPastPoolDeadline,
    groups,
    matchesByGroup,
    bracket,
    players,
    poolDeadline,
    pool,
    poolId,
    teams,
    playerSelectionLimits,
    bracketScoringConfig,
  } = usePoolContext();

  const prizeDistribution = useMemo(() => resolvePrizeDistribution(pool), [pool]);
  const entryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;
  const formatCurrency = useCallback((amount: number) => formatEur(amount, locale), [locale]);
  const deadlineHint = new Date(poolDeadline).toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  useLayoutEffect(() => {
    setPoolActions(
      showGeneralSection ? (
        <GeneralPoolInfoSection
          deadlineLabel={deadlineHint}
          entryFeeLabel={entryFee}
          prizeDistribution={prizeDistribution}
          formatCurrency={formatCurrency}
          playerSelectionLimits={playerSelectionLimits}
        />
      ) : null
    );
    return () => setPoolActions(null);
  }, [
    deadlineHint,
    entryFee,
    formatCurrency,
    playerSelectionLimits,
    prizeDistribution,
    setPoolActions,
    showGeneralSection,
  ]);

  return (
    <div className="content-panel main-view-stack">
      {ranking.length > 0 ? (
        <RankTable
          ranking={ranking}
          currentUserId={user?.userId}
          currentUserEmail={user?.email}
          onSpy={handleStartSpy}
          spyEnabled={isPastPoolDeadline}
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
        teams={teams}
        poolId={poolId}
        tournamentPlayers={players}
        playerSelectionLimits={playerSelectionLimits}
        playerScoring={resolvePlayerInfoScoring(pool?.config?.playerScoring)}
        bracketScoring={bracketScoringConfig}
        locale={locale}
      />
    </div>
  );
}
