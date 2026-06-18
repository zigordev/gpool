'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { Section } from '@/components/ui/Section';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { useAdminContext, resizePrizeDistribution } from '@/contexts/AdminContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { IoSettings } from 'react-icons/io5';
import { FaClock } from 'react-icons/fa';
import { FaDollarSign } from 'react-icons/fa6';

export default function AdminRankingPage() {
  const { t } = useI18n();
  const router = useRouter();
  const {
    poolId, poolName, setPoolName,
    deadlineLocal, setDeadlineLocal,
    matchdaySeparatorTime, setMatchdaySeparatorTime,
    entryFee, setEntryFee,
    prizeDistribution, setPrizeDistribution,
    maxPrizePaidPositions, prizeTotal, prizePoolTotal, prizeRanksInvalid, prizeTotalInvalid,
  } = useAdminContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const configPairGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
    gap: '0.6rem',
    alignItems: 'start',
  };

  const handleDeletePool = async () => {
    if (!poolId) return;
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
    <div className="content-panel admin-content">

      {/* Prize config */}
      <Section
        title={<span className="admin-section-title"><IoSettings size={13} aria-hidden />{t('adminResults.config.general.title')}</span>}
        collapsible
        defaultExpanded
        density="compact"
        tone="plain"
        className="admin-section-plain"
      >
        <div className="config-area" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={configPairGrid}>
            <FormField label={t('pools.modal.poolNameLabel')}>
              <Input type="text" value={poolName} onChange={(e) => setPoolName(e.target.value)} />
            </FormField>
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.scoring.deadline')}</span>} hint={t('adminResults.scoring.deadlineHint')}>
              <Input type="datetime-local" value={deadlineLocal} onChange={(e) => setDeadlineLocal(e.target.value)} />
            </FormField>
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaClock style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.scoring.matchdaySeparatorTime')}</span>} hint={t('adminResults.scoring.matchdaySeparatorTimeHint')}>
              <Input type="time" value={matchdaySeparatorTime} onChange={(e) => setMatchdaySeparatorTime(e.target.value)} />
            </FormField>
          </div>
          <div style={configPairGrid}>
            <FormField label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><FaDollarSign style={{ color: 'rgb(var(--fg))' }} />{t('adminResults.scoring.entryFee')}</span>} hint={t('adminResults.scoring.entryFeeHint')}>
              <Input type="number" inputMode="decimal" min="0" step="0.5" value={entryFee} onChange={(e) => { const v = Number.parseFloat(e.target.value); setEntryFee(Number.isFinite(v) ? Math.max(0, v) : 0); }} />
            </FormField>
            <FormField label={t('adminResults.scoring.prizePaidPositions')} hint={t('adminResults.scoring.prizePaidPositionsHint', { count: maxPrizePaidPositions })}>
              <Input type="number" inputMode="numeric" min="0" max={maxPrizePaidPositions} value={prizeDistribution.length} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setPrizeDistribution((prev) => resizePrizeDistribution(prev, value, maxPrizePaidPositions)); }} />
            </FormField>
          </div>
          <div style={{ color: prizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--fg-muted))', fontSize: '0.875rem', fontWeight: 600 }}>
            {t('adminResults.scoring.prizeTotal', {
              total: Number(prizeTotal.toFixed(2)),
              available: Number(prizePoolTotal.toFixed(2)),
            })}
            {prizePoolTotal > 0 ? (
              <span style={{ marginLeft: '0.5rem', color: prizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--pitch))' }}>
                {prizeTotalInvalid ? t('adminResults.scoring.prizeTotalInvalid') : t('adminResults.scoring.prizeTotalValid')}
              </span>
            ) : null}
          </div>
          {prizeDistribution.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {prizeDistribution.map((row, index) => (
                <div key={index} className="prize-payout-row">
                  <span className="prize-payout-rank">{t('adminResults.scoring.prizeNumber', { number: index + 1 })}</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max={maxPrizePaidPositions}
                    step="1"
                    value={row.rank}
                    invalid={prizeRanksInvalid}
                    aria-label={t('adminResults.scoring.prizeRankInput', { number: index + 1 })}
                    onChange={(e) => {
                      const rank = Number.parseInt(e.target.value, 10) || 0;
                      setPrizeDistribution((prev) => prev.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, rank } : item
                      )));
                    }}
                  />
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={row.amount}
                    invalid={prizeTotalInvalid || row.amount <= 0}
                    aria-label={t('adminResults.scoring.prizeAmountInput', { number: index + 1 })}
                    onChange={(e) => {
                      const value = Number.parseFloat(e.target.value);
                      const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
                      setPrizeDistribution((prev) => prev.map((item, itemIndex) => (
                        itemIndex === index ? { ...item, amount } : item
                      )));
                    }}
                  />
                  <span className="prize-payout-hint">
                    {t('adminResults.scoring.prizePayoutHint', { rank: row.rank })}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </Section>

      {/* Danger zone */}
      <section
        style={{
          padding: '0.9rem 0.1rem',
          borderTop: '1px solid rgb(var(--live) / 0.35)',
          borderBottom: '1px solid rgb(var(--live) / 0.35)',
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
            }}
          >
            {t('adminResults.dangerZone.deletePoolButton')}
          </button>
        </div>
      </section>

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
              <button type="button" disabled={deleting} onClick={() => setShowDeleteConfirm(false)} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                {t('adminResults.dangerZone.cancelButton')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePool}
                className="btn btn-danger"
                style={{
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                {deleting && <span className="btn-spinner" style={{ width: '0.8rem', height: '0.8rem', borderWidth: 2 }} />}
                {deleting ? t('adminResults.dangerZone.deleting') : t('adminResults.dangerZone.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
