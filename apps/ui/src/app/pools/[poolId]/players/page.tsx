'use client';

import { useI18n } from '@/i18n/client';
import Select from 'react-select';
import ReactCountryFlag from 'react-country-flag';
import { usePoolContext, PLAYER_POSITIONS, PLAYER_AWARDS, PLAYER_SELECTION_LIMIT } from '@/contexts/PoolContext';
import { PlayerStatsTable } from '@/components/pool/PlayerStatsTable';
import { PointsBadge } from '@/components/PointsBadge';
import { countryIsoCode } from '@/lib/country-flags';
import { FaFutbol, FaMagic, FaStar, FaShieldAlt } from 'react-icons/fa';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { PiBoxingGlove } from 'react-icons/pi';
import { TournamentPlayer } from '@/types/tournamentPlayer.interface';

type PlayerOption = { value: string; label: string; teamName: string; teamId: string; isDisabled: boolean };

function PlayerActionSummary({ player, labels }: Readonly<{
  player: Pick<TournamentPlayer, 'goals' | 'missedPenalties' | 'mvps' | 'penaltiesSaved' | 'cleanSheets' | 'assists' | 'yellowCards' | 'redCards'>;
  labels: { goals: string; missedPenalties: string; mvps: string; penaltiesSaved: string; cleanSheets: string; assists: string; yellowCards: string; redCards: string };
}>) {
  const actions = [
    { key: 'goals', value: player.goals || 0, label: labels.goals, icon: <FaFutbol style={{ color: 'black' }} size="17" /> },
    { key: 'assists', value: player.assists || 0, label: labels.assists, icon: <FaMagic style={{ color: 'black' }} size="17" /> },
    { key: 'mvps', value: player.mvps || 0, label: labels.mvps, icon: <FaStar style={{ color: 'black' }} size="17" /> },
    { key: 'penaltiesSaved', value: player.penaltiesSaved || 0, label: labels.penaltiesSaved, icon: <PiBoxingGlove style={{ color: 'black' }} size="17" /> },
    { key: 'cleanSheets', value: player.cleanSheets || 0, label: labels.cleanSheets, icon: <FaShieldAlt style={{ color: 'black' }} size="17" /> },
    { key: 'yellowCards', value: player.yellowCards || 0, label: labels.yellowCards, icon: <LuRectangleVertical style={{ color: 'yellow', fill: 'yellow' }} size="17" /> },
    { key: 'redCards', value: player.redCards || 0, label: labels.redCards, icon: <LuRectangleVertical style={{ color: 'red', fill: 'red' }} size="17" /> },
    { key: 'missedPenalties', value: player.missedPenalties || 0, label: labels.missedPenalties, icon: <IoMdCloseCircle style={{ color: 'red' }} size="17" /> },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.22rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
      {actions.map((item) => {
        const isZero = item.value === 0;
        return (
          <span key={item.key} title={`${item.label}: ${item.value}`} aria-label={`${item.label}: ${item.value}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.18rem', padding: '0.1rem 0.32rem', borderRadius: '999px', background: isZero ? 'transparent' : 'rgb(var(--bg-subtle) / 0.92)', border: isZero ? '1px dashed rgb(var(--border-subtle))' : '1px solid rgb(var(--border-subtle))', color: isZero ? 'rgb(var(--fg-subtle))' : 'rgb(var(--fg))', opacity: isZero ? 0.5 : 1, fontSize: '0.6rem', fontWeight: 800, lineHeight: 1 }}
          >
            {item.icon}
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function PlayersPage() {
  const { t } = useI18n();
  const {
    players, playerSelections, playerAwardSelections, savingPlayerSlot,
    isPastPoolDeadline, handlePlayerSelection, handlePlayerAwardSelection,
  } = usePoolContext();

  if (players.length === 0) {
    return (
      <div className="content-panel">
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
          {t('poolDetail.players.empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="content-panel">
      <div style={{ overflowX: 'auto', overflowY: 'visible', margin: '0 -0.25rem', padding: '0 0.25rem' }}>
        <div style={{ position: 'relative', minWidth: 720, margin: '0.25rem 1.75rem', padding: '1rem 0.85rem', borderRadius: 'var(--radius-lg)', border: '2px solid rgb(255 255 255 / 0.85)', background: 'repeating-linear-gradient(90deg, rgb(var(--pitch) / 0.16) 0 60px, rgb(var(--pitch) / 0.10) 60px 120px), linear-gradient(180deg, rgb(var(--pitch) / 0.18), rgb(var(--pitch) / 0.10))', boxShadow: '0 12px 36px rgb(15 23 42 / 0.10)' }}>
          <svg aria-hidden viewBox="0 0 1000 500" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <g stroke="rgb(255 255 255 / 0.85)" strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke">
              <line x1="500" y1="0" x2="500" y2="500" />
              <circle cx="500" cy="250" r="60" />
              <circle cx="500" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
              <rect x="0" y="120" width="160" height="260" />
              <rect x="0" y="190" width="60" height="120" />
              <circle cx="100" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
              <path d="M 160 200 A 50 50 0 0 1 160 300" />
              <rect x="840" y="120" width="160" height="260" />
              <rect x="940" y="190" width="60" height="120" />
              <circle cx="900" cy="250" r="3" fill="rgb(255 255 255 / 0.85)" />
              <path d="M 840 200 A 50 50 0 0 0 840 300" />
              <path d="M 0 14 A 14 14 0 0 1 14 0" />
              <path d="M 1000 14 A 14 14 0 0 0 986 0" />
              <path d="M 0 486 A 14 14 0 0 0 14 500" />
              <path d="M 1000 486 A 14 14 0 0 0 986 500" />
            </g>
          </svg>

          {(['left', 'right'] as const).map((side) => (
            <div key={side} aria-hidden style={{ position: 'absolute', top: '50%', [side]: '-1.4rem', transform: 'translateY(-50%)', width: '1.3rem', height: '36%', background: 'repeating-linear-gradient(0deg, rgb(255 255 255 / 0.40) 0 1px, transparent 1px 6px), repeating-linear-gradient(90deg, rgb(255 255 255 / 0.40) 0 1px, transparent 1px 6px)', border: '2px solid rgb(255 255 255 / 0.85)', ...(side === 'left' ? { borderRight: 'none', borderTopLeftRadius: 4, borderBottomLeftRadius: 4 } : { borderLeft: 'none', borderTopRightRadius: 4, borderBottomRightRadius: 4 }) }} />
          ))}

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
            {PLAYER_AWARDS.map((award) => {
              const selected = playerAwardSelections[award.key];
              const isSaving = savingPlayerSlot === `award:${award.key}`;
              return (
                <article key={award.key} style={{ position: 'relative', minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(255 255 255 / 0.55)', borderTop: '3px solid rgb(var(--gold))', background: 'rgb(var(--bg-elevated) / 0.62)', backdropFilter: 'blur(6px) saturate(120%)', WebkitBackdropFilter: 'blur(6px) saturate(120%)', boxShadow: '0 4px 14px rgb(15 23 42 / 0.10)', opacity: isSaving ? 0.7 : 1, transition: 'opacity 0.15s ease, background 0.15s ease', marginBottom: '0.95rem' }}>
                  <span aria-hidden style={{ width: '2.15rem', height: '2.15rem', borderRadius: '999px', display: 'grid', placeItems: 'center', border: '1px solid rgb(var(--gold) / 0.4)', fontSize: '1.05rem' }}>
                    {selected?.imageUrl ? <img src={selected.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '999px', objectFit: 'cover' }} /> : award.icon}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: '0 0 0.25rem', fontSize: '0.78rem', fontWeight: 800, color: 'rgb(var(--fg))' }}>{t(award.labelKey)}</p>
                    <Select<PlayerOption, false>
                      options={players.slice().sort((a, b) => a.teamName.localeCompare(b.teamName) || a.name.localeCompare(b.name)).map((player) => ({ value: player.playerId, label: player.name, teamName: player.teamName, teamId: player.teamId, isDisabled: false }))}
                      value={selected ? { value: (selected as any).playerId, label: selected.name, teamName: selected.teamName, teamId: selected.teamId, isDisabled: false } : null}
                      onChange={(option) => handlePlayerAwardSelection(award.key, option?.value ?? '')}
                      isClearable
                      isDisabled={savingPlayerSlot !== null || isPastPoolDeadline}
                      isLoading={isSaving}
                      placeholder={t(award.descriptionKey)}
                      formatOptionLabel={(option) => (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <ReactCountryFlag countryCode={countryIsoCode(option.teamName)} svg style={{ width: '1.4em', height: '1.4em' }} />
                          <span>{option.label}</span>
                        </span>
                      )}
                      filterOption={(option, inputValue) => { const search = inputValue.toLowerCase(); return option.data.label.toLowerCase().includes(search) || option.data.teamName.toLowerCase().includes(search); }}
                      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                      styles={{ control: (base) => ({ ...base, fontSize: '0.78rem', minHeight: '1.8rem', backgroundColor: 'rgb(var(--bg-elevated) / 0.8)', border: '1px solid rgb(var(--border))', cursor: savingPlayerSlot !== null || isPastPoolDeadline ? 'not-allowed' : 'pointer', opacity: savingPlayerSlot !== null || isPastPoolDeadline ? 0.7 : 1 }), menu: (base) => ({ ...base, zIndex: 9999 }), menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                    />
                  </div>
                  {(selected as any)?.awardPoints ? <PointsBadge points={(selected as any).awardPoints} label={t('poolDetail.players.points', { points: (selected as any).awardPoints })} /> : null}
                </article>
              );
            })}
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.75rem' }}>
            {PLAYER_POSITIONS.map(({ key: position, labelKey }) => (
              <section key={position} style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', minWidth: 0 }}>
                <span style={{ display: 'inline-flex', alignSelf: 'center', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.6rem', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--pitch))', background: 'rgb(var(--bg-elevated) / 0.95)', border: '1px solid rgb(var(--pitch) / 0.50)', borderRadius: '999px', boxShadow: '0 2px 6px rgb(15 23 42 / 0.06)', whiteSpace: 'nowrap', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t(labelKey)}>
                  <span aria-hidden style={{ width: 6, height: 6, borderRadius: '999px', background: 'rgb(var(--pitch))', flexShrink: 0 }} />
                  <span className="md-only" style={{ display: 'inline' }}>{t(labelKey)}</span>
                </span>
                {Array.from({ length: PLAYER_SELECTION_LIMIT }, (_, index) => {
                  const slot = index + 1;
                  const selectionKey = `${position}:${slot}`;
                  const selected = playerSelections[selectionKey];
                  const isSaving = savingPlayerSlot === selectionKey;
                  const takenTeamIds = new Set(Object.entries(playerSelections).filter(([key]) => key !== selectionKey).map(([, value]) => value.teamId));
                  const slotOptions: PlayerOption[] = players.filter((p) => p.position === position).sort((a, b) => a.teamName.localeCompare(b.teamName) || a.name.localeCompare(b.name)).map((player) => ({ value: player.playerId, label: player.name, teamName: player.teamName, teamId: player.teamId, isDisabled: takenTeamIds.has(player.teamId) }));
                  const selectedOption = selected ? slotOptions.find((o) => o.value === selected.playerId) ?? { value: selected.playerId, label: selected.name, teamName: selected.teamName, teamId: selected.teamId, isDisabled: false } : null;
                  return (
                    <article key={selectionKey} style={{ position: 'relative', minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(255 255 255 / 0.55)', borderTop: '3px solid rgb(var(--pitch))', background: 'rgb(var(--bg-elevated) / 0.62)', backdropFilter: 'blur(6px) saturate(120%)', WebkitBackdropFilter: 'blur(6px) saturate(120%)', boxShadow: '0 4px 14px rgb(15 23 42 / 0.10)', opacity: isSaving ? 0.7 : 1, transition: 'opacity 0.15s ease, background 0.15s ease' }}>
                      {selected && isPastPoolDeadline && selected.totalPoints ? <PointsBadge points={selected.totalPoints} label={t('poolDetail.players.points', { points: selected.totalPoints })} /> : null}
                      <div style={{ width: '2rem', height: '2rem', borderRadius: '999px', overflow: 'hidden', display: 'grid', placeItems: 'center', flexShrink: 0, background: 'rgb(var(--pitch) / 0.18)', border: '1px solid rgb(var(--pitch) / 0.50)', color: 'rgb(var(--pitch))', fontSize: '0.7rem', fontWeight: 800 }}>
                        {selected?.imageUrl ? <img src={selected.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : selected?.name ? selected.name.slice(0, 2).toUpperCase() : slot}
                      </div>
                      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <Select<PlayerOption, false>
                          options={slotOptions}
                          value={selectedOption}
                          onChange={(option) => handlePlayerSelection(position, slot, option?.value ?? '')}
                          isClearable
                          isDisabled={savingPlayerSlot !== null || isPastPoolDeadline}
                          isLoading={isSaving}
                          placeholder={t('poolDetail.players.slotLabel', { slot })}
                          formatOptionLabel={(option) => (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <ReactCountryFlag countryCode={countryIsoCode(option.teamName)} svg style={{ width: '1.4em', height: '1.4em' }} />
                              <span>{option.label}</span>
                            </span>
                          )}
                          filterOption={(option, inputValue) => { const search = inputValue.toLowerCase(); return option.data.label.toLowerCase().includes(search) || option.data.teamName.toLowerCase().includes(search); }}
                          menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                          styles={{ control: (base) => ({ ...base, fontSize: '0.74rem', minHeight: '1.8rem', backgroundColor: 'rgb(var(--bg-elevated) / 0.8)', border: '1px solid rgb(var(--border))', cursor: savingPlayerSlot !== null || isPastPoolDeadline ? 'not-allowed' : 'pointer', opacity: savingPlayerSlot !== null || isPastPoolDeadline ? 0.7 : 1 }), menu: (base) => ({ ...base, zIndex: 9999 }), menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                        />
                        {selected ? (
                          <PlayerActionSummary
                            player={selected}
                            labels={{ goals: t('poolDetail.players.actions.goals'), missedPenalties: t('poolDetail.players.actions.missedPenalties'), mvps: t('poolDetail.players.actions.mvps'), penaltiesSaved: t('poolDetail.players.actions.penaltiesSaved'), cleanSheets: t('poolDetail.players.actions.cleanSheets'), assists: t('poolDetail.players.actions.assists'), yellowCards: t('poolDetail.players.actions.yellowCards'), redCards: t('poolDetail.players.actions.redCards') }}
                          />
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </section>
            ))}
          </div>
        </div>
      </div>
      <PlayerStatsTable
        players={players}
        goldenBootPlayerIds={playerAwardSelections.golden_boot ? [(playerAwardSelections.golden_boot as any).playerId] : []}
        tournamentMvpPlayerId={(playerAwardSelections.tournament_mvp as any)?.playerId ?? ''}
        computeTotal={(p) => p.totalPoints ?? 0}
        t={t}
      />
    </div>
  );
}
