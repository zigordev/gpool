'use client';

import { useI18n } from '@/i18n/client';
import { Section } from 'design-system/components/data-display/Section.jsx';
import { Field } from 'design-system/components/forms/Field.jsx';
import { Input } from 'design-system/components/forms/Input.jsx';
import { PlayerStatsTable } from '@/components/pool/PlayerStatsTable';
import Select from 'react-select';
import { selectStyles } from '@/lib/select-styles';
import { countryDisplayName, countryIsoCode } from '@/lib/country-flags';
import { isPlayerStatEnabled } from '@/lib/player-stat-visibility';
import ReactCountryFlag from 'react-country-flag';
import { computePlayerPoints, parseConfigNumberInput, useAdminContext, type ConfigNumber , PlayerMatchReference } from '@/contexts/AdminContext';
import { FaFutbol, FaMagic, FaShieldAlt, FaStar } from 'react-icons/fa';
import { IoSettings } from 'react-icons/io5';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { GiGoalKeeper, GiLeatherBoot } from 'react-icons/gi';
import { MAX_PLAYER_SELECTION_LIMIT } from '@/lib/player-selection-limits';
import { PlayerPosition } from '@/types/playerPosition.type';
import { useState } from 'react';

export default function AdminPlayersPage() {
  const { t, locale } = useI18n();
  const {
    systemMode,
    matchesByGroup,
    bracket,
    players,
    playerFilter,
    setPlayerFilter,
    playerCountryFilter,
    setPlayerCountryFilter,
    playerPositionFilter,
    setPlayerPositionFilter,
    playerScoringConfig,
    setPlayerScoringConfig,
    playerSelectionLimits,
    setPlayerSelectionLimits,
    playerAwardWinnersConfig,
    updatingPlayerStat,
    updatingPlayerAward,
    handlePlayerStatChange,
    handlePlayerAwardToggle,
  } = useAdminContext();
  const [selectedMatch, setSelectedMatch] = useState<PlayerMatchReference | null>(null);

  const countries = Array.from(
    players.reduce<Map<string, string>>((acc, player) => {
      if (player.teamId && !acc.has(player.teamId)) {
        acc.set(player.teamId, player.teamName || player.teamId);
      }
      return acc;
    }, new Map()).entries(),
  ).sort((a, b) => countryDisplayName(a[1], t).localeCompare(countryDisplayName(b[1], t), locale));

  const nameSearch = playerFilter.trim().toLowerCase();
  const countrySearch = playerCountryFilter.trim().toLowerCase();
  const positionSearch = playerPositionFilter.trim().toLowerCase();
  const selectedGroupMatch = Object.values(matchesByGroup)
    .flat()
    .find((match) => selectedMatch?.matchType === 'group' && match.matchId === selectedMatch.matchId);
  const selectedFinalMatch = Object.values(bracket)
    .flat()
    .find((match) => selectedMatch?.matchType === 'final' && match.bracketMatchId === selectedMatch.matchId);
  const selectedMatchTeamIds = new Set(
    [
      selectedGroupMatch?.homeTeamId ?? selectedFinalMatch?.homeTeamId,
      selectedGroupMatch?.awayTeamId ?? selectedFinalMatch?.awayTeamId,
    ].filter((teamId): teamId is string => Boolean(teamId)),
  );

  const filtered = players.filter((player) => {
    const matchesName = !nameSearch || player.name.toLowerCase().includes(nameSearch);
    const matchesCountry = !countrySearch || player.teamName.toLowerCase() === countrySearch;
    const matchesPosition = !positionSearch || player.position.toLowerCase() === positionSearch;
    const participatesInSelectedMatch =
      selectedMatchTeamIds.size === 0 || selectedMatchTeamIds.has(player.teamId);
    return matchesName && matchesCountry && matchesPosition && participatesInSelectedMatch;
  });

  const countryOptions = countries.map(([teamId, teamName]) => {
    const displayName = countryDisplayName(teamName, t);
    return {
      value: teamName,
      label: (
        <>
          <ReactCountryFlag countryCode={countryIsoCode(teamName)} svg style={{ width: '2em', height: '2em' }} />
          <span>{` ${displayName}`}</span>
        </>
      ),
      teamId,
      searchLabel: teamName,
      displayLabel: displayName,
    };
  });

  const selectedCountryOption = countryOptions.find((option) => option.value === playerCountryFilter) ?? null;

  const positionOptions = [
    { value: 'goalkeeper', label: t('adminResults.players.positions.goalkeeper') },
    { value: 'defender', label: t('adminResults.players.positions.defender') },
    { value: 'midfielder', label: t('adminResults.players.positions.midfielder') },
    { value: 'forward', label: t('adminResults.players.positions.forward') },
  ];

  const selectedPositionOption = positionOptions.find((option) => option.value === playerPositionFilter) ?? null;
  const matchDateFormatter = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const matchOptions = [
    ...Object.entries(matchesByGroup).flatMap(([group, matches]) =>
      matches.map((match) => ({
        value: match.matchId,
        matchId: match.matchId,
        matchType: 'group' as const,
        scheduledAt: match.scheduledAt,
        label: `${t('adminResults.players.matchGroup', { group })} · ${match.homeTeamName} - ${match.awayTeamName}${match.scheduledAt ? ` · ${matchDateFormatter.format(new Date(match.scheduledAt))}` : ''}`,
      })),
    ),
    ...Object.values(bracket).flatMap((matches) =>
      matches
        .filter((match) => match.homeTeamId && match.awayTeamId)
        .map((match) => ({
          value: match.bracketMatchId,
          matchId: match.bracketMatchId,
          matchType: 'final' as const,
          scheduledAt: match.scheduledAt,
          label: `${match.phase === 'third-place' ? t('bracket.round.thirdPlace') : t('adminResults.players.matchFinal')} · P${match.matchNumber} · ${match.homeTeamName || match.homeSourceLabel || ''} - ${match.awayTeamName || match.awaySourceLabel || ''}${match.scheduledAt ? ` · ${matchDateFormatter.format(new Date(match.scheduledAt))}` : ''}`,
        })),
    ),
  ].sort((a, b) => {
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });
  const selectedMatchOption = matchOptions.find(
    (option) => option.matchId === selectedMatch?.matchId && option.matchType === selectedMatch.matchType,
  ) ?? null;
  const parsePositive = (value: string) => parseConfigNumberInput(value);
  const parseSigned = (value: string) => parseConfigNumberInput(value, { allowNegative: true });
  const parseNonPositive = (value: string) => parseConfigNumberInput(value, { allowNegative: true, max: 0 });
  const updatePlayerSelectionLimit = (position: PlayerPosition, value: string) => {
    if (value.trim() === '') return;
    const parsed = Number.parseInt(value, 10);
    const limit = Number.isFinite(parsed)
      ? Math.max(1, Math.min(MAX_PLAYER_SELECTION_LIMIT, parsed))
      : playerSelectionLimits[position];
    setPlayerSelectionLimits((current) => ({ ...current, [position]: limit }));
  };

  return (
    <div className="content-panel admin-content">
      {systemMode ? null : <Section title={<span className="admin-section-title"><IoSettings size={13} aria-hidden />{t('adminResults.players.selectionLimits.title')}</span>} collapsible defaultExpanded density="compact" tone="plain" className="admin-section-plain">
        <div className="config-area ds-form-compact" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
          {([
            ['goalkeeper', 'adminResults.players.positions.goalkeeper'],
            ['defender', 'adminResults.players.positions.defender'],
            ['midfielder', 'adminResults.players.positions.midfielder'],
            ['forward', 'adminResults.players.positions.forward'],
          ] as const).map(([position, labelKey]) => (
            <Field key={position} label={t(labelKey)}>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max={MAX_PLAYER_SELECTION_LIMIT}
                value={playerSelectionLimits[position]}
                onChange={(event) => updatePlayerSelectionLimit(position, event.target.value)}
              />
            </Field>
          ))}
        </div>
      </Section>}

      {/* Player scoring configuration */}
      {systemMode ? null : <Section title={<span className="admin-section-title"><IoSettings size={13} aria-hidden />{t('adminResults.scoring.title')}</span>} collapsible defaultExpanded density="compact" tone="plain" className="admin-section-plain">
        <div className="config-area ds-form-compact" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={actionGroupTitleStyle}>{t('poolDetail.players.actionGroups.match')}</p>
          {[
            { labelKey: 'adminResults.config.players.subgroups.goalsByPosition', icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.positions.goalkeeper'), value: playerScoringConfig.goal.goalkeeper, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, goalkeeper: v } })) },
              { label: t('adminResults.players.positions.defender'), value: playerScoringConfig.goal.defender, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, defender: v } })) },
              { label: t('adminResults.players.positions.midfielder'), value: playerScoringConfig.goal.midfielder, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, midfielder: v } })) },
              { label: t('adminResults.players.positions.forward'), value: playerScoringConfig.goal.forward, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, forward: v } })) },
            ]},
            { labelKey: 'adminResults.config.players.subgroups.assistsByPosition', icon: <FaMagic style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.positions.goalkeeper'), value: playerScoringConfig.assist.goalkeeper, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, goalkeeper: v } })) },
              { label: t('adminResults.players.positions.defender'), value: playerScoringConfig.assist.defender, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, defender: v } })) },
              { label: t('adminResults.players.positions.midfielder'), value: playerScoringConfig.assist.midfielder, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, midfielder: v } })) },
              { label: t('adminResults.players.positions.forward'), value: playerScoringConfig.assist.forward, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, forward: v } })) },
            ]},
            { labelKey: 'adminResults.config.players.subgroups.cleanSheetsByPosition', icon: <FaShieldAlt style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.positions.goalkeeper'), value: playerScoringConfig.cleanSheet.goalkeeper, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, goalkeeper: v } })) },
              { label: t('adminResults.players.positions.defender'), value: playerScoringConfig.cleanSheet.defender, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, defender: v } })) },
              { label: t('adminResults.players.positions.midfielder'), value: playerScoringConfig.cleanSheet.midfielder, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, midfielder: v } })) },
              { label: t('adminResults.players.positions.forward'), value: playerScoringConfig.cleanSheet.forward, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, forward: v } })) },
            ]},
          ].map(({ labelKey, icon, fields }) => (
            <div key={labelKey}>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.3rem' }}>{icon}{t(labelKey)}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {fields.map((field) => (
                  <Field key={field.label} label={field.label}>
                    <Input type="number" inputMode="numeric" min="0" value={field.value} attention={field.value === ''} onChange={(e) => field.onChange(parsePositive(e.target.value))} />
                  </Field>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
            <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaStar style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.mvp')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.mvp} attention={playerScoringConfig.mvp === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, mvp: parsePositive(e.target.value) }))} /></Field>
            <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><LuRectangleVertical style={{ color: '#D4A017', fill: '#D4A017' }} />{t('adminResults.players.scoring.yellowCard')}</span>}><Input type="number" inputMode="numeric" max="0" value={playerScoringConfig.yellowCard} attention={playerScoringConfig.yellowCard === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, yellowCard: parseNonPositive(e.target.value) }))} /></Field>
            <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ display: 'inline-flex', gap: '0.04rem' }}><LuRectangleVertical style={{ color: '#D4A017', fill: '#D4A017' }} /><LuRectangleVertical style={{ color: '#D4A017', fill: '#D4A017' }} /></span>{t('adminResults.players.scoring.doubleYellowCard')}</span>}><Input type="number" inputMode="numeric" max="0" value={playerScoringConfig.doubleYellowCard} attention={playerScoringConfig.doubleYellowCard === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, doubleYellowCard: parseNonPositive(e.target.value) }))} /></Field>
            <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><LuRectangleVertical style={{ color: 'rgb(var(--live))', fill: 'rgb(var(--live))' }} />{t('adminResults.players.scoring.redCard')}</span>}><Input type="number" inputMode="numeric" max="0" value={playerScoringConfig.redCard} attention={playerScoringConfig.redCard === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, redCard: parseNonPositive(e.target.value) }))} /></Field>
          </div>
          <div style={actionGroupStyle}>
            <p style={actionGroupTitleStyle}>{t('poolDetail.players.actionGroups.penalty')}</p>
            <div>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.3rem' }}>
                <FaFutbol style={{ color: 'rgb(var(--fg))' }} />
                {t('adminResults.config.players.subgroups.penaltyGoalsByPosition')}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {[
                  { position: 'goalkeeper' as const, label: t('adminResults.players.positions.goalkeeper') },
                  { position: 'defender' as const, label: t('adminResults.players.positions.defender') },
                  { position: 'midfielder' as const, label: t('adminResults.players.positions.midfielder') },
                  { position: 'forward' as const, label: t('adminResults.players.positions.forward') },
                ].map(({ position, label }) => (
                  <Field key={position} label={label}>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={playerScoringConfig.penaltyGoal[position]}
                      attention={playerScoringConfig.penaltyGoal[position] === ''}
                      onChange={(event) => setPlayerScoringConfig((previous) => ({
                        ...previous,
                        penaltyGoal: {
                          ...previous.penaltyGoal,
                          [position]: parsePositive(event.target.value),
                        },
                      }))}
                    />
                  </Field>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.penaltySaved')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.penaltySaved} attention={playerScoringConfig.penaltySaved === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, penaltySaved: parsePositive(e.target.value) }))} /></Field>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IoMdCloseCircle style={{ color: 'rgb(var(--live))' }} />{t('adminResults.players.scoring.missedPenalty')}</span>}><Input type="number" inputMode="numeric" value={playerScoringConfig.missedPenalty} attention={playerScoringConfig.missedPenalty === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, missedPenalty: parseSigned(e.target.value) }))} /></Field>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IoMdCloseCircle style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.forcedPenaltyMiss')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.forcedPenaltyMiss} attention={playerScoringConfig.forcedPenaltyMiss === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, forcedPenaltyMiss: parsePositive(e.target.value) }))} /></Field>
            </div>
          </div>
          <div style={actionGroupStyle}>
            <p style={actionGroupTitleStyle}>{t('poolDetail.players.actionGroups.shootout')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaFutbol style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.shootoutGoal')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.shootoutGoal} attention={playerScoringConfig.shootoutGoal === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, shootoutGoal: parsePositive(e.target.value) }))} /></Field>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.shootoutPenaltySaved')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.shootoutPenaltySaved} attention={playerScoringConfig.shootoutPenaltySaved === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, shootoutPenaltySaved: parsePositive(e.target.value) }))} /></Field>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IoMdCloseCircle style={{ color: 'rgb(var(--live))' }} />{t('adminResults.players.scoring.shootoutMissedPenalty')}</span>}><Input type="number" inputMode="numeric" value={playerScoringConfig.shootoutMissedPenalty} attention={playerScoringConfig.shootoutMissedPenalty === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, shootoutMissedPenalty: parseSigned(e.target.value) }))} /></Field>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IoMdCloseCircle style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.shootoutForcedPenaltyMiss')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.shootoutForcedPenaltyMiss} attention={playerScoringConfig.shootoutForcedPenaltyMiss === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, shootoutForcedPenaltyMiss: parsePositive(e.target.value) }))} /></Field>
            </div>
          </div>
          <div style={actionGroupStyle}>
            <p style={actionGroupTitleStyle}>{t('poolDetail.players.actionGroups.tournament')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><GiLeatherBoot style={{ color: '#D4A017', fill: '#D4A017' }} />{t('adminResults.players.scoring.goldenBoot')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.award.goldenBoot} attention={playerScoringConfig.award.goldenBoot === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, award: { ...p.award, goldenBoot: parsePositive(e.target.value) } }))} /></Field>
              <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaStar style={{ color: '#D4A017', fill: '#D4A017' }} />{t('adminResults.players.scoring.tournamentMvp')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.award.tournamentMvp} attention={playerScoringConfig.award.tournamentMvp === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, award: { ...p.award, tournamentMvp: parsePositive(e.target.value) } }))} /></Field>
            </div>
          </div>
        </div>
      </Section>}

      {/* Player stats table */}
      {systemMode ? <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.35rem' }}>
        <PlayerStatsTable
          players={filtered}
          goldenBootPlayerIds={playerAwardWinnersConfig.goldenBootPlayerIds}
          tournamentMvpPlayerId={playerAwardWinnersConfig.tournamentMvpPlayerId}
          computeTotal={(p) => computePlayerPoints(p, playerScoringConfig)}
          t={t}
          editable
          updatingPlayerStat={updatingPlayerStat}
          updatingPlayerAward={updatingPlayerAward}
          statsDisabled={!selectedMatch}
          onStatChange={(player, stat, delta) => handlePlayerStatChange(player, stat, delta, selectedMatch)}
          onAwardToggle={handlePlayerAwardToggle}
          isStatVisible={(player, stat) => isPlayerStatEnabled(playerScoringConfig, player.position, stat)}
          toolbar={
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.6rem',
                alignItems: 'center',
              }}
            >
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label={t('adminResults.players.matchLabel')} required>
                  <Select<(typeof matchOptions)[number], false>
                    isClearable
                    placeholder={t('adminResults.players.matchPlaceholder')}
                    value={selectedMatchOption}
                    options={matchOptions}
                    onChange={(option) => setSelectedMatch(option
                      ? { matchId: option.matchId, matchType: option.matchType }
                      : null)}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                    styles={selectStyles({
                      control: (base) => ({
                        ...base,
                        borderColor: selectedMatch ? base.borderColor : 'rgb(var(--warning))',
                        boxShadow: selectedMatch ? base.boxShadow : '0 0 0 1px rgb(var(--warning) / 0.2)',
                      }),
                    })}
                  />
                </Field>
              </div>
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
                value={selectedPositionOption}
                options={positionOptions}
                onChange={(option) => setPlayerPositionFilter(option?.value ?? '')}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                styles={selectStyles()}
              />
              <Select<{ value: string; label: React.ReactNode; searchLabel: string; displayLabel: string }, false>
                isClearable
                getOptionLabel={(option) => option.displayLabel}
                formatOptionLabel={(option) => option.label}
                placeholder={t('adminResults.players.countryAll')}
                value={selectedCountryOption}
                options={countryOptions}
                onChange={(option) => setPlayerCountryFilter(option?.value ?? '')}
                filterOption={(option, inputValue) => {
                  const search = inputValue.toLowerCase();
                  return option.data.displayLabel.toLowerCase().includes(search) || option.data.searchLabel.toLowerCase().includes(search);
                }}
                menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
                styles={selectStyles()}
              />
            </div>
          }
        />
      </div> : null}
    </div>
  );
}

const actionGroupStyle: React.CSSProperties = {
  display: 'grid',
  gap: '0.45rem',
  paddingTop: '0.75rem',
  borderTop: '1px solid rgb(var(--border-subtle))',
};

const actionGroupTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '0.68rem',
  fontWeight: 800,
  textTransform: 'uppercase',
  color: 'rgb(var(--fg-subtle))',
};
