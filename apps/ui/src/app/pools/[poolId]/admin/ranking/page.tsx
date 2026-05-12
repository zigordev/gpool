'use client';

import { useI18n } from '@/i18n/client';
import { Section } from '@/components/ui/Section';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useAdminContext, resizePrizeDistribution } from '@/contexts/AdminContext';
import { IoSettings } from 'react-icons/io5';
import { FaClock } from 'react-icons/fa';
import { FaDollarSign } from 'react-icons/fa6';
import MemberRankingPage from '../../ranking/page';

export default function AdminRankingPage() {
  const { t } = useI18n();
  const {
    poolName, setPoolName, poolNotSelected,
    deadlineLocal, setDeadlineLocal,
    entryFee, setEntryFee,
    prizeDistribution, setPrizeDistribution,
    maxPrizePaidPositions, prizeTotal, prizeTotalInvalid,
  } = useAdminContext();

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Prize config */}
      <Section
        title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><IoSettings size={13} aria-hidden />{t('adminResults.config.general.title')}</span>}
        collapsible
        defaultExpanded
        density="compact"
        tone="muted"
      >
        <div className="config-area" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <FormField label={t('pools.modal.poolNameLabel')}>
            <Input type="text" value={poolName} onChange={(e) => setPoolName(e.target.value)} disabled={poolNotSelected} />
          </FormField>
          <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.scoring.deadline')}</span>} hint={t('adminResults.scoring.deadlineHint')}>
            <Input type="datetime-local" value={deadlineLocal} onChange={(e) => setDeadlineLocal(e.target.value)} />
          </FormField>
          <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaDollarSign style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.scoring.entryFee')}</span>} hint={t('adminResults.scoring.entryFeeHint')}>
            <Input type="number" inputMode="decimal" min="0" step="0.5" value={entryFee} onChange={(e) => { const v = Number.parseFloat(e.target.value); setEntryFee(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
          </FormField>
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

      {/* Ranking table */}
      <MemberRankingPage />
    </div>
  );
}
