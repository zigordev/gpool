'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { useAdminContext, PHASES, resizePrizeDistribution } from '@/contexts/AdminContext';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Section } from '@/components/ui/Section';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { FaFutbol, FaMagic, FaShieldAlt, FaStar, FaClock, FaTrophy } from 'react-icons/fa';
import { FaDollarSign } from 'react-icons/fa6';
import { IoMdCloseCircle } from 'react-icons/io';
import { LuRectangleVertical } from 'react-icons/lu';
import { PiBoxingGlove } from 'react-icons/pi';
import { GiLeatherBoot } from 'react-icons/gi';

export default function ConfigurationPage() {
  const { t } = useI18n();
  const router = useRouter();
  const {
    poolId, poolName, setPoolName,
    scoringConfig, setScoringConfig, bracketScoringConfig, setBracketScoringConfig,
    playerScoringConfig, setPlayerScoringConfig,
    deadlineLocal, setDeadlineLocal, entryFee, setEntryFee,
    prizeDistribution, setPrizeDistribution, maxPrizePaidPositions, prizeTotal, prizeTotalInvalid, poolNotSelected,
  } = useAdminContext();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeletePool = async () => {
    if (!poolId || poolId === 'all-pools') return;
    try {
      setDeleting(true);
      await apiClient.delete(`/pools/${poolId}`);
      toast.success(t('adminResults.toast.poolDeleted'));
      router.push('/pools');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.deletePool'));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* General configuration */}
      <Section title={t('adminResults.config.general.title')} collapsible defaultExpanded density="compact" tone="subtle">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <FormField label={t('pools.modal.poolNameLabel')}>
            <Input type="text" value={poolName} onChange={(e) => setPoolName(e.target.value)} disabled={poolNotSelected} />
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.scoring.deadline')}</span>} hint={t('adminResults.scoring.deadlineHint')}>
              <Input type="datetime-local" value={deadlineLocal} onChange={(e) => setDeadlineLocal(e.target.value)} />
            </FormField>
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaDollarSign style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.scoring.entryFee')}</span>} hint={t('adminResults.scoring.entryFeeHint')}>
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
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaTrophy style={{ color: 'gold' }} />{t('adminResults.scoring.tournamentWinner')}</span>}>
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
            { labelKey: 'adminResults.config.players.subgroups.goalsByPosition', icon: <FaFutbol style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.scoring.goalGoalkeeper'), value: playerScoringConfig.goal.goalkeeper, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, goalkeeper: v } })) },
              { label: t('adminResults.players.scoring.goalDefender'), value: playerScoringConfig.goal.defender, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, defender: v } })) },
              { label: t('adminResults.players.scoring.goalMidfielder'), value: playerScoringConfig.goal.midfielder, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, midfielder: v } })) },
              { label: t('adminResults.players.scoring.goalForward'), value: playerScoringConfig.goal.forward, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, goal: { ...p.goal, forward: v } })) },
            ]},
            { labelKey: 'adminResults.config.players.subgroups.assistsByPosition', icon: <FaMagic style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.scoring.assistGoalkeeper'), value: playerScoringConfig.assist.goalkeeper, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, goalkeeper: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.assistDefender'), value: playerScoringConfig.assist.defender, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, defender: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.assistMidfielder'), value: playerScoringConfig.assist.midfielder, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, midfielder: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.assistForward'), value: playerScoringConfig.assist.forward, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, assist: { ...p.assist, forward: Math.max(0, v) } })) },
            ]},
            { labelKey: 'adminResults.config.players.subgroups.cleanSheetsByPosition', icon: <FaShieldAlt style={{ color: 'rgb(var(--fg))' }} />, fields: [
              { label: t('adminResults.players.scoring.cleanSheetGoalkeeper'), value: playerScoringConfig.cleanSheet.goalkeeper, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, goalkeeper: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.cleanSheetDefender'), value: playerScoringConfig.cleanSheet.defender, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, defender: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.cleanSheetMidfielder'), value: playerScoringConfig.cleanSheet.midfielder, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, midfielder: Math.max(0, v) } })) },
              { label: t('adminResults.players.scoring.cleanSheetForward'), value: playerScoringConfig.cleanSheet.forward, onChange: (v: number) => setPlayerScoringConfig((p) => ({ ...p, cleanSheet: { ...p.cleanSheet, forward: Math.max(0, v) } })) },
            ]},
          ].map(({ labelKey, icon, fields }) => (
            <div key={labelKey} style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <p style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.5rem' }}>{icon}{t(labelKey)}</p>
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
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><IoMdCloseCircle style={{ color: 'red' }} />{t('adminResults.players.scoring.missedPenalty')}</span>}><Input type="number" inputMode="numeric" value={playerScoringConfig.missedPenalty} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, missedPenalty: v })); }} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaStar style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.mvp')}</span>}><Input type="number" inputMode="numeric" value={playerScoringConfig.mvp} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, mvp: v })); }} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><PiBoxingGlove style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.players.scoring.penaltySaved')}</span>}><Input type="number" inputMode="numeric" value={playerScoringConfig.penaltySaved} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, penaltySaved: v })); }} /></FormField>
            </div>
          </div>

          <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.5rem' }}>{t('adminResults.config.players.subgroups.discipline')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><LuRectangleVertical style={{ color: 'yellow', fill: 'yellow' }} />{t('adminResults.players.scoring.yellowCard')}</span>} hint={t('adminResults.players.scoring.cardHint')}><Input type="number" inputMode="numeric" value={playerScoringConfig.yellowCard} onChange={(e) => { const v = Number.parseInt(e.target.value, 10); setPlayerScoringConfig((p) => ({ ...p, yellowCard: Number.isFinite(v) ? v : 0 })); }} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><LuRectangleVertical style={{ color: 'red', fill: 'red' }} />{t('adminResults.players.scoring.redCard')}</span>} hint={t('adminResults.players.scoring.cardHint')}><Input type="number" inputMode="numeric" value={playerScoringConfig.redCard} onChange={(e) => { const v = Number.parseInt(e.target.value, 10); setPlayerScoringConfig((p) => ({ ...p, redCard: Number.isFinite(v) ? v : 0 })); }} /></FormField>
            </div>
          </div>

          <div style={{ padding: '0.65rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border) / 0.7)', background: 'rgb(var(--bg-elevated) / 0.5)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', marginBottom: '0.5rem' }}>{t('adminResults.config.players.subgroups.awards')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><GiLeatherBoot style={{ color: 'gold' }} />{t('adminResults.players.scoring.goldenBoot')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.award.goldenBoot} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, award: { ...p.award, goldenBoot: Math.max(0, v) } })); }} /></FormField>
              <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaStar style={{ color: 'gold' }} />{t('adminResults.players.scoring.tournamentMvp')}</span>}><Input type="number" inputMode="numeric" min="0" value={playerScoringConfig.award.tournamentMvp} onChange={(e) => { const v = Number.parseInt(e.target.value, 10) || 0; setPlayerScoringConfig((p) => ({ ...p, award: { ...p.award, tournamentMvp: Math.max(0, v) } })); }} /></FormField>
            </div>
          </div>
        </div>
      </Section>

      {/* Danger zone */}
      {!poolNotSelected && (
        <section
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgb(var(--live) / 0.35)',
            background: 'rgb(var(--live) / 0.04)',
          }}
        >
          <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(var(--live))', marginBottom: '0.65rem' }}>
            {t('adminResults.dangerZone.title')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgb(var(--fg-muted))', lineHeight: 1.5 }}>
              {t('adminResults.dangerZone.deletePoolDescription')}
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                flexShrink: 0,
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgb(var(--live) / 0.5)',
                background: 'rgb(var(--live) / 0.08)',
                color: 'rgb(var(--live))',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgb(var(--live) / 0.15)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgb(var(--live) / 0.08)'; }}
            >
              {t('adminResults.dangerZone.deletePoolButton')}
            </button>
          </div>
        </section>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-pool-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgb(0 0 0 / 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setShowDeleteConfirm(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'rgb(var(--bg-elevated))',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgb(var(--live) / 0.35)',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h2 id="delete-pool-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'rgb(var(--fg))' }}>
              {t('adminResults.dangerZone.confirmTitle', { name: poolName || poolId })}
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgb(var(--fg-muted))', lineHeight: 1.6 }}>
              {t('adminResults.dangerZone.confirmDescription')}
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-ghost"
                style={{ fontSize: '0.875rem' }}
              >
                {t('adminResults.dangerZone.cancelButton')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePool}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'rgb(var(--live))',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting && <span className="btn-spinner" style={{ width: '0.8rem', height: '0.8rem', borderWidth: 2, borderColor: 'rgb(255 255 255 / 0.35)', borderTopColor: '#fff' }} />}
                {deleting ? t('adminResults.dangerZone.deleting') : t('adminResults.dangerZone.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
