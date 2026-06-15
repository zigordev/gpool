'use client';

import { useLayoutEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useI18n } from '@/i18n/client';
import Select from 'react-select';
import ReactCountryFlag from 'react-country-flag';
import { usePoolContext, PLAYER_POSITIONS, PLAYER_AWARDS } from '@/contexts/PoolContext';
import { Input } from '@/components/ui/Input';
import { Section } from '@/components/ui/Section';
import { PlayerStatsTable } from '@/components/pool/PlayerStatsTable';
import { PlayerActionSummary } from '@/components/pool/PlayerActionSummary';
import { PointsBadge } from '@/components/PointsBadge';
import { countryDisplayName, countryIsoCode } from '@/lib/country-flags';
import { isPlayerStatEnabled } from '@/lib/player-stat-visibility';
import { selectStyles } from '@/lib/select-styles';
import { PlayerPosition } from '@/types/playerPosition.type';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';
import {
  PlayerScoringInfoSection,
  resolvePlayerInfoScoring,
} from '@/components/pool/PoolInfoSections';
import { PlayerSelectionStatistics } from '@/components/pool/PlayerSelectionStatistics';
import {
  PlayerInsightsModal,
  type PlayerInsightsTarget,
} from '@/components/pool/PlayerInsightsModal';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { PlayerShirt } from '@/components/pool/PlayerShirt';

type PlayerOption = {
  value: string;
  label: string;
  teamName: string;
  teamId: string;
  isDisabled: boolean;
};

export default function PlayersPage() {
  const { t, locale } = useI18n();
  const { setPoolActions } = useNavCenter();
  const {
    players,
    playerSelections,
    playerAwardSelections,
    savingPlayerSlot,
    playerSelectionLimits,
    isPastPoolDeadline,
    pool,
    poolId,
    handlePlayerSelection,
    handlePlayerAwardSelection,
  } = usePoolContext();
  const playerInfoScoring = useMemo(
    () => resolvePlayerInfoScoring(pool?.config?.playerScoring),
    [pool?.config?.playerScoring]
  );

  const [activeTab, setActiveTab] = useState<'selection' | 'all'>('selection');
  const [playerFilter, setPlayerFilter] = useState('');
  const [playerPositionFilter, setPlayerPositionFilter] = useState('');
  const [playerCountryFilter, setPlayerCountryFilter] = useState('');
  const [playerInsightsTarget, setPlayerInsightsTarget] = useState<PlayerInsightsTarget | null>(
    null
  );

  useLayoutEffect(() => {
    setPoolActions(
      <>
        <PlayerScoringInfoSection playerScoring={playerInfoScoring} />
        <PlayerSelectionStatistics poolId={poolId} visible={isPastPoolDeadline} />
      </>
    );
    return () => setPoolActions(null);
  }, [isPastPoolDeadline, playerInfoScoring, poolId, setPoolActions]);

  const insightCardProps = (target: PlayerInsightsTarget | null) => {
    if (!target || !isPastPoolDeadline) return {};
    return {
      role: 'button' as const,
      tabIndex: 0,
      onClick: (event: MouseEvent<HTMLElement>) => {
        if ((event.target as HTMLElement).closest('input, button, [role="combobox"]')) return;
        setPlayerInsightsTarget(target);
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setPlayerInsightsTarget(target);
        }
      },
    };
  };

  const lockedPlayerIdentity = (player: TournamentPlayer | null | undefined) =>
    player ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
        <PlayerShirt teamName={player.teamName} size={29} />
        <div style={{ display: 'grid', gap: '0.18rem', minWidth: 0 }}>
          <strong
            style={{
              color: 'rgb(var(--fg))',
              fontSize: '0.8rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {player.name}
          </strong>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.32rem',
              minWidth: 0,
              color: 'rgb(var(--fg-muted))',
              fontSize: '0.68rem',
              fontWeight: 650,
            }}
          >
            <ReactCountryFlag
              countryCode={countryIsoCode(player.teamName)}
              svg
              style={{ width: '1.25em', height: '1.25em', flexShrink: 0 }}
            />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {countryDisplayName(player.teamName, t)}
            </span>
          </span>
        </div>
      </div>
    ) : (
      <span style={{ color: 'rgb(var(--fg-subtle))', fontSize: '0.76rem', fontWeight: 650 }}>
        {t('poolDetail.players.emptySlot')}
      </span>
    );

  const countries = Array.from(
    players
      .reduce<Map<string, string>>((acc, player) => {
        if (player.teamId && !acc.has(player.teamId))
          acc.set(player.teamId, player.teamName || player.teamId);
        return acc;
      }, new Map())
      .entries()
  ).sort((a, b) => countryDisplayName(a[1], t).localeCompare(countryDisplayName(b[1], t), locale));

  const countryOptions = countries.map(([teamId, teamName]) => {
    const displayName = countryDisplayName(teamName, t);
    return {
      value: teamName,
      label: (
        <>
          <ReactCountryFlag
            countryCode={countryIsoCode(teamName)}
            svg
            style={{ width: '2em', height: '2em' }}
          />
          <span>{` ${displayName}`}</span>
        </>
      ),
      teamId,
      searchLabel: teamName,
      displayLabel: displayName,
    };
  });

  const positionOptions = [
    { value: 'goalkeeper', label: t('poolDetail.players.positions.goalkeeper') },
    { value: 'defender', label: t('poolDetail.players.positions.defender') },
    { value: 'midfielder', label: t('poolDetail.players.positions.midfielder') },
    { value: 'forward', label: t('poolDetail.players.positions.forward') },
  ];

  const filteredPlayers = players.filter((p) => {
    const nameMatch =
      !playerFilter.trim() || p.name.toLowerCase().includes(playerFilter.trim().toLowerCase());
    const positionMatch =
      !playerPositionFilter || p.position.toLowerCase() === playerPositionFilter;
    const countryMatch =
      !playerCountryFilter || p.teamName.toLowerCase() === playerCountryFilter.toLowerCase();
    return nameMatch && positionMatch && countryMatch;
  });

  if (players.length === 0) {
    return (
      <div
        className="content-panel"
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <p
          style={{
            color: 'rgb(var(--fg-muted))',
            fontSize: '0.875rem',
            textAlign: 'center',
            padding: '1.5rem',
            margin: 0,
          }}
        >
          {t('poolDetail.players.empty')}
        </p>
      </div>
    );
  }

  return (
    <div
      className="content-panel"
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
    >
      <div className="players-toolbar players-toolbar--tabs-only">
        <div className="players-tab-bar" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'selection'}
            className={`players-tab-btn${activeTab === 'selection' ? ' players-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('selection')}
          >
            {t('poolDetail.players.tabSelection')}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`players-tab-btn${activeTab === 'all' ? ' players-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            {t('poolDetail.players.tabAll')}
          </button>
        </div>
      </div>

      <section className="players-view-surface players-workspace">
        {activeTab === 'selection' && (
          <div className="players-selection-content">
            <div className="players-pitch-selection">
              <div className="players-pitch-board">
                <svg
                  className="players-pitch-lines"
                  aria-hidden
                  viewBox="0 0 1000 500"
                  preserveAspectRatio="none"
                >
                  <g
                    stroke="rgb(255 255 255 / 0.85)"
                    strokeWidth="2"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  >
                    <rect x="2" y="2" width="996" height="496" />
                    <line x1="500" y1="2" x2="500" y2="498" />
                    <circle cx="500" cy="250" r="60" />
                    <circle cx="500" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
                    <path d="M 2 120 H 160 V 380 H 2" />
                    <path d="M 2 190 H 60 V 310 H 2" />
                    <circle cx="100" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
                    <path d="M 160 200 A 50 50 0 0 1 160 300" />
                    <path d="M 998 120 H 840 V 380 H 998" />
                    <path d="M 998 190 H 940 V 310 H 998" />
                    <circle cx="900" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
                    <path d="M 840 200 A 50 50 0 0 0 840 300" />
                    <path d="M 2 22 Q 22 22 22 2" />
                    <path d="M 978 2 Q 978 22 998 22" />
                    <path d="M 2 478 Q 22 478 22 498" />
                    <path d="M 978 498 Q 978 478 998 478" />
                  </g>
                </svg>

                {(['left', 'right'] as const).map((side) => (
                  <div
                    key={side}
                    aria-hidden
                    className={`players-pitch-goal players-pitch-goal--${side}`}
                  />
                ))}

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {PLAYER_AWARDS.map((award) => {
                    const selected = playerAwardSelections[award.key];
                    const isSaving = savingPlayerSlot === `award:${award.key}`;
                    return (
                      <article
                        className="player-selection-card player-selection-card--award"
                        key={award.key}
                        {...insightCardProps(
                          selected
                            ? {
                                playerId: (selected as any).playerId,
                                selectionType: 'award',
                                award: award.key,
                              }
                            : null
                        )}
                        style={{
                          position: 'relative',
                          minWidth: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          padding: '0.45rem 0.5rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgb(var(--border) / 0.88)',
                          borderLeft: '3px solid rgb(var(--gold))',
                          background: 'rgb(var(--bg-elevated) / 0.94)',
                          boxShadow: '0 2px 8px rgb(15 23 42 / 0.07)',
                          opacity: isSaving ? 0.7 : 1,
                          transition: 'opacity 0.15s ease, background 0.15s ease',
                          marginBottom: '0.95rem',
                          cursor: selected && isPastPoolDeadline ? 'pointer' : undefined,
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: '2.15rem',
                            height: '2.15rem',
                            borderRadius: '999px',
                            display: 'grid',
                            placeItems: 'center',
                            border: '1px solid rgb(var(--gold) / 0.4)',
                            fontSize: '1.05rem',
                          }}
                        >
                          {selected?.imageUrl ? (
                            <img
                              src={selected.imageUrl}
                              alt=""
                              style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '999px',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            award.icon
                          )}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p
                            style={{
                              margin: '0 0 0.25rem',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: 'rgb(var(--fg))',
                            }}
                          >
                            {t(award.labelKey)}
                          </p>
                          {isPastPoolDeadline ? (
                            lockedPlayerIdentity(selected)
                          ) : (
                            <Select<PlayerOption, false>
                              options={players
                                .slice()
                                .sort(
                                  (a, b) =>
                                    a.teamName.localeCompare(b.teamName) ||
                                    a.name.localeCompare(b.name)
                                )
                                .map((player) => ({
                                  value: player.playerId,
                                  label: player.name,
                                  teamName: player.teamName,
                                  teamId: player.teamId,
                                  isDisabled: false,
                                }))}
                              value={
                                selected
                                  ? {
                                      value: (selected as any).playerId,
                                      label: selected.name,
                                      teamName: selected.teamName,
                                      teamId: selected.teamId,
                                      isDisabled: false,
                                    }
                                  : null
                              }
                              onChange={(option) =>
                                handlePlayerAwardSelection(award.key, option?.value ?? '')
                              }
                              isClearable
                              isDisabled={savingPlayerSlot !== null}
                              isLoading={isSaving}
                              placeholder={t(award.descriptionKey)}
                              formatOptionLabel={(option) => (
                                <span
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <PlayerShirt teamName={option.teamName} size={25} />
                                  <ReactCountryFlag
                                    countryCode={countryIsoCode(option.teamName)}
                                    svg
                                    style={{ width: '1.4em', height: '1.4em' }}
                                  />
                                  <span>{option.label}</span>
                                </span>
                              )}
                              filterOption={(option, inputValue) => {
                                const search = inputValue.toLowerCase();
                                return (
                                  option.data.label.toLowerCase().includes(search) ||
                                  option.data.teamName.toLowerCase().includes(search)
                                );
                              }}
                              menuPortalTarget={
                                typeof document !== 'undefined' ? document.body : undefined
                              }
                              styles={selectStyles({
                                control: (base, state) => ({
                                  ...base,
                                  fontSize: '0.78rem',
                                  minHeight: '1.8rem',
                                  backgroundColor: state.isDisabled
                                    ? 'rgb(var(--disabled-bg))'
                                    : 'rgb(var(--input-bg))',
                                  border: `1px solid rgb(var(--${state.isDisabled ? 'disabled-border' : 'control-border'}))`,
                                  cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: 1,
                                }),
                              })}
                            />
                          )}
                        </div>
                        {(selected as any)?.awardPoints ? (
                          <PointsBadge
                            points={(selected as any).awardPoints}
                            label={t('poolDetail.players.points', {
                              points: (selected as any).awardPoints,
                            })}
                          />
                        ) : null}
                      </article>
                    );
                  })}
                </div>

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                    gap: '0.75rem',
                    alignItems: 'stretch',
                  }}
                >
                  {PLAYER_POSITIONS.map(({ key: position, labelKey }) => (
                    <section
                      key={position}
                      style={{
                        display: 'grid',
                        gridTemplateRows: 'auto 1fr',
                        gap: '0.55rem',
                        minWidth: 0,
                      }}
                    >
                      <span
                        className="players-position-label"
                        style={{
                          display: 'inline-flex',
                          alignSelf: 'center',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.2rem 0.15rem 0.3rem',
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'rgb(var(--fg-muted))',
                          borderBottom: '2px solid rgb(var(--pitch) / 0.55)',
                          whiteSpace: 'nowrap',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={t(labelKey)}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '999px',
                            background: 'rgb(var(--pitch))',
                            flexShrink: 0,
                          }}
                        />
                        <span className="md-only" style={{ display: 'inline' }}>
                          {t(labelKey)}
                        </span>
                      </span>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          gap: '0.55rem',
                          minWidth: 0,
                        }}
                      >
                        {Array.from({ length: playerSelectionLimits[position] }, (_, index) => {
                          const slot = index + 1;
                          const selectionKey = `${position}:${slot}`;
                          const selected = playerSelections[selectionKey];
                          const isSaving = savingPlayerSlot === selectionKey;
                          const takenTeamIds = new Set(
                            Object.entries(playerSelections)
                              .filter(([key]) => key !== selectionKey)
                              .map(([, value]) => value.teamId)
                          );
                          const slotOptions: PlayerOption[] = players
                            .filter((p) => p.position === position)
                            .sort(
                              (a, b) =>
                                a.teamName.localeCompare(b.teamName) || a.name.localeCompare(b.name)
                            )
                            .map((player) => ({
                              value: player.playerId,
                              label: player.name,
                              teamName: player.teamName,
                              teamId: player.teamId,
                              isDisabled: takenTeamIds.has(player.teamId),
                            }));
                          const selectedOption = selected
                            ? (slotOptions.find((o) => o.value === selected.playerId) ?? {
                                value: selected.playerId,
                                label: selected.name,
                                teamName: selected.teamName,
                                teamId: selected.teamId,
                                isDisabled: false,
                              })
                            : null;
                          return (
                            <article
                              className="player-selection-card"
                              key={selectionKey}
                              {...insightCardProps(
                                selected
                                  ? { playerId: selected.playerId, selectionType: 'position' }
                                  : null
                              )}
                              style={{
                                position: 'relative',
                                minWidth: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                padding: '0.45rem 0.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgb(var(--border) / 0.88)',
                                borderLeft: '3px solid rgb(var(--pitch))',
                                background: 'rgb(var(--bg-elevated) / 0.94)',
                                boxShadow: '0 2px 8px rgb(15 23 42 / 0.07)',
                                opacity: isSaving ? 0.7 : 1,
                                transition: 'opacity 0.15s ease, background 0.15s ease',
                                cursor: selected && isPastPoolDeadline ? 'pointer' : undefined,
                              }}
                            >
                              {selected && isPastPoolDeadline && selected.totalPoints ? (
                                <PointsBadge
                                  points={selected.totalPoints}
                                  label={t('poolDetail.players.points', {
                                    points: selected.totalPoints,
                                  })}
                                />
                              ) : null}
                              {selected?.imageUrl ? (
                                <div
                                  style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '999px',
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    border: '1px solid rgb(var(--pitch) / 0.50)',
                                  }}
                                >
                                  <img
                                    src={selected.imageUrl}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  />
                                </div>
                              ) : null}
                              <div
                                style={{
                                  minWidth: 0,
                                  flex: 1,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.3rem',
                                }}
                              >
                                {isPastPoolDeadline ? (
                                  lockedPlayerIdentity(selected)
                                ) : (
                                  <Select<PlayerOption, false>
                                    options={slotOptions}
                                    value={selectedOption}
                                    onChange={(option) =>
                                      handlePlayerSelection(position, slot, option?.value ?? '')
                                    }
                                    isClearable
                                    isDisabled={savingPlayerSlot !== null}
                                    isLoading={isSaving}
                                    placeholder={t('poolDetail.players.slotLabel', { slot })}
                                    formatOptionLabel={(option) => (
                                      <span
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                        }}
                                      >
                                        <PlayerShirt teamName={option.teamName} size={25} />
                                        <ReactCountryFlag
                                          countryCode={countryIsoCode(option.teamName)}
                                          svg
                                          style={{ width: '1.4em', height: '1.4em' }}
                                        />
                                        <span>{option.label}</span>
                                      </span>
                                    )}
                                    filterOption={(option, inputValue) => {
                                      const search = inputValue.toLowerCase();
                                      return (
                                        option.data.label.toLowerCase().includes(search) ||
                                        option.data.teamName.toLowerCase().includes(search)
                                      );
                                    }}
                                    menuPortalTarget={
                                      typeof document !== 'undefined' ? document.body : undefined
                                    }
                                    styles={selectStyles({
                                      control: (base, state) => ({
                                        ...base,
                                        fontSize: '0.74rem',
                                        minHeight: '1.8rem',
                                        backgroundColor: state.isDisabled
                                          ? 'rgb(var(--disabled-bg))'
                                          : 'rgb(var(--input-bg))',
                                        border: `1px solid rgb(var(--${state.isDisabled ? 'disabled-border' : 'control-border'}))`,
                                        cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                                        opacity: 1,
                                      }),
                                    })}
                                  />
                                )}
                                <PlayerActionSummary
                                  player={
                                    selected ?? {
                                      goals: 0,
                                      penaltyGoals: 0,
                                      missedPenalties: 0,
                                      mvps: 0,
                                      penaltiesSaved: 0,
                                      shootoutPenaltiesSaved: 0,
                                      shootoutGoals: 0,
                                      shootoutMissedPenalties: 0,
                                      cleanSheets: 0,
                                      assists: 0,
                                      yellowCards: 0,
                                      redCards: 0,
                                    }
                                  }
                                  labels={{
                                    goals: t('poolDetail.players.actions.goals'),
                                    penaltyGoals: t('poolDetail.players.actions.penaltyGoals'),
                                    missedPenalties: t(
                                      'poolDetail.players.actions.missedPenalties'
                                    ),
                                    mvps: t('poolDetail.players.actions.mvps'),
                                    penaltiesSaved: t('poolDetail.players.actions.penaltiesSaved'),
                                    shootoutPenaltiesSaved: t(
                                      'poolDetail.players.actions.shootoutPenaltiesSaved'
                                    ),
                                    shootoutGoals: t('poolDetail.players.actions.shootoutGoals'),
                                    shootoutMissedPenalties: t(
                                      'poolDetail.players.actions.shootoutMissedPenalties'
                                    ),
                                    cleanSheets: t('poolDetail.players.actions.cleanSheets'),
                                    assists: t('poolDetail.players.actions.assists'),
                                    yellowCards: t('poolDetail.players.actions.yellowCards'),
                                    redCards: t('poolDetail.players.actions.redCards'),
                                  }}
                                  position={position}
                                  scoring={playerInfoScoring}
                                />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
            <div className="players-mobile-selection-list">
              <Section
                title={t('poolDetail.players.awards.individual')}
                collapsible
                defaultExpanded
                density="compact"
                tone="plain"
                contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
                style={{ padding: '0.55rem 0.1rem 0.7rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {PLAYER_AWARDS.map((award) => {
                    const selected = playerAwardSelections[award.key];
                    const isSaving = savingPlayerSlot === `award:${award.key}`;
                    return (
                      <article
                        className="player-selection-card player-selection-card--award"
                        key={award.key}
                        {...insightCardProps(
                          selected
                            ? {
                                playerId: (selected as any).playerId,
                                selectionType: 'award',
                                award: award.key,
                              }
                            : null
                        )}
                        style={{
                          position: 'relative',
                          minWidth: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.55rem',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgb(var(--border) / 0.82)',
                          borderLeft: '3px solid rgb(var(--gold))',
                          background: 'rgb(var(--bg-elevated) / 0.82)',
                          opacity: isSaving ? 0.7 : 1,
                          cursor: selected && isPastPoolDeadline ? 'pointer' : undefined,
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: '2.1rem',
                            height: '2.1rem',
                            borderRadius: '999px',
                            display: 'grid',
                            placeItems: 'center',
                            border: '1px solid rgb(var(--gold) / 0.4)',
                            fontSize: '1.05rem',
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          {selected?.imageUrl ? (
                            <img
                              src={selected.imageUrl}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            award.icon
                          )}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p
                            style={{
                              margin: '0 0 0.3rem',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: 'rgb(var(--fg))',
                            }}
                          >
                            {t(award.labelKey)}
                          </p>
                          {isPastPoolDeadline ? (
                            lockedPlayerIdentity(selected)
                          ) : (
                            <Select<PlayerOption, false>
                              options={players
                                .slice()
                                .sort(
                                  (a, b) =>
                                    a.teamName.localeCompare(b.teamName) ||
                                    a.name.localeCompare(b.name)
                                )
                                .map((player) => ({
                                  value: player.playerId,
                                  label: player.name,
                                  teamName: player.teamName,
                                  teamId: player.teamId,
                                  isDisabled: false,
                                }))}
                              value={
                                selected
                                  ? {
                                      value: (selected as any).playerId,
                                      label: selected.name,
                                      teamName: selected.teamName,
                                      teamId: selected.teamId,
                                      isDisabled: false,
                                    }
                                  : null
                              }
                              onChange={(option) =>
                                handlePlayerAwardSelection(award.key, option?.value ?? '')
                              }
                              isClearable
                              isDisabled={savingPlayerSlot !== null}
                              isLoading={isSaving}
                              placeholder={t(award.descriptionKey)}
                              formatOptionLabel={(option) => (
                                <span
                                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                >
                                  <PlayerShirt teamName={option.teamName} size={25} />
                                  <ReactCountryFlag
                                    countryCode={countryIsoCode(option.teamName)}
                                    svg
                                    style={{ width: '1.4em', height: '1.4em' }}
                                  />
                                  <span>{option.label}</span>
                                </span>
                              )}
                              filterOption={(option, inputValue) => {
                                const search = inputValue.toLowerCase();
                                return (
                                  option.data.label.toLowerCase().includes(search) ||
                                  option.data.teamName.toLowerCase().includes(search)
                                );
                              }}
                              menuPortalTarget={
                                typeof document !== 'undefined' ? document.body : undefined
                              }
                              styles={selectStyles({
                                control: (base, state) => ({
                                  ...base,
                                  fontSize: '0.78rem',
                                  minHeight: '1.9rem',
                                  backgroundColor: state.isDisabled
                                    ? 'rgb(var(--disabled-bg))'
                                    : 'rgb(var(--input-bg))',
                                  border: `1px solid rgb(var(--${state.isDisabled ? 'disabled-border' : 'control-border'}))`,
                                  cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                                  opacity: 1,
                                }),
                              })}
                            />
                          )}
                        </div>
                        {(selected as any)?.awardPoints ? (
                          <PointsBadge
                            points={(selected as any).awardPoints}
                            label={t('poolDetail.players.points', {
                              points: (selected as any).awardPoints,
                            })}
                          />
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </Section>

              {PLAYER_POSITIONS.map(({ key: position, labelKey }) => (
                <Section
                  key={position}
                  title={t(labelKey)}
                  collapsible
                  defaultExpanded
                  density="compact"
                  tone="plain"
                  contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
                  style={{ padding: '0.55rem 0.1rem 0.7rem' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Array.from({ length: playerSelectionLimits[position] }, (_, index) => {
                      const slot = index + 1;
                      const selectionKey = `${position}:${slot}`;
                      const selected = playerSelections[selectionKey];
                      const isSaving = savingPlayerSlot === selectionKey;
                      const takenTeamIds = new Set(
                        Object.entries(playerSelections)
                          .filter(([key]) => key !== selectionKey)
                          .map(([, value]) => value.teamId)
                      );
                      const slotOptions: PlayerOption[] = players
                        .filter((p) => p.position === position)
                        .sort(
                          (a, b) =>
                            a.teamName.localeCompare(b.teamName) || a.name.localeCompare(b.name)
                        )
                        .map((player) => ({
                          value: player.playerId,
                          label: player.name,
                          teamName: player.teamName,
                          teamId: player.teamId,
                          isDisabled: takenTeamIds.has(player.teamId),
                        }));
                      const selectedOption = selected
                        ? (slotOptions.find((o) => o.value === selected.playerId) ?? {
                            value: selected.playerId,
                            label: selected.name,
                            teamName: selected.teamName,
                            teamId: selected.teamId,
                            isDisabled: false,
                          })
                        : null;
                      return (
                        <article
                          className="player-selection-card"
                          key={selectionKey}
                          {...insightCardProps(
                            selected
                              ? { playerId: selected.playerId, selectionType: 'position' }
                              : null
                          )}
                          style={{
                            position: 'relative',
                            minWidth: 0,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.5rem',
                            padding: '0.55rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border) / 0.82)',
                            borderLeft: '3px solid rgb(var(--pitch))',
                            background: 'rgb(var(--bg-elevated) / 0.82)',
                            opacity: isSaving ? 0.7 : 1,
                            cursor: selected && isPastPoolDeadline ? 'pointer' : undefined,
                          }}
                        >
                          {selected && isPastPoolDeadline && selected.totalPoints ? (
                            <PointsBadge
                              points={selected.totalPoints}
                              label={t('poolDetail.players.points', {
                                points: selected.totalPoints,
                              })}
                            />
                          ) : null}
                          {selected?.imageUrl ? (
                            <div
                              style={{
                                width: '2rem',
                                height: '2rem',
                                borderRadius: '999px',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1px solid rgb(var(--pitch) / 0.50)',
                              }}
                            >
                              <img
                                src={selected.imageUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </div>
                          ) : null}
                          <div
                            style={{
                              minWidth: 0,
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.3rem',
                            }}
                          >
                            {isPastPoolDeadline ? (
                              lockedPlayerIdentity(selected)
                            ) : (
                              <Select<PlayerOption, false>
                                options={slotOptions}
                                value={selectedOption}
                                onChange={(option) =>
                                  handlePlayerSelection(position, slot, option?.value ?? '')
                                }
                                isClearable
                                isDisabled={savingPlayerSlot !== null}
                                isLoading={isSaving}
                                placeholder={t('poolDetail.players.slotLabel', { slot })}
                                formatOptionLabel={(option) => (
                                  <span
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                  >
                                    <PlayerShirt teamName={option.teamName} size={25} />
                                    <ReactCountryFlag
                                      countryCode={countryIsoCode(option.teamName)}
                                      svg
                                      style={{ width: '1.4em', height: '1.4em' }}
                                    />
                                    <span>{option.label}</span>
                                  </span>
                                )}
                                filterOption={(option, inputValue) => {
                                  const search = inputValue.toLowerCase();
                                  return (
                                    option.data.label.toLowerCase().includes(search) ||
                                    option.data.teamName.toLowerCase().includes(search)
                                  );
                                }}
                                menuPortalTarget={
                                  typeof document !== 'undefined' ? document.body : undefined
                                }
                                styles={selectStyles({
                                  control: (base, state) => ({
                                    ...base,
                                    fontSize: '0.78rem',
                                    minHeight: '1.9rem',
                                    backgroundColor: state.isDisabled
                                      ? 'rgb(var(--disabled-bg))'
                                      : 'rgb(var(--input-bg))',
                                    border: `1px solid rgb(var(--${state.isDisabled ? 'disabled-border' : 'control-border'}))`,
                                    cursor: state.isDisabled ? 'not-allowed' : 'pointer',
                                    opacity: 1,
                                  }),
                                })}
                              />
                            )}
                            <PlayerActionSummary
                              player={
                                selected ?? {
                                  goals: 0,
                                  penaltyGoals: 0,
                                  missedPenalties: 0,
                                  mvps: 0,
                                  penaltiesSaved: 0,
                                  shootoutPenaltiesSaved: 0,
                                  shootoutGoals: 0,
                                  shootoutMissedPenalties: 0,
                                  cleanSheets: 0,
                                  assists: 0,
                                  yellowCards: 0,
                                  redCards: 0,
                                }
                              }
                              labels={{
                                goals: t('poolDetail.players.actions.goals'),
                                penaltyGoals: t('poolDetail.players.actions.penaltyGoals'),
                                missedPenalties: t('poolDetail.players.actions.missedPenalties'),
                                mvps: t('poolDetail.players.actions.mvps'),
                                penaltiesSaved: t('poolDetail.players.actions.penaltiesSaved'),
                                shootoutPenaltiesSaved: t(
                                  'poolDetail.players.actions.shootoutPenaltiesSaved'
                                ),
                                shootoutGoals: t('poolDetail.players.actions.shootoutGoals'),
                                shootoutMissedPenalties: t(
                                  'poolDetail.players.actions.shootoutMissedPenalties'
                                ),
                                cleanSheets: t('poolDetail.players.actions.cleanSheets'),
                                assists: t('poolDetail.players.actions.assists'),
                                yellowCards: t('poolDetail.players.actions.yellowCards'),
                                redCards: t('poolDetail.players.actions.redCards'),
                              }}
                              position={position}
                              scoring={playerInfoScoring}
                            />
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </Section>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'all' && (
          <div
            className="players-all-content"
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <PlayerStatsTable
              players={filteredPlayers}
              goldenBootPlayerIds={
                playerAwardSelections.golden_boot
                  ? [(playerAwardSelections.golden_boot as any).playerId]
                  : []
              }
              tournamentMvpPlayerId={(playerAwardSelections.tournament_mvp as any)?.playerId ?? ''}
              computeTotal={(p) => p.totalPoints ?? 0}
              t={t}
              isStatVisible={(player, stat) =>
                isPlayerStatEnabled(playerInfoScoring, player.position, stat)
              }
              toolbar={
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.6rem',
                    alignItems: 'center',
                  }}
                >
                  <Input
                    type="search"
                    value={playerFilter}
                    onChange={(e) => setPlayerFilter(e.target.value)}
                    placeholder={t('adminResults.players.searchPlaceholder')}
                    aria-label={t('adminResults.players.searchPlaceholder')}
                  />
                  <Select<{ value: string; label: string }, false>
                    isClearable
                    placeholder={t('adminResults.players.positionAll')}
                    value={positionOptions.find((o) => o.value === playerPositionFilter) ?? null}
                    options={positionOptions}
                    onChange={(option) => setPlayerPositionFilter(option?.value ?? '')}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    styles={selectStyles()}
                  />
                  <Select<
                    {
                      value: string;
                      label: React.ReactNode;
                      searchLabel: string;
                      displayLabel: string;
                    },
                    false
                  >
                    isClearable
                    getOptionLabel={(option) => option.displayLabel}
                    formatOptionLabel={(option) => option.label}
                    placeholder={t('adminResults.players.countryAll')}
                    value={countryOptions.find((o) => o.value === playerCountryFilter) ?? null}
                    options={countryOptions}
                    onChange={(option) => setPlayerCountryFilter(option?.value ?? '')}
                    filterOption={(option, inputValue) => {
                      const search = inputValue.toLowerCase();
                      return (
                        option.data.displayLabel.toLowerCase().includes(search) ||
                        option.data.searchLabel.toLowerCase().includes(search)
                      );
                    }}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    styles={selectStyles()}
                  />
                </div>
              }
            />
          </div>
        )}
      </section>
      <PlayerInsightsModal
        poolId={poolId}
        target={playerInsightsTarget}
        onClose={() => setPlayerInsightsTarget(null)}
        playerScoring={playerInfoScoring}
      />
    </div>
  );
}
