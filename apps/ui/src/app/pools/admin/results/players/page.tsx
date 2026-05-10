'use client';

import { useI18n } from '@/i18n/client';
import { PlayerStatsTable } from '@/components/pool/PlayerStatsTable';
import { Input } from '@/components/ui/Input';
import Select from 'react-select';
import { countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { computePlayerPoints, useAdminContext } from '@/contexts/AdminContext';

export default function AdminPlayersPage() {
  const { t, locale } = useI18n();
  const {
    players,
    playerFilter,
    setPlayerFilter,
    playerCountryFilter,
    setPlayerCountryFilter,
    playerPositionFilter,
    setPlayerPositionFilter,
    playerScoringConfig,
    playerAwardWinnersConfig,
    updatingPlayerStat,
    handlePlayerStatChange,
  } = useAdminContext();

  const countries = Array.from(
    players.reduce<Map<string, string>>((acc, player) => {
      if (player.teamId && !acc.has(player.teamId)) {
        acc.set(player.teamId, player.teamName || player.teamId);
      }
      return acc;
    }, new Map()).entries(),
  ).sort((a, b) => a[1].localeCompare(b[1], locale));

  const nameSearch = playerFilter.trim().toLowerCase();
  const countrySearch = playerCountryFilter.trim().toLowerCase();
  const positionSearch = playerPositionFilter.trim().toLowerCase();

  const filtered = players.filter((player) => {
    const matchesName = !nameSearch || player.name.toLowerCase().includes(nameSearch);
    const matchesCountry = !countrySearch || player.teamName.toLowerCase() === countrySearch;
    const matchesPosition = !positionSearch || player.position.toLowerCase() === positionSearch;
    return matchesName && matchesCountry && matchesPosition;
  });

  const countryOptions = countries.map(([teamId, teamName]) => ({
    value: teamId,
    label: (
      <>
        <ReactCountryFlag countryCode={countryIsoCode(teamName)} svg style={{ width: '2em', height: '2em' }} />
        <span>{` ${teamName}`}</span>
      </>
    ),
    searchLabel: teamName,
  }));

  const selectedCountryOption = countryOptions.find((option) => option.value === playerCountryFilter) ?? null;

  const positionOptions = [
    { value: 'goalkeeper', label: t('adminResults.players.positions.goalkeeper') },
    { value: 'defender', label: t('adminResults.players.positions.defender') },
    { value: 'midfielder', label: t('adminResults.players.positions.midfielder') },
    { value: 'forward', label: t('adminResults.players.positions.forward') },
  ];

  const selectedPositionOption = positionOptions.find((option) => option.value === playerPositionFilter) ?? null;

  return (
    <div className="content-panel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(180px, 1fr) minmax(220px, 260px) minmax(220px, 260px)',
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
          />
          <Select<{ value: string; label: React.ReactNode; searchLabel: string }, false>
            isClearable
            getOptionLabel={(option) => option.searchLabel}
            formatOptionLabel={(option) => option.label}
            placeholder={t('adminResults.players.countryAll')}
            value={selectedCountryOption}
            options={countryOptions}
            onChange={(option) => setPlayerCountryFilter(option?.searchLabel ?? '')}
          />
        </div>
        <PlayerStatsTable
          players={filtered}
          goldenBootPlayerIds={playerAwardWinnersConfig.goldenBootPlayerIds}
          tournamentMvpPlayerId={playerAwardWinnersConfig.tournamentMvpPlayerId}
          computeTotal={(p) => computePlayerPoints(p, playerScoringConfig)}
          t={t}
          editable
          updatingPlayerStat={updatingPlayerStat}
          onStatChange={handlePlayerStatChange}
        />
      </div>
    </div>
  );
}
