'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/i18n/client';
import toast from 'react-hot-toast';
import { rum } from '@/lib/rum';
import { PoolCard } from '@/components/pool/PoolCard';
import { Loading } from '@/components/Loading';
import {
  DEFAULT_POOL_DEADLINE,
  fromDateTimeLocal,
  prizePaidPositionsLimit,
  resizePrizeDistribution,
  toDateTimeLocal,
} from '@/contexts/AdminContext';
import { FaClock } from 'react-icons/fa';
import { FaDollarSign } from 'react-icons/fa6';
import { PrizePayout } from '@/types/prizePayout.type';

const CREATE_POOL_MEMBER_COUNT = 1;

function PoolsContent() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [poolDeadlineLocal, setPoolDeadlineLocal] = useState(toDateTimeLocal(DEFAULT_POOL_DEADLINE));
  const [poolEntryFee, setPoolEntryFee] = useState(0);
  const [poolPrizeDistribution, setPoolPrizeDistribution] = useState<PrizePayout[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [invitingPool, setInvitingPool] = useState<Pool | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [requestingAccess, setRequestingAccess] = useState<string | null>(null);
  const [showParticipatingOnly, setShowParticipatingOnly] = useState(false);

  const visiblePools = useMemo(() => {
    if (!showParticipatingOnly) return pools;
    return pools.filter((pool) => pool.isMember || pool.adminUserId === user?.userId);
  }, [pools, showParticipatingOnly, user?.userId]);

  const maxCreatePrizePaidPositions = prizePaidPositionsLimit(CREATE_POOL_MEMBER_COUNT);
  const createPrizeTotal = poolPrizeDistribution.reduce((sum, row) => sum + row.percentage, 0);
  const createPrizeTotalInvalid = poolPrizeDistribution.length > 0 && Math.abs(createPrizeTotal - 100) > 0.01;

  useEffect(() => {
    if (poolEntryFee !== 0) return;
    if (poolPrizeDistribution.length > 0) setPoolPrizeDistribution([]);
  }, [poolEntryFee, poolPrizeDistribution.length]);

  const fetchPools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/pools');
      setPools(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch pools:', err);
      const message = err.response?.data?.message || t('pools.errors.loadPools');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  const handleCreatePool = () => {
    setShowCreateModal(true);
    setPoolName('');
    setPoolDeadlineLocal(toDateTimeLocal(DEFAULT_POOL_DEADLINE));
    setPoolEntryFee(0);
    setPoolPrizeDistribution([]);
    setCreateError(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setPoolName('');
    setPoolDeadlineLocal(toDateTimeLocal(DEFAULT_POOL_DEADLINE));
    setPoolEntryFee(0);
    setPoolPrizeDistribution([]);
    setCreateError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolName.trim() || poolName.trim().length < 3) {
      setCreateError(t('pools.validation.nameMin'));
      return;
    }
    if (poolName.trim().length > 100) {
      setCreateError(t('pools.validation.nameMax'));
      return;
    }
    if (createPrizeTotalInvalid) {
      setCreateError(t('adminResults.errors.prizeDistributionTotal'));
      return;
    }
    try {
      setCreating(true);
      setCreateError(null);
      const prizeDistribution = poolEntryFee > 0
        ? {
            paidPositions: poolPrizeDistribution.length,
            payouts: poolPrizeDistribution.map((row, index) => ({
              rank: index + 1,
              percentage: Number(row.percentage.toFixed(2)),
            })),
          }
        : { paidPositions: 0, payouts: [] };
      const response = await apiClient.post('/pools', {
        name: poolName.trim(),
        config: {
          deadline: fromDateTimeLocal(poolDeadlineLocal),
          entryFee: poolEntryFee,
          prizeDistribution,
        },
      });
      await fetchPools();
      rum?.trackCustomEvent('Pool Created', { poolId: response.data.poolId, poolName: poolName.trim() });
      toast.success(t('pools.toast.created'));
      handleCloseCreateModal();
    } catch (err: any) {
      console.error('Failed to create pool:', err);
      const message = err.response?.data?.message || t('pools.errors.create');
      setCreateError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleInviteUser = (pool: Pool) => {
    setInvitingPool(pool);
    setInviteEmail('');
    setInviteError(null);
  };

  const handleCloseInviteModal = () => {
    setInvitingPool(null);
    setInviteEmail('');
    setInviteError(null);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitingPool) return;
    if (!inviteEmail.trim()) {
      setInviteError(t('pools.validation.emailRequired'));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError(t('pools.validation.emailInvalid'));
      return;
    }
    try {
      setInviting(true);
      setInviteError(null);
      await apiClient.post(`/pools/${invitingPool.poolId}/invite`, { email: inviteEmail.trim() });
      await fetchPools();
      rum?.trackCustomEvent('User Invited', { poolId: invitingPool.poolId, email: inviteEmail.trim() });
      toast.success(t('pools.toast.invitationSent', { email: inviteEmail.trim() }));
      handleCloseInviteModal();
    } catch (err: any) {
      console.error('Failed to invite user:', err);
      const message = err.response?.data?.message || t('pools.errors.invite');
      setInviteError(message);
      toast.error(message);
    } finally {
      setInviting(false);
    }
  };

  const handleRequestAccess = async (poolId: string) => {
    try {
      setRequestingAccess(poolId);
      await apiClient.post(`/pools/${poolId}/request-access`);
      await fetchPools();
      rum?.trackCustomEvent('Access Requested', { poolId });
      toast.success(t('pools.toast.requestSubmitted'));
    } catch (err: any) {
      console.error('Failed to request access:', err);
      const message = err.response?.data?.message || t('pools.errors.requestAccess');
      toast.error(message);
    } finally {
      setRequestingAccess(null);
    }
  };

  if (loading) {
    return (
      <main style={{ padding: 'var(--spacing-2xl)', minHeight: '60vh' }}>
        <Loading message={t('pools.loading')} />
      </main>
    );
  }

  return (
    <>
      {pools.length > 0 || user?.role === 'admin' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.75rem',
          }}
        >
          {pools.length > 0 ? (
            <div
              role="group"
              aria-label={t('pools.filters.viewMode')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid rgb(var(--border))',
                borderRadius: '999px',
                overflow: 'hidden',
                fontSize: '0.72rem',
                fontWeight: 600,
              }}
            >
              <button
                type="button"
                aria-pressed={showParticipatingOnly}
                onClick={() => setShowParticipatingOnly(true)}
                style={{
                  padding: '0.22rem 0.6rem',
                  border: 0,
                  borderRadius: 0,
                  background: showParticipatingOnly ? 'rgb(var(--fg) / 0.10)' : 'transparent',
                  color: showParticipatingOnly ? 'rgb(var(--fg))' : 'rgb(var(--fg-muted))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  lineHeight: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('pools.filters.mine')}
              </button>
              <button
                type="button"
                aria-pressed={!showParticipatingOnly}
                onClick={() => setShowParticipatingOnly(false)}
                style={{
                  padding: '0.22rem 0.6rem',
                  border: 0,
                  borderRadius: 0,
                  background: !showParticipatingOnly ? 'rgb(var(--fg) / 0.10)' : 'transparent',
                  color: !showParticipatingOnly ? 'rgb(var(--fg))' : 'rgb(var(--fg-muted))',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: 'inherit',
                  fontWeight: 'inherit',
                  lineHeight: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {t('pools.filters.all')}
              </button>
            </div>
          ) : (
            <span />
          )}

          {user?.role === 'admin' ? (
            <button type="button" onClick={handleCreatePool} className="btn btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {t('pools.actions.create')}
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <div className="field-error" role="alert" style={{ marginBottom: '1rem' }}>
          <strong>{t('common.errorLabel')}</strong> {error}
        </div>
      ) : null}

      {pools.length === 0 ? (
        <div
          className="surface"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'rgb(var(--bg-elevated) / 0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            aria-hidden
            style={{
              width: 48,
              height: 48,
              borderRadius: '999px',
              background:
                'linear-gradient(135deg, rgb(var(--accent-from) / 0.15), rgb(var(--accent-to) / 0.15))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgb(var(--accent-from))' }}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2 5 9 8 18 16 18 19 9z" />
            </svg>
          </div>
          <p style={{ color: 'rgb(var(--fg))', fontWeight: 600, marginBottom: '0.4rem' }}>
            {t('pools.empty.title')}
          </p>
          {user?.role === 'admin' ? (
            <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.9rem' }}>
              {t('pools.empty.adminHint')}
            </p>
          ) : null}
        </div>
      ) : visiblePools.length === 0 ? (
        <div
          className="surface"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            background: 'rgb(var(--bg-elevated) / 0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <p style={{ color: 'rgb(var(--fg))', fontWeight: 600, marginBottom: '0.4rem' }}>
            {t('pools.empty.participatingTitle')}
          </p>
          <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.9rem' }}>
            {t('pools.empty.participatingHint')}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: '1.25rem',
          }}
        >
          {visiblePools.map((pool) => {
            const isPoolAdmin = user?.role === 'admin' && user.userId === pool.adminUserId;
            const isMember = pool.isMember || false;
            const isDisabled = !isMember && user?.role === 'user';
            const requesting = requestingAccess === pool.poolId;

            return (
              <PoolCard
                key={pool.poolId}
                pool={pool}
                isPoolAdmin={isPoolAdmin}
                isDisabled={isDisabled}
                requesting={requesting}
                onOpen={() => {
                  if (!isDisabled) router.push(`/pools/${pool.poolId}`);
                }}
                onInvite={() => handleInviteUser(pool)}
                onRequestAccess={() => handleRequestAccess(pool.poolId)}
                t={t}
              />
            );
          })}
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreateModal ? (
        <div className="modal-overlay" onClick={handleCloseCreateModal}>
          <div className="modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontFamily: 'var(--font-display, inherit)',
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '-0.015em',
                marginBottom: '1.25rem',
              }}
            >
              {t('pools.modal.createTitle')}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="config-area" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
                    gap: '0.6rem',
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <label htmlFor="poolName" className="field-label">
                      {t('pools.modal.poolNameLabel')}
                    </label>
                    <input
                      id="poolName"
                      type="text"
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      placeholder={t('pools.modal.poolNamePlaceholder')}
                      disabled={creating}
                      className="input"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label htmlFor="poolDeadline" className="field-label">
                      <FaClock aria-hidden style={{ color: 'rgb(var(--fg))' }} />
                      {t('pools.modal.deadlineLabel')}
                    </label>
                    <input
                      id="poolDeadline"
                      type="datetime-local"
                      value={poolDeadlineLocal}
                      onChange={(e) => setPoolDeadlineLocal(e.target.value)}
                      disabled={creating}
                      className="input"
                    />
                    <p style={{ margin: '0.3rem 0 0', color: 'rgb(var(--fg-muted))', fontSize: '0.78rem' }}>
                      {t('pools.modal.deadlineHint')}
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
                    gap: '0.6rem',
                    alignItems: 'start',
                  }}
                >
                  <div>
                    <label htmlFor="poolEntryFee" className="field-label">
                      <FaDollarSign aria-hidden style={{ color: 'rgb(var(--fg))' }} />
                      {t('pools.modal.entryFeeLabel')}
                    </label>
                    <input
                      id="poolEntryFee"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      value={poolEntryFee}
                      onChange={(e) => { const v = Number.parseFloat(e.target.value); setPoolEntryFee(Number.isFinite(v) ? Math.max(0, v) : 0); }}
                      disabled={creating}
                      className="input"
                    />
                    <p style={{ margin: '0.3rem 0 0', color: 'rgb(var(--fg-muted))', fontSize: '0.78rem' }}>
                      {t('pools.modal.entryFeeHint')}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="poolPrizePaidPositions" className="field-label">
                      {t('pools.modal.prizePaidPositionsLabel')}
                    </label>
                    <input
                      id="poolPrizePaidPositions"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      max={maxCreatePrizePaidPositions}
                      value={poolPrizeDistribution.length}
                      onChange={(e) => {
                        const value = Number.parseInt(e.target.value, 10) || 0;
                        setPoolPrizeDistribution((prev) => resizePrizeDistribution(prev, value, maxCreatePrizePaidPositions));
                      }}
                      disabled={creating || poolEntryFee === 0}
                      className="input"
                    />
                    <p style={{ margin: '0.3rem 0 0', color: 'rgb(var(--fg-muted))', fontSize: '0.78rem' }}>
                      {t('pools.modal.prizePaidPositionsHint', { count: maxCreatePrizePaidPositions })}
                    </p>
                  </div>
                </div>

                <div style={{ color: createPrizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--fg-muted))', fontSize: '0.875rem', fontWeight: 600 }}>
                  {t('adminResults.scoring.prizeTotal', { total: Number(createPrizeTotal.toFixed(2)) })}
                  {poolPrizeDistribution.length > 0 ? (
                    <span style={{ marginLeft: '0.5rem', color: createPrizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--pitch))' }}>
                      {createPrizeTotalInvalid ? t('adminResults.scoring.prizeTotalInvalid') : t('adminResults.scoring.prizeTotalValid')}
                    </span>
                  ) : null}
                </div>

                {poolPrizeDistribution.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {poolPrizeDistribution.map((row, index) => (
                      <div key={row.rank} style={{ display: 'grid', gridTemplateColumns: 'minmax(7rem, 10rem) minmax(9rem, 13rem) minmax(0, 1fr)', gap: '0.65rem', alignItems: 'center' }}>
                        <span style={{ color: 'rgb(var(--fg))', fontWeight: 700, fontSize: '0.875rem' }}>
                          {t('adminResults.scoring.prizeRank', { rank: row.rank })}
                        </span>
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          max="100"
                          step="0.5"
                          value={row.percentage}
                          aria-label={t('adminResults.scoring.prizePercentage', { rank: row.rank })}
                          onChange={(e) => {
                            const value = Number.parseFloat(e.target.value);
                            const percentage = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
                            setPoolPrizeDistribution((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, percentage } : item));
                          }}
                          disabled={creating}
                          className="input"
                          style={{
                            borderColor: createPrizeTotalInvalid ? 'rgb(var(--live) / 0.75)' : undefined,
                          }}
                        />
                        <span style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.8125rem' }}>
                          {t('adminResults.scoring.prizePercentage', { rank: row.rank })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {createError ? <p className="field-error">{createError}</p> : null}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={creating}
                  className="btn btn-ghost"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating || !poolName.trim() || createPrizeTotalInvalid}
                  className="btn btn-primary"
                >
                  {creating ? t('pools.actions.creating') : t('pools.actions.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Invite User Modal */}
      {invitingPool ? (
        <div className="modal-overlay" onClick={handleCloseInviteModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2
              style={{
                fontFamily: 'var(--font-display, inherit)',
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '-0.015em',
                marginBottom: '1.25rem',
              }}
            >
              {t('pools.modal.inviteTitle', { poolName: invitingPool.name })}
            </h2>

            <form onSubmit={handleInviteSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="inviteEmail" className="field-label">
                  {t('pools.modal.inviteEmailLabel')}
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('pools.modal.inviteEmailPlaceholder')}
                  disabled={inviting}
                  className="input"
                  autoFocus
                />
                {inviteError ? <p className="field-error">{inviteError}</p> : null}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseInviteModal}
                  disabled={inviting}
                  className="btn btn-ghost"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="btn btn-primary"
                >
                  {inviting ? t('pools.actions.sending') : t('pools.actions.sendInvitation')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function PoolsPage() {
  return (
    <ProtectedRoute>
      <PoolsContent />
    </ProtectedRoute>
  );
}
