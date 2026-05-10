'use client';

import { useEffect, useState } from 'react';
import { useI18n } from '@/i18n/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePoolContext, phaseShortKey, PLAYER_AWARDS, PLAYER_POSITIONS, PLAYER_SELECTION_LIMIT } from '@/contexts/PoolContext';
import { RankTable } from '@/components/pool/RankTable';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatEur, computePrize, resolvePrizeDistribution } from '@/contexts/PoolContext';
import { SpyPicksData } from '@/types/spyPicksData.interface';
import { SpyPicksLabels } from '@/types/spyPicksLabels.interface';
import { PlayerSelection } from '@/types/playerSelection.interface';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';

// ─── SpyPicksModal ─────────────────────────────────────────────────────────────

function SpyPicksModal({
  spy,
  onClose,
  groups,
  matchesByGroup,
  bracketStructure,
  tournamentPlayers,
  labels,
  locale,
}: Readonly<{
  spy: { target: { userId: string; userName: string }; loading: boolean; error: string | null; data: SpyPicksData | null } | null;
  onClose: () => void;
  groups: string[];
  matchesByGroup: Record<string, Match[]>;
  bracketStructure: Record<string, any[]>;
  tournamentPlayers: TournamentPlayer[];
  labels: SpyPicksLabels;
  locale: string;
}>) {
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

  const predictionByMatch = new Map<string, SpyPicksData['predictions'][number]>();
  if (data) for (const p of data.predictions) predictionByMatch.set(p.matchId, p);

  const bracketPickByMatch = new Map<string, SpyBracketPrediction>();
  if (data) for (const p of data.bracketPredictions) bracketPickByMatch.set(p.bracketMatchId, p);

  const playerByPositionSlot = new Map<string, PlayerSelection>();
  const playerByAward = new Map<PlayerAward, PlayerAwardSelection>();
  if (data) {
    for (const sel of data.playerSelections) playerByPositionSlot.set(`${sel.position}:${sel.slot}`, sel);
    for (const sel of data.playerAwardSelections || []) playerByAward.set(sel.award, sel);
  }

  const tabButton = (key: typeof tab, label: string) => {
    const selected = tab === key;
    return (
      <button
        key={key} type="button" role="tab" aria-selected={selected} onClick={() => setTab(key)}
        style={{
          flex: 1, padding: '0.5rem 0.75rem', border: '1px solid transparent',
          borderRadius: 'var(--radius-sm)',
          background: selected ? 'rgb(var(--pitch) / 0.12)' : 'rgb(var(--bg-subtle))',
          color: selected ? 'rgb(var(--fg))' : 'rgb(var(--fg-muted))',
          fontWeight: selected ? 700 : 600, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={userName ? labels.title(userName) : ''} description={labels.description} size="lg"
      footer={<Button variant="ghost" onClick={onClose}>{labels.close}</Button>}
    >
      <div role="tablist" style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
        {tabButton('groups', labels.tabs.groups)}
        {tabButton('final', labels.tabs.final)}
        {tabButton('players', labels.tabs.players)}
      </div>
      <div style={{ maxHeight: 'min(65vh, 540px)', overflowY: 'auto', paddingRight: '0.25rem' }}>
        {loading ? (
          <p style={{ color: 'rgb(var(--fg-muted))', textAlign: 'center', padding: '2rem 0' }}>{labels.loading}</p>
        ) : error ? (
          <p style={{ color: 'rgb(var(--live))', textAlign: 'center', padding: '2rem 0' }}>{error}</p>
        ) : !data ? null : tab === 'groups' ? (
          <SpyGroupsView data={data} groups={groups} matchesByGroup={matchesByGroup} predictionByMatch={predictionByMatch} labels={labels} locale={locale} />
        ) : tab === 'final' ? (
          <SpyFinalView bracketStructure={bracketStructure} bracketPickByMatch={bracketPickByMatch} labels={labels} />
        ) : (
          <SpyPlayersView tournamentPlayers={tournamentPlayers} playerByPositionSlot={playerByPositionSlot} playerByAward={playerByAward} labels={labels} />
        )}
      </div>
    </Modal>
  );
}

function SpyGroupsView({ data, groups, matchesByGroup, predictionByMatch, labels, locale }: Readonly<{
  data: SpyPicksData; groups: string[]; matchesByGroup: Record<string, Match[]>;
  predictionByMatch: Map<string, SpyPicksData['predictions'][number]>; labels: SpyPicksLabels; locale: string;
}>) {
  if (data.predictions.length === 0 && groups.length === 0) return <SpyEmpty text={labels.empty.predictions} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {groups.map((group) => {
        const matches = matchesByGroup[group] || [];
        return (
          <section key={group} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <header style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))' }}>
              {labels.groupLabel(group)}
            </header>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.35rem' }}>
              {matches.map((match) => {
                const pick = predictionByMatch.get(match.matchId);
                const hasPick = pick && typeof pick.homeScore === 'number' && typeof pick.awayScore === 'number';
                const hasResult = typeof match.homeResult === 'number' && typeof match.awayResult === 'number';
                const points = pick?.points ?? 0;
                const tone = pick?.isExactMatch === true ? 'rgb(var(--info))' : pick?.isCorrect === true ? 'rgb(var(--pitch))' : hasResult && hasPick ? 'rgb(var(--live))' : 'rgb(var(--fg-subtle))';
                const matchDate = new Date(match.scheduledAt).toLocaleString(locale, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                return (
                  <li key={match.matchId} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.55rem', padding: '0.55rem 0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgb(var(--fg-subtle))', fontWeight: 600 }}>
                      <span>{matchDate}</span>
                      {hasResult ? <span style={{ color: 'rgb(var(--fg-muted))' }}>{labels.ftLabel} {match.homeResult}-{match.awayResult}</span> : null}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--fg))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.homeTeamName}</span>
                    <span style={{ fontFamily: 'var(--font-display, inherit)', fontWeight: 800, fontSize: '0.95rem', color: tone, fontVariantNumeric: 'tabular-nums', textAlign: 'center', minWidth: '3.5rem' }}>
                      {hasPick ? `${pick.homeScore} – ${pick.awayScore}` : labels.noPick}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--fg))', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.awayTeamName}</span>
                    {hasPick && hasResult ? <div style={{ gridColumn: '1 / -1', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: tone }}>{points > 0 ? `+${points} ${labels.pointsLabel(points)}` : '0'}</div> : null}
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

function SpyFinalView({ bracketStructure, bracketPickByMatch, labels }: Readonly<{
  bracketStructure: Record<string, any[]>; bracketPickByMatch: Map<string, SpyBracketPrediction>; labels: SpyPicksLabels;
}>) {
  const phases = ['16th-finals', '8th-finals', 'quarter-finals', 'semi-finals', 'finals'];
  const hasAny = phases.some((p) => Array.isArray(bracketStructure[p]) && bracketStructure[p].length > 0);
  if (!hasAny) return <SpyEmpty text={labels.empty.bracket} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {phases.map((phase) => {
        const matches = (bracketStructure[phase] || []).slice().sort((a: any, b: any) => (a.matchNumber || 0) - (b.matchNumber || 0));
        if (matches.length === 0) return null;
        return (
          <section key={phase} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <header style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))' }}>{labels.bracketRoundLabel(phase)}</header>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.3rem' }}>
              {matches.map((match: any) => {
                const pick = bracketPickByMatch.get(match.bracketMatchId);
                const homeName = pick?.homeTeamName || '—';
                const awayName = pick?.awayTeamName || '—';
                const homeExact = pick?.homeTeamExactPosition === true;
                const homeWrong = pick?.homeTeamCorrectButWrongPosition === true;
                const awayExact = pick?.awayTeamExactPosition === true;
                const awayWrong = pick?.awayTeamCorrectButWrongPosition === true;
                const points = pick?.points ?? 0;
                return (
                  <li key={match.bracketMatchId} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.55rem', padding: '0.5rem 0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgb(var(--bg-elevated))', border: '1px solid rgb(var(--border))' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: pick?.homeTeamId ? 'rgb(var(--fg))' : 'rgb(var(--fg-subtle))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderLeft: homeExact ? '3px solid rgb(var(--info))' : homeWrong ? '3px solid rgb(var(--pitch))' : '3px solid transparent', paddingLeft: '0.4rem' }}>{homeName}</span>
                    <span aria-hidden style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgb(var(--fg-subtle))', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{labels.vs}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: pick?.awayTeamId ? 'rgb(var(--fg))' : 'rgb(var(--fg-subtle))', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', borderRight: awayExact ? '3px solid rgb(var(--info))' : awayWrong ? '3px solid rgb(var(--pitch))' : '3px solid transparent', paddingRight: '0.4rem' }}>{awayName}</span>
                    {points > 0 ? <div style={{ gridColumn: '1 / -1', textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: 'rgb(var(--gold))' }}>+{points}</div> : null}
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

function SpyPlayersView({ tournamentPlayers, playerByPositionSlot, playerByAward, labels }: Readonly<{
  tournamentPlayers: TournamentPlayer[]; playerByPositionSlot: Map<string, PlayerSelection>; playerByAward: Map<PlayerAward, PlayerAwardSelection>; labels: SpyPicksLabels;
}>) {
  const positions: PlayerPosition[] = ['goalkeeper', 'defender', 'midfielder', 'forward'];
  const anyPick = playerByAward.size > 0 || positions.some((p) => { for (let s = 1; s <= PLAYER_SELECTION_LIMIT; s += 1) if (playerByPositionSlot.has(`${p}:${s}`)) return true; return false; });
  if (tournamentPlayers.length > 0 && !anyPick) return <SpyEmpty text={labels.empty.players} />;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <header style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))' }}>
          {labels.awardLabel('golden_boot')} / {labels.awardLabel('tournament_mvp')}
        </header>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.35rem' }}>
          {PLAYER_AWARDS.map((award) => <SpyPlayerTile key={award.key} label={labels.awardLabel(award.key)} selection={playerByAward.get(award.key)} fallbackIcon={award.icon} />)}
        </ul>
      </section>
      {positions.map((position) => (
        <section key={position} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <header style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))' }}>{labels.positionLabel(position)}</header>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.35rem' }}>
            {Array.from({ length: PLAYER_SELECTION_LIMIT }, (_, idx) => {
              const slot = idx + 1;
              return <SpyPlayerTile key={`${position}:${slot}`} label={labels.slotLabel(slot)} selection={playerByPositionSlot.get(`${position}:${slot}`)} fallbackIcon={slot} />;
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SpyPlayerTile({ label, selection, fallbackIcon }: Readonly<{ label: string; selection?: PlayerSelection | PlayerAwardSelection; fallbackIcon: any }>) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.55rem', borderRadius: 'var(--radius-sm)', background: selection ? 'rgb(var(--bg-elevated))' : 'rgb(var(--bg-subtle))', border: '1px solid rgb(var(--border))' }}>
      <span aria-hidden style={{ width: '1.4rem', height: '1.4rem', borderRadius: '999px', background: 'rgb(var(--bg-subtle))', border: '1px solid rgb(var(--border))', display: 'inline-grid', placeItems: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'rgb(var(--fg-muted))' }}>
        {fallbackIcon}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: selection ? 'rgb(var(--fg))' : 'rgb(var(--fg-subtle))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selection?.name || label}
        </span>
      </span>
    </li>
  );
}

function SpyEmpty({ text }: Readonly<{ text: string }>) {
  return <p style={{ color: 'rgb(var(--fg-subtle))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>{text}</p>;
}

// ─── Ranking page ─────────────────────────────────────────────────────────────

export default function RankingPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const {
    ranking, spy, setSpy, handleStartSpy, isPastPoolDeadline,
    groups, matchesByGroup, bracket, players, poolDeadline,
    pool,
  } = usePoolContext();

  const prizeDistribution = resolvePrizeDistribution(pool);
  const memberCount = pool?.memberCount ?? (pool?.members ? pool.members.length : 0);
  const entryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;
  const totalPrizePool = (entryFee ?? 0) * memberCount;
  const prizeForRank = (rank: number) => totalPrizePool > 0 ? computePrize(totalPrizePool, prizeDistribution, rank) : 0;
  const formatCurrency = (amount: number) => formatEur(amount, locale);

  return (
    <div className="content-panel">
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
        tournamentPlayers={players}
        poolDeadline={poolDeadline}
        labels={{
          title: (name) => t('poolDetail.spy.title', { name }),
          description: t('poolDetail.spy.description'),
          close: t('poolDetail.spy.close'),
          loading: t('poolDetail.spy.loading'),
          tabs: { groups: t('poolDetail.spy.tabs.groups'), final: t('poolDetail.spy.tabs.final'), players: t('poolDetail.spy.tabs.players') },
          empty: { predictions: t('poolDetail.spy.empty.predictions'), bracket: t('poolDetail.spy.empty.bracket'), players: t('poolDetail.spy.empty.players') },
          noPick: t('poolDetail.spy.noPick'),
          groupLabel: (group) => t('poolDetail.spy.groupLabel', { group }),
          positionLabel: (p) => t(`poolDetail.players.positions.${p}`),
          awardLabel: (award) => t(`poolDetail.players.awards.${award === 'golden_boot' ? 'goldenBoot' : 'tournamentMvp'}`),
          bracketRoundLabel: (phase) => t(`bracket.round.${phaseShortKey(phase)}`),
          vs: t('bracket.vs'),
          slotLabel: (slot) => t('poolDetail.players.slotLabel', { slot }),
          pointsLabel: (n) => (n === 1 ? t('common.point') : t('common.points')),
          ftLabel: t('poolDetail.spy.ftLabel') || 'FT',
        }}
        locale={locale}
      />
    </div>
  );
}
