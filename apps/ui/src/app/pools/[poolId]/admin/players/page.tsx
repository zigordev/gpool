'use client';

import { useI18n } from '@/i18n/client';
import { Section } from '@/components/ui/Section';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { PlayerStatsTable } from '@/components/pool/PlayerStatsTable';
import Select from 'react-select';
import { selectStyles } from '@/lib/select-styles';
import { countryDisplayName, countryIsoCode } from '@/lib/country-flags';
import { isPlayerStatEnabled } from '@/lib/player-stat-visibility';
import ReactCountryFlag from 'react-country-flag';
import { computePlayerPoints, parseConfigNumberInput, useAdminContext, type ConfigNumber } from '@/contexts/AdminContext';
import { FaFutbol, FaMagic, FaShieldAlt, FaStar } from 'react-icons/fa';
import { IoSettings } from 'react-icons/io5';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { GiGoalKeeper, GiLeatherBoot } from 'react-icons/gi';
import { MAX_PLAYER_SELECTION_LIMIT } from '@/lib/player-selection-limits';
import { PlayerPosition } from '@/types/playerPosition.type';

export default function AdminPlayersPage() {
  const { t, locale } = useI18n();
  const {
    systemMode,
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

  const filtered = players.filter((player) => {
    const matchesName = !nameSearch || player.name.toLowerCase().includes(nameSearch);
    const matchesCountry = !countrySearch || player.teamName.toLowerCase() === countrySearch;
    const matchesPosition = !positionSearch || player.position.toLowerCase() === positionSearch;
    return matchesName && matchesCountry && matchesPosition;
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
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {!systemMode ? <Section title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><IoSettings size={13} aria-hidden />{t('adminResults.players.selectionLimits.title')}</span>} collapsible defaultExpanded density="compact" tone="muted">
        <div className="config-area" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
          {([
            ['goalkeeper', 'adminResults.players.positions.goalkeeper'],
            ['defender', 'adminResults.players.positions.defender'],
            ['midfielder', 'adminResults.players.positions.midfielder'],
            ['forward', 'adminResults.players.positions.forward'],
          ] as const).map(([position, labelKey]) => (
            <FormField key={position} label={t(labelKey)}>
              <Input
                type="number"
                inputMode="numeric"
                min="1"
                max={MAX_PLAYER_SELECTION_LIMIT}
                value={playerSelectionLimits[position]}
                onChange={(event) => updatePlayerSelectionLimit(position, event.target.value)}
              />
            </FormField>
          ))}
        </div>
      </Section> : null}

      {/* Player scoring configuration */}
      {!systemMode ? <Section title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><IoSettings size={13} aria-hidden />{t('adminResults.scoring.title')}</span>} collapsible defaultExpanded density="compact" tone="muted">
        <div className="config-area" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <p style={actionGroupTitleStyle}>{t('poolDetail.players.actionGroups.match')}</p>
          {[
            { labelKey: 'adminResults.config.players.subgroups.goalsByPosition', icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.scoring.goalGoalkeeper'), value: playerScoringConfig.goal.goalkeeper, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, goalkeeper: v } })) },
              { label: t('adminResults.players.scoring.goalDefender'), value: playerScoringConfig.goal.defender, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, defender: v } })) },
              { label: t('adminResults.players.scoring.goalMidfielder'), value: playerScoringConfig.goal.midfielder, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, midfielder: v } })) },
              { label: t('adminResults.players.scoring.goalForward'), value: playerScoringConfig.goal.forward, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, forward: v } })) },
            ]},
            { labelKey: 'adminResults.config.players.subgroups.assistsByPosition', icon: <FaMagic style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.scoring.assistGoalkeeper'), value: playerScoringConfig.assist.goalkeeper, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, goalkeeper: v } })) },
              { label: t('adminResults.players.scoring.assistDefender'), value: playerScoringConfig.assist.defender, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, defender: v } })) },
              { label: t('adminResults.players.scoring.assistMidfielder'), value: playerScoringConfig.assist.midfielder, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, midfielder: v } })) },
              { label: t('adminResults.players.scoring.assistForward'), value: playerScoringConfig.assist.forward, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, forward: v } })) },
            ]},
            { labelKey: 'adminResults.config.players.subgroups.cleanSheetsByPosition', icon: <FaShieldAlt style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.scoring.cleanSheetGoalkeeper'), value: playerScoringConfig.cleanSheet.goalkeeper, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, goalkeeper: v } })) },
              { label: t('adminResults.players.scoring.cleanSheetDefender'), value: playerScoringConfig.cleanSheet.defender, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, defender: v } })) },
              { label: t('adminResults.players.scoring.cleanSheetMidfielder'), value: playerScoringConfig.cleanSheet.midfielder, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, midfielder: v } })) },
              { label: t('adminResults.players.scoring.cleanSheetForward'), value: playerScoringConfig.cleanSheet.forward, onChange: (v: ConfigNumber) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, forward: v } })) },
            ]},
          ].map(({ labelKey, icon, fields }) => (
            <div key={labelKey}>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.3rem' }}>{icon}{t(labelKey)}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {fields.map((field) => (
                  <FormField key={field.label} label={field.label}>
                    <Input type="number" inputMode="numeric" min="0" value={field.value} attention={field.value === ''} onChange={(e) => field.onChange(parsePositive(e.target.value))} />
                  </FormField>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaStar style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.mvp')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.mvp} attention={playerScoringConfig.mvp === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, mvp: parsePositive(e.target.value) }))} /></FormField>
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><LuRectangleVertical style={{ color: 'yellow', fill: 'yellow' }} />{t('adminResults.players.scoring.yellowCard')}</span>}><Input type="number" inputMode="numeric" max="0" value={playerScoringConfig.yellowCard} attention={playerScoringConfig.yellowCard === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, yellowCard: parseNonPositive(e.target.value) }))} /></FormField>
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><LuRectangleVertical style={{ color: 'red', fill: 'red' }} />{t('adminResults.players.scoring.redCard')}</span>}><Input type="number" inputMode="numeric" max="0" value={playerScoringConfig.redCard} attention={playerScoringConfig.redCard === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, redCard: parseNonPositive(e.target.value) }))} /></FormField>
          </div>
          <div style={actionGroupStyle}>
            <p style={actionGroupTitleStyle}>{t('poolDetail.players.actionGroups.penalty')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaFutbol style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.penaltyGoal')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.penaltyGoal} attention={playerScoringConfig.penaltyGoal === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, penaltyGoal: parsePositive(e.target.value) }))} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.penaltySaved')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.penaltySaved} attention={playerScoringConfig.penaltySaved === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, penaltySaved: parsePositive(e.target.value) }))} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IoMdCloseCircle style={{ color: 'red' }} />{t('adminResults.players.scoring.missedPenalty')}</span>}><Input type="number" inputMode="numeric" value={playerScoringConfig.missedPenalty} attention={playerScoringConfig.missedPenalty === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, missedPenalty: parseSigned(e.target.value) }))} /></FormField>
            </div>
          </div>
          <div style={actionGroupStyle}>
            <p style={actionGroupTitleStyle}>{t('poolDetail.players.actionGroups.shootout')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaFutbol style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.shootoutGoal')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.shootoutGoal} attention={playerScoringConfig.shootoutGoal === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, shootoutGoal: parsePositive(e.target.value) }))} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><GiGoalKeeper style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.shootoutPenaltySaved')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.shootoutPenaltySaved} attention={playerScoringConfig.shootoutPenaltySaved === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, shootoutPenaltySaved: parsePositive(e.target.value) }))} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IoMdCloseCircle style={{ color: 'red' }} />{t('adminResults.players.scoring.shootoutMissedPenalty')}</span>}><Input type="number" inputMode="numeric" value={playerScoringConfig.shootoutMissedPenalty} attention={playerScoringConfig.shootoutMissedPenalty === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, shootoutMissedPenalty: parseSigned(e.target.value) }))} /></FormField>
            </div>
          </div>
          <div style={actionGroupStyle}>
            <p style={actionGroupTitleStyle}>{t('poolDetail.players.actionGroups.tournament')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><GiLeatherBoot style={{ color: 'gold' }} />{t('adminResults.players.scoring.goldenBoot')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.award.goldenBoot} attention={playerScoringConfig.award.goldenBoot === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, award: { ...p.award, goldenBoot: parsePositive(e.target.value) } }))} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaStar style={{ color: 'gold' }} />{t('adminResults.players.scoring.tournamentMvp')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.award.tournamentMvp} attention={playerScoringConfig.award.tournamentMvp === ''} onChange={(e) => setPlayerScoringConfig((p) => ({ ...p, award: { ...p.award, tournamentMvp: parsePositive(e.target.value) } }))} /></FormField>
            </div>
          </div>
        </div>
      </Section> : null}

      {/* Player stats table */}
      {systemMode ? <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <PlayerStatsTable
          players={filtered}
          goldenBootPlayerIds={playerAwardWinnersConfig.goldenBootPlayerIds}
          tournamentMvpPlayerId={playerAwardWinnersConfig.tournamentMvpPlayerId}
          computeTotal={(p) => computePlayerPoints(p, playerScoringConfig)}
          t={t}
          editable
          updatingPlayerStat={updatingPlayerStat}
          updatingPlayerAward={updatingPlayerAward}
          onStatChange={handlePlayerStatChange}
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
