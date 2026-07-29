'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '@/i18n/client';
import { Section } from '../../../../../../design-system/components/data-display/Section.jsx';
import { Field } from '../../../../../../design-system/components/forms/Field.jsx';
import { Input } from '../../../../../../design-system/components/forms/Input.jsx';
import { parseConfigNumberInput, useAdminContext, PHASES } from '@/contexts/AdminContext';
import { computeAdminCandidateOptions } from '@/lib/bracket-projection';
import { FaTrophy } from 'react-icons/fa';
import { IoSettings } from 'react-icons/io5';

const BracketVisualization = dynamic(
  () => import('@/components/BracketVisualization').then((mod) => mod.BracketVisualization),
  { ssr: false },
);

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
    <div className="content-panel admin-content">

      {/* Final phase scoring */}
      {systemMode ? null : <Section title={<span className="admin-section-title"><IoSettings size={13} aria-hidden />{t('adminResults.scoring.title')}</span>} collapsible defaultExpanded density="compact" tone="plain" className="admin-section-plain">
        <div className="config-area ds-form-compact" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Field label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTrophy style={{ color: '#D4A017', fill: '#D4A017' }} />{t('adminResults.scoring.tournamentWinner')}</span>}>
            <Input type="number" inputMode="numeric" min="0" value={bracketScoringConfig.tournamentWinnerPoints} attention={bracketScoringConfig.tournamentWinnerPoints === ''} onChange={(e) => setBracketScoringConfig((prev) => ({ ...prev, tournamentWinnerPoints: parseConfigNumberInput(e.target.value) }))} />
          </Field>
          {PHASES.map((phase) => {
            const scoring = bracketScoringConfig.rounds[phase.key] || { exactPositionPoints: '', correctTeamWrongPositionPoints: '' };
            return (
              <div key={phase.key} className="admin-final-scoring-row" style={scoringRowGrid}>
                <span className="admin-final-scoring-label" style={{ alignSelf: 'center', color: 'rgb(var(--fg-muted))', fontSize: '0.72rem', fontWeight: 700 }}>{t(phase.labelKey)}</span>
                <Field label={t('adminResults.scoring.finalExactPosition')}>
                  <Input type="number" inputMode="numeric" min="0" value={scoring.exactPositionPoints} attention={scoring.exactPositionPoints === ''} onChange={(e) => setBracketScoringConfig((prev) => ({ ...prev, rounds: { ...prev.rounds, [phase.key]: { ...(prev.rounds[phase.key] || scoring), exactPositionPoints: parseConfigNumberInput(e.target.value) } } }))} />
                </Field>
                <Field label={t('adminResults.scoring.finalCorrectWrongPosition')}>
                  <Input type="number" inputMode="numeric" min="0" value={scoring.correctTeamWrongPositionPoints} attention={scoring.correctTeamWrongPositionPoints === ''} onChange={(e) => setBracketScoringConfig((prev) => ({ ...prev, rounds: { ...prev.rounds, [phase.key]: { ...(prev.rounds[phase.key] || scoring), correctTeamWrongPositionPoints: parseConfigNumberInput(e.target.value) } } }))} />
                </Field>
              </div>
            );
          })}
        </div>
      </Section>}

      {/* Bracket */}
      {systemMode ? <section className="admin-bracket-workspace">
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
