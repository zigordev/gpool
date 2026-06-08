'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePoolContext, formatEur, computePrize, resolvePrizeDistribution, PLAYER_AWARDS, PLAYER_POSITIONS } from '@/contexts/PoolContext';
import { RankTable } from '@/components/pool/RankTable';
import { Modal } from '@/components/ui/Modal';
import { BracketVisualization } from '@/components/BracketVisualization';
import ReactCountryFlag from 'react-country-flag';
import { countryIsoCode } from '@/lib/country-flags';
import { SpyPicksData } from '@/types/spyPicksData.interface';
import { PlayerSelection } from '@/types/playerSelection.interface';
import { PlayerAward } from '@/types/playerAward.type';
import { PlayerAwardSelection } from '@/types/playerAwardSelection.interface';
import { GeneralPoolInfoSection } from '@/components/pool/PoolInfoSections';
import { resolvePlayerInfoScoring } from '@/components/pool/PoolInfoSections';
import { PlayerActionSummary } from '@/components/pool/PlayerActionSummary';
import { PointsBadge } from '@/components/PointsBadge';
import { PlayerSelectionLimits } from '@/lib/player-selection-limits';

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
  spy: { target: { userId: string; userName: string }; loading: boolean; error: string | null; data: SpyPicksData | null } | null;
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
    if (data) for (const sel of data.playerAwardSelections || []) map.set(sel.award as PlayerAward, sel);
    return map;
  }, [data]);

  return (
    <Modal open={open} onClose={onClose} title={userName} size="lg">
      <div className="players-tab-bar" role="tablist" style={{ marginBottom: '1rem' }}>
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
          <p style={{ color: 'rgb(var(--fg-muted))', textAlign: 'center', padding: '2rem 0', margin: 0 }}>
            {t('poolDetail.spy.loading')}
          </p>
        ) : error ? (
          <p style={{ color: 'rgb(var(--live))', textAlign: 'center', padding: '2rem 0', margin: 0 }}>{error}</p>
        ) : !data ? null : tab === 'groups' ? (
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
            hasPredictions={data.playerSelections.length > 0 || (data.playerAwardSelections?.length ?? 0) > 0}
          />
        )}
      </div>
    </Modal>
  );
}

// ─── Groups tab ───────────────────────────────────────────────────────────────

function SpyGroupsView({ data, groups, matchesByGroup, predictionByMatch, locale }: Readonly<{
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
            <header style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))' }}>
              {t('poolDetail.spy.groupLabel', { group })}
            </header>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem' }}>
              {matches.map((match) => {
                const pick = predictionByMatch.get(match.matchId);
                const hasPick = pick && typeof pick.homeScore === 'number' && typeof pick.awayScore === 'number';
                const hasResult = typeof match.homeResult === 'number' && typeof match.awayResult === 'number';
                const tone = pick?.isExactMatch === true
                  ? 'rgb(var(--pitch))'
                  : pick?.isCorrect === true
                  ? 'rgb(var(--info))'
                  : hasResult && hasPick
                  ? 'rgb(var(--live))'
                  : 'rgb(var(--fg-subtle))';
                const matchDate = new Date(match.scheduledAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                return (
                  <li key={match.matchId} style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)', background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))' }}>
                    {hasPick && hasResult && (pick.points ?? 0) > 0 ? (
                      <PointsBadge
                        points={pick.points ?? 0}
                        label={t('poolDetail.match.points', { points: pick.points ?? 0 })}
                      />
                    ) : null}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'rgb(var(--fg-subtle))', fontWeight: 600 }}>
                      <span>{matchDate}</span>
                      {hasResult ? <span style={{ color: 'rgb(var(--fg-muted))' }}>FT {match.homeResult}–{match.awayResult}</span> : null}
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgb(var(--fg))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.homeTeamName}</span>
                    <span style={{ fontFamily: 'var(--font-display, inherit)', fontWeight: 800, fontSize: '0.9rem', color: tone, fontVariantNumeric: 'tabular-nums', textAlign: 'center', minWidth: '3.5rem' }}>
                      {hasPick ? `${pick.homeScore}–${pick.awayScore}` : '—'}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgb(var(--fg))', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.awayTeamName}</span>
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

function SpyFinalView({ bracket, teams, poolId, bracketPredictions, hasPredictions }: Readonly<{
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
      {!hasPredictions ? (
        <p style={{ color: 'rgb(var(--fg-subtle))', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.75rem' }}>
          {t('poolDetail.spy.empty.bracket')}
        </p>
      ) : null}
    </div>
  );
}

// ─── Players tab ──────────────────────────────────────────────────────────────

function SpyPlayersView({ playerByPositionSlot, playerByAward, playerSelectionLimits, playerScoring, hasPredictions }: Readonly<{
  playerByPositionSlot: Map<string, PlayerSelection>;
  playerByAward: Map<PlayerAward, PlayerAwardSelection>;
  playerSelectionLimits: PlayerSelectionLimits;
  playerScoring: ReturnType<typeof resolvePlayerInfoScoring>;
  hasPredictions: boolean;
}>) {
  const { t } = useI18n();
  const actionLabels = {
    goals: t('poolDetail.players.actions.goals'),
    missedPenalties: t('poolDetail.players.actions.missedPenalties'),
    mvps: t('poolDetail.players.actions.mvps'),
    penaltiesSaved: t('poolDetail.players.actions.penaltiesSaved'),
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
        <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.3rem' }}>
          {t('poolDetail.spy.tabs.players')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
          {PLAYER_AWARDS.map((award) => {
            const sel = playerByAward.get(award.key as PlayerAward);
            return (
              <div key={award.key} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', background: sel ? 'rgb(var(--bg-elevated))' : 'rgb(var(--bg-subtle))', border: '1px solid rgb(var(--border))' }}>
                {sel && (sel.awardPoints ?? 0) > 0 ? (
                  <PointsBadge points={sel.awardPoints ?? 0} label={t('poolDetail.players.points', { points: sel.awardPoints ?? 0 })} />
                ) : null}
                <span aria-hidden style={{ fontSize: '0.9rem', flexShrink: 0 }}>{award.icon}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgb(var(--fg-muted))', flexShrink: 0, minWidth: '6rem' }}>
                  {t(award.key === 'golden_boot' ? 'poolDetail.players.awards.goldenBoot' : 'poolDetail.players.awards.tournamentMvp')}
                </span>
                {sel ? (
                  <>
                    <ReactCountryFlag countryCode={countryIsoCode(sel.teamName)} svg style={{ width: '1.25em', height: '1.25em', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgb(var(--fg))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgb(var(--fg-muted))', flexShrink: 0 }}>{sel.teamName}</span>
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
          <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.3rem' }}>
            {t(labelKey)}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {Array.from({ length: playerSelectionLimits[position] }, (_, idx) => {
              const slot = idx + 1;
              const sel = playerByPositionSlot.get(`${position}:${slot}`);
              return (
                <div key={slot} style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '0.55rem', padding: '0.45rem 0.5rem', borderRadius: 'var(--radius-sm)', background: sel ? 'rgb(var(--bg-elevated))' : 'transparent', border: sel ? '1px solid rgb(var(--border))' : '1px solid rgb(var(--border) / 0.4)' }}>
                  {sel && (sel.totalPoints ?? 0) > 0 ? (
                    <PointsBadge points={sel.totalPoints ?? 0} label={t('poolDetail.players.points', { points: sel.totalPoints ?? 0 })} />
                  ) : null}
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgb(var(--fg-subtle))', width: '0.9rem', textAlign: 'right', flexShrink: 0 }}>{slot}</span>
                  {sel ? (
                    <>
                      <ReactCountryFlag countryCode={countryIsoCode(sel.teamName)} svg style={{ width: '1.25em', height: '1.25em', flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'rgb(var(--fg))', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sel.name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'rgb(var(--fg-muted))', flexShrink: 0 }}>{sel.teamName}</span>
                        </div>
                        <PlayerActionSummary
                          player={sel}
                          labels={actionLabels}
                          position={sel.position}
                          scoring={playerScoring}
                        />
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'rgb(var(--fg-subtle) / 0.6)' }}>—</span>
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
  return <p style={{ color: 'rgb(var(--fg-subtle))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>{text}</p>;
}

// ─── Ranking page ─────────────────────────────────────────────────────────────

export function RankingContent({ showGeneralSection = true }: Readonly<{ showGeneralSection?: boolean }>) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const {
    ranking, spy, setSpy, handleStartSpy, isPastPoolDeadline,
    groups, matchesByGroup, bracket, players, poolDeadline,
    pool, poolId, teams, playerSelectionLimits,
  } = usePoolContext();

  const prizeDistribution = resolvePrizeDistribution(pool);
  const memberCount = pool?.memberCount ?? (pool?.members ? pool.members.length : 0);
  const entryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;
  const totalPrizePool = (entryFee ?? 0) * memberCount;
  const prizeForRank = (rank: number) => totalPrizePool > 0 ? computePrize(totalPrizePool, prizeDistribution, rank) : 0;
  const formatCurrency = (amount: number) => formatEur(amount, locale);
  const deadlineHint = new Date(poolDeadline).toLocaleString(locale, {
    hour: '2-digit', minute: '2-digit', hour12: false,
    month: 'long', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {showGeneralSection ? (
        <GeneralPoolInfoSection
          deadlineLabel={deadlineHint}
          entryFeeLabel={entryFee}
          prizeDistribution={prizeDistribution}
          playerSelectionLimits={playerSelectionLimits}
        />
      ) : null}

      {ranking.length > 0 ? (
        <RankTable
          ranking={ranking}
          currentUserId={user?.userId}
          currentUserEmail={user?.email}
          prizeForRank={prizeForRank}
          formatCurrency={formatCurrency}
          onSpy={handleStartSpy}
          spyEnabled={isPastPoolDeadline}
        />
      ) : (
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem 0.5rem' }}>
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
