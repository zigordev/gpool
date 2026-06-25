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
import ReactCountryFlag from 'react-country-flag';
import { countryIsoCode } from '@/lib/country-flags';
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
          overflowY: 'auto',
          overflowX: 'clip',
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
        gap: '1rem',
        padding: '0.6rem 0.9rem 0.25rem 0.1rem',
        boxSizing: 'border-box',
      }}
    >
      {groups.map((group) => {
        const matches = matchesByGroup[group] || [];
        return (
          <section key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <header
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgb(var(--fg-subtle))',
              }}
            >
              {t('poolDetail.spy.groupLabel', { group })}
            </header>
            <ul
              style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem' }}
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
          </section>
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
}: Readonly<{
  bracket: Record<string, any[]>;
  teams: Array<{ teamId: string; name: string; group?: string; code?: string }>;
  poolId: string;
  bracketPredictions: Record<string, any>;
  hasPredictions: boolean;
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
    redCards: t('poolDetail.players.actions.redCards'),
  };

  if (!hasPredictions) return <SpyEmpty text={t('poolDetail.spy.empty.players')} />;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.85rem',
        padding: '0.6rem 0.9rem 0.25rem 0.1rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Awards */}
      <div>
        <p
          style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgb(var(--fg-subtle))',
            marginBottom: '0.3rem',
          }}
        >
          {t('poolDetail.spy.tabs.players')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {PLAYER_AWARDS.map((award) => {
            const sel = playerByAward.get(award.key);
            return (
              <div
                key={award.key}
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '0.35rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  background: sel ? 'rgb(var(--bg-elevated))' : 'rgb(var(--bg-subtle))',
                  border: '1px solid rgb(var(--border))',
                }}
              >
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
                    <ReactCountryFlag
                      countryCode={countryIsoCode(sel.teamName)}
                      svg
                      style={{ width: '1.25em', height: '1.25em', flexShrink: 0 }}
                    />
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'rgb(var(--fg))',
                        opacity: sel.teamEliminated ? 0.68 : 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sel.name}
                    </span>
                    {sel.teamEliminated ? <PlayerEliminatedBadge /> : null}
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.72rem',
                        color: 'rgb(var(--fg-muted))',
                        flexShrink: 0,
                      }}
                    >
                      {sel.teamName}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: 'rgb(var(--fg-subtle))' }}>—</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* By position */}
      {PLAYER_POSITIONS.map(({ key: position, labelKey }) => (
        <div key={position}>
          <p
            style={{
              fontSize: '0.62rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgb(var(--fg-subtle))',
              marginBottom: '0.3rem',
            }}
          >
            {t(labelKey)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {Array.from({ length: playerSelectionLimits[position] }, (_, idx) => {
              const slot = idx + 1;
              const sel = playerByPositionSlot.get(`${position}:${slot}`);
              return (
                <div
                  key={slot}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.45rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    background: sel ? 'rgb(var(--bg-elevated))' : 'transparent',
                    border: sel
                      ? '1px solid rgb(var(--border))'
                      : '1px solid rgb(var(--border) / 0.4)',
                    flexWrap: 'wrap',
                  }}
                >
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
                      <ReactCountryFlag
                        countryCode={countryIsoCode(sel.teamName)}
                        svg
                        style={{ width: '1.25em', height: '1.25em', flexShrink: 0 }}
                      />
                      <div style={{ minWidth: 0, flex: '1 1 9rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: 'rgb(var(--fg))',
                              opacity: sel.teamEliminated ? 0.68 : 1,
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {sel.name}
                          </span>
                          {sel.teamEliminated ? <PlayerEliminatedBadge /> : null}
                          <span
                            style={{
                              fontSize: '0.72rem',
                              color: 'rgb(var(--fg-muted))',
                              flexShrink: 0,
                            }}
                          >
                            {sel.teamName}
                          </span>
                        </div>
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
                </div>
              );
            })}
          </div>
        </div>
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
        locale={locale}
      />
    </div>
  );
}
