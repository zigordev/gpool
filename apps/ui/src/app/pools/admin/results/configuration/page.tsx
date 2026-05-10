'use client';

import { useI18n } from '@/i18n/client';
import { useAdminContext, PHASES, resizePrizeDistribution } from '@/contexts/AdminContext';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Section } from '@/components/ui/Section';

export default function ConfigurationPage() {
  const { t } = useI18n();
  const {
    scoringConfig, setScoringConfig, bracketScoringConfig, setBracketScoringConfig,
    playerScoringConfig, setPlayerScoringConfig, savingConfig,
    deadlineLocal, setDeadlineLocal, entryFee, setEntryFee,
    prizeDistribution, setPrizeDistribution, maxPrizePaidPositions, prizeTotal, prizeTotalInvalid, poolNotSelected,
  } = useAdminContext();

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* General configuration */}
      <Section title={t('adminResults.config.general.title')} collapsible defaultExpanded density="compact" tone="subtle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <FormField label={t('adminResults.scoring.deadline')} hint={t('adminResults.scoring.deadlineHint')}>
              <Input type="datetime-local" value={deadlineLocal} onChange={(e) => setDeadlineLocal(e.target.value)} />
            </FormField>
            <FormField label={t('adminResults.scoring.entryFee')} hint={t('adminResults.scoring.entryFeeHint')}>
              <Input type="number" inputMode="decimal" min="0" step="0.5" value={entryFee} onChange={(e) => { const v = Number.parseFloat(e.target.value); setEntryFee(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 260px) minmax(0, 1fr)', gap: '1rem', alignItems: 'end' }}>
            <FormField label={t('adminResults.scoring.prizePaidPositions')} hint={t('adminResults.scoring.prizePaidPositionsHint', { count: maxPrizePaidPositions })}>
              <Input type="number" inputMode="numeric" min="0" max={maxPrizePaidPositions} value={prizeDistribution.length} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setPrizeDistribution((prev) => resizePrizeDistribution(prev, value, maxPrizePaidPositions)); }} />
            </FormField>
            <div style={{ color: prizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--fg-muted))', fontSize: '0.875rem', fontWeight: 600, paddingBottom: '0.65rem' }}>
              {t('adminResults.scoring.prizeTotal', { total: Number(prizeTotal.toFixed(2)) })}
              {prizeDistribution.length > 0 ? (
                <span style={{ marginLeft: '0.5rem', color: prizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--pitch))' }}>
                  {prizeTotalInvalid ? t('adminResults.scoring.prizeTotalInvalid') : t('adminResults.scoring.prizeTotalValid')}
                </span>
              ) : null}
            </div>
          </div>
          {prizeDistribution.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {prizeDistribution.map((row, index) => (
                <div key={row.rank} style={{ display: 'grid', gridTemplateColumns: 'minmax(7rem, 10rem) minmax(9rem, 13rem) minmax(0, 1fr)', gap: '0.65rem', alignItems: 'center' }}>
                  <span style={{ color: 'rgb(var(--fg))', fontWeight: 700, fontSize: '0.875rem' }}>{t('adminResults.scoring.prizeRank', { rank: row.rank })}</span>
                  <Input type="number" inputMode="decimal" min="0" max="100" step="0.5" value={row.percentage} invalid={prizeTotalInvalid} aria-label={t('adminResults.scoring.prizePercentage', { rank: row.rank })} onChange={(e) => { const value = Number.parseFloat(e.target.value); const percentage = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0; setPrizeDistribution((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, percentage } : item)); }} />
                  <span style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.8125rem' }}>{t('adminResults.scoring.prizePercentage', { rank: row.rank })}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Section>

      {/* Group phase scoring */}
      <Section title={t('adminResults.config.groupPhase.title')} collapsible defaultExpanded={false} density="compact" tone="subtle">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <FormField label={t('adminResults.scoring.groupPhaseWinner')}>
            <Input type="number" inputMode="numeric" min="0" value={scoringConfig.winnerPoints} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setScoringConfig((prev) => ({ ...prev, winnerPoints: Math.max(0, value) })); }} />
          </FormField>
          <FormField label={t('adminResults.scoring.groupPhaseExact')}>
            <Input type="number" inputMode="numeric" min="0" value={scoringConfig.exactResultPoints} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setScoringConfig((prev) => ({ ...prev, exactResultPoints: Math.max(0, value) })); }} />
          </FormField>
        </div>
      </Section>

      {/* Final phase scoring */}
      <Section title={t('adminResults.config.finalPhase.title')} collapsible defaultExpanded={false} density="compact" tone="subtle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1fr)', gap: '0.75rem', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <FormField label={t('adminResults.scoring.tournamentWinner')}>
              <Input type="number" inputMode="numeric" min="0" value={bracketScoringConfig.tournamentWinnerPoints} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setBracketScoringConfig((prev) => ({ ...prev, tournamentWinnerPoints: Math.max(0, value) })); }} />
            </FormField>
          </div>
          {PHASES.map((phase) => {
            const scoring = bracketScoringConfig.rounds[phase.key] || { exactPositionPoints: bracketScoringConfig.exactPositionPoints, correctTeamWrongPositionPoints: bracketScoringConfig.correctTeamWrongPositionPoints };
            return (
              <div key={phase.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(8rem, 12rem) repeat(2, minmax(150px, 1fr))', gap: '0.75rem', alignItems: 'start', padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                <span style={{ alignSelf: 'center', color: 'rgb(var(--fg))', fontSize: '0.875rem', fontWeight: 800 }}>{t(phase.labelKey)}</span>
                <FormField label={t('adminResults.scoring.finalExactPosition')}>
                  <Input type="number" inputMode="numeric" min="0" value={scoring.exactPositionPoints} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setBracketScoringConfig((prev) => ({ ...prev, rounds: { ...prev.rounds, [phase.key]: { ...(prev.rounds[phase.key] || scoring), exactPositionPoints: Math.max(0, value) } } })); }} />
                </FormField>
                <FormField label={t('adminResults.scoring.finalCorrectWrongPosition')}>
                  <Input type="number" inputMode="numeric" min="0" value={scoring.correctTeamWrongPositionPoints} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setBracketScoringConfig((prev) => ({ ...prev, rounds: { ...prev.rounds, [phase.key]: { ...(prev.rounds[phase.key] || scoring), correctTeamWrongPositionPoints: Math.max(0, value) } } })); }} />
                </FormField>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Players scoring */}
      <Section title={t('adminResults.config.players.title')} collapsible defaultExpanded={false} density="compact" tone="subtle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { labelKey: 'adminResults.config.players.subgroups.goalsByPosition', fields: [
              { label: t('adminResults.players.scoring.goalGoalkeeper'), value: playerScoringConfig.goal.goalkeeper, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, goalkeeper: v } })) },
              { label: t('adminResults.players.scoring.goalDefender'), value: playerScoringConfig.goal.defender, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, defender: v } })) },
              { label: t('adminResults.players.scoring.goalMidfielder'), value: playerScoringConfig.goal.midfielder, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, midfielder: v } })) },
              { label: t('adminResults.players.scoring.goalForward'), value: playerScoringConfig.goal.forward, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, forward: v } })) },
            ]},
            { labelKey: 'adminResults.config.players.subgroups.assistsByPosition', fields: [
              { label: t('adminResults.players.scoring.assistGoalkeeper'), value: playerScoringConfig.assist.goalkeeper, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, goalkeeper: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.assistDefender'), value: playerScoringConfig.assist.defender, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, defender: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.assistMidfielder'), value: playerScoringConfig.assist.midfielder, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, midfielder: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.assistForward'), value: playerScoringConfig.assist.forward, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, forward: Math.max(0, v) } })) },
            ]},
            { labelKey: 'adminResults.config.players.subgroups.cleanSheetsByPosition', fields: [
              { label: t('adminResults.players.scoring.cleanSheetGoalkeeper'), value: playerScoringConfig.cleanSheet.goalkeeper, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, goalkeeper: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.cleanSheetDefender'), value: playerScoringConfig.cleanSheet.defender, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, defender: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.cleanSheetMidfielder'), value: playerScoringConfig.cleanSheet.midfielder, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, midfielder: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.cleanSheetForward'), value: playerScoringConfig.cleanSheet.forward, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, forward: Math.max(0, v) } })) },
            ]},
          ].map(({ labelKey, fields }) => (
            <div key={labelKey} style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.5rem' }}>{t(labelKey)}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                {fields.map((field) => (
                  <FormField key={field.label} label={field.label}>
                    <Input type="number" inputMode="numeric" min="0" value={field.value} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; field.onChange(v); }} />
                  </FormField>
                ))}
              </div>
            </div>
          ))}

          <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.5rem' }}>{t('adminResults.config.players.subgroups.individualActions')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <FormField label={t('adminResults.players.scoring.missedPenalty')}><Input type="number" inputMode="numeric" value={playerScoringConfig.missedPenalty} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, missedPenalty: v })); }} /></FormField>
              <FormField label={t('adminResults.players.scoring.mvp')}><Input type="number" inputMode="numeric" value={playerScoringConfig.mvp} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, mvp: v })); }} /></FormField>
              <FormField label={t('adminResults.players.scoring.penaltySaved')}><Input type="number" inputMode="numeric" value={playerScoringConfig.penaltySaved} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, penaltySaved: v })); }} /></FormField>
            </div>
          </div>

          <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.5rem' }}>{t('adminResults.config.players.subgroups.discipline')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <FormField label={t('adminResults.players.scoring.yellowCard')} hint={t('adminResults.players.scoring.cardHint')}><Input type="number" inputMode="numeric" value={playerScoringConfig.yellowCard} onChange={(e) => { const v = Number.parseInt(e.target.value, 10); setPlayerScoringConfig((p) => ({ ...p, yellowCard: Number.isFinite(v) ? v : 0 })); }} /></FormField>
              <FormField label={t('adminResults.players.scoring.redCard')} hint={t('adminResults.players.scoring.cardHint')}><Input type="number" inputMode="numeric" value={playerScoringConfig.redCard} onChange={(e) => { const v = Number.parseInt(e.target.value, 10); setPlayerScoringConfig((p) => ({ ...p, redCard: Number.isFinite(v) ? v : 0 })); }} /></FormField>
            </div>
          </div>

          <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.5rem' }}>{t('adminResults.config.players.subgroups.awards')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <FormField label={t('adminResults.players.scoring.goldenBoot')}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.award.goldenBoot} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, award: { ...p.award, goldenBoot: Math.max(0, v) } })); }} /></FormField>
              <FormField label={t('adminResults.players.scoring.tournamentMvp')}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.award.tournamentMvp} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, award: { ...p.award, tournamentMvp: Math.max(0, v) } })); }} /></FormField>
            </div>
          </div>
        </div>
      </Section>

      <div aria-live="polite" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', minHeight: '1.4rem', fontSize: '0.78rem', color: 'rgb(var(--fg-muted))', fontStyle: 'italic' }}>
        {savingConfig ? (
          <><span aria-hidden className="btn-spinner" style={{ width: '0.75rem', height: '0.75rem', borderWidth: 2 }} />{t('adminResults.scoring.savingAuto')}</>
        ) : prizeTotalInvalid ? (
          <span style={{ color: 'rgb(var(--live))', fontStyle: 'normal', fontWeight: 600 }}>{t('adminResults.scoring.prizeTotalInvalid')}</span>
        ) : poolNotSelected ? (
          <span style={{ fontStyle: 'normal' }}>{t('adminResults.errors.selectPoolFirst')}</span>
        ) : (
          <span aria-hidden>{t('adminResults.scoring.savedAuto')}</span>
        )}
      </div>
    </div>
  );
}
