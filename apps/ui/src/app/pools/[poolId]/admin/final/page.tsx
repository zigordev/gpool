'use client';

import { useMemo } from 'react';
import { useI18n } from '@/i18n/client';
import { BracketVisualization } from '@/components/BracketVisualization';
import { Section } from '@/components/ui/Section';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { parseConfigNumberInput, useAdminContext, PHASES } from '@/contexts/AdminContext';
import { computeAdminCandidateOptions } from '@/lib/bracket-projection';
import { FaTrophy } from 'react-icons/fa';
import { IoSettings } from 'react-icons/io5';

export default function AdminFinalPage() {
  const { t } = useI18n();
  const {
    systemMode,
    bracket,
    teams,
    poolId,
    updatingMatch,
    handleUpdateTeam,
    handleSaveBracketResult,
    bracketResults,
    submittingBracketResult,
    bracketScoringConfig,
    setBracketScoringConfig,
  } = useAdminContext();
  const adminCandidateOptions = useMemo(
    () => computeAdminCandidateOptions(bracket, teams),
    [bracket, teams],
  );
  const scoringRowGrid = {
    display: 'grid',
    gridTemplateColumns: 'minmax(min(100%, 8rem), 10rem) repeat(2, minmax(min(100%, 10rem), 1fr))',
    gap: '0.5rem',
    alignItems: 'start',
  };

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Final phase scoring */}
      {!systemMode ? <Section title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><IoSettings size={13} aria-hidden />{t('adminResults.scoring.title')}</span>} collapsible defaultExpanded density="compact" tone="muted">
        <div className="config-area" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTrophy style={{ color: 'gold' }} />{t('adminResults.scoring.tournamentWinner')}</span>}>
            <Input type="number" inputMode="numeric" min="0" value={bracketScoringConfig.tournamentWinnerPoints} attention={bracketScoringConfig.tournamentWinnerPoints === ''} onChange={(e) => setBracketScoringConfig((prev) => ({ ...prev, tournamentWinnerPoints: parseConfigNumberInput(e.target.value) }))} />
          </FormField>
          {PHASES.map((phase) => {
            const scoring = bracketScoringConfig.rounds[phase.key] || { exactPositionPoints: '', correctTeamWrongPositionPoints: '' };
            return (
              <div key={phase.key} className="admin-final-scoring-row" style={scoringRowGrid}>
                <span className="admin-final-scoring-label" style={{ alignSelf: 'center', color: 'rgb(var(--fg-muted))', fontSize: '0.72rem', fontWeight: 700 }}>{t(phase.labelKey)}</span>
                <FormField label={t('adminResults.scoring.finalExactPosition')}>
                  <Input type="number" inputMode="numeric" min="0" value={scoring.exactPositionPoints} attention={scoring.exactPositionPoints === ''} onChange={(e) => setBracketScoringConfig((prev) => ({ ...prev, rounds: { ...prev.rounds, [phase.key]: { ...(prev.rounds[phase.key] || scoring), exactPositionPoints: parseConfigNumberInput(e.target.value) } } }))} />
                </FormField>
                <FormField label={t('adminResults.scoring.finalCorrectWrongPosition')}>
                  <Input type="number" inputMode="numeric" min="0" value={scoring.correctTeamWrongPositionPoints} attention={scoring.correctTeamWrongPositionPoints === ''} onChange={(e) => setBracketScoringConfig((prev) => ({ ...prev, rounds: { ...prev.rounds, [phase.key]: { ...(prev.rounds[phase.key] || scoring), correctTeamWrongPositionPoints: parseConfigNumberInput(e.target.value) } } }))} />
                </FormField>
              </div>
            );
          })}
        </div>
      </Section> : null}

      {/* Bracket */}
      {systemMode ? <section className="surface" style={{ padding: '1rem' }}>
        <BracketVisualization
          bracket={bracket}
          teams={teams}
          poolId={poolId}
          mode="admin"
          updatingMatch={updatingMatch}
          onUpdateTeam={handleUpdateTeam}
          onUpdateResult={handleSaveBracketResult}
          bracketResults={bracketResults}
          submittingResult={submittingBracketResult}
          candidateOptions={adminCandidateOptions}
        />
      </section> : null}
    </div>
  );
}
