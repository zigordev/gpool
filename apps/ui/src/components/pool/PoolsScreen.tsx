'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/i18n/client';
import toast from 'react-hot-toast';
import { rum } from '@/lib/rum';
import { PoolCard } from './PoolCard';
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
import { Button } from '@/../design-system/components/core/Button.jsx';
import { DateField } from '@/../design-system/components/forms/DateField.jsx';
import { Modal } from '@/../design-system/components/overlay/Modal.jsx';
import { Field } from '@/../design-system/components/forms/Field.jsx';
import { Input } from '@/../design-system/components/forms/Input.jsx';
import { Table } from '@/../design-system/components/data-display/Table.jsx';
import { Badge } from '@/../design-system/components/feedback/Badge.jsx';

const CREATE_POOL_MEMBER_COUNT = 1;

export function PoolsScreen({ view }: Readonly<{ view: 'mine' | 'all' }>) {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // The two views are two destinations now, not a filter on one screen:
  // "My pools" is the landing page, "All pools" is the directory.
  const visiblePools = useMemo(() => {
    if (view === 'all') return pools;
    return pools.filter((pool) => pool.isMember || pool.adminUserId === user?.userId);
  }, [pools, view, user?.userId]);

  const maxCreatePrizePaidPositions = prizePaidPositionsLimit(CREATE_POOL_MEMBER_COUNT);
  const createPrizePoolTotal = poolEntryFee * CREATE_POOL_MEMBER_COUNT;
  const createPrizeTotal = poolPrizeDistribution.reduce((sum, row) => sum + row.amount, 0);
  const createPrizeRanks = poolPrizeDistribution.map((row) => row.rank);
  const createPrizeRanksInvalid =
    createPrizeRanks.some(
      (rank) => !Number.isInteger(rank) || rank < 1 || rank > maxCreatePrizePaidPositions,
    ) ||
    new Set(createPrizeRanks).size !== createPrizeRanks.length;
  const createPrizeTotalInvalid =
    createPrizePoolTotal > 0
      ? poolPrizeDistribution.length === 0 ||
        createPrizeRanksInvalid ||
        poolPrizeDistribution.some((row) => row.amount <= 0) ||
        Math.abs(createPrizeTotal - createPrizePoolTotal) > 0.01
      : poolPrizeDistribution.length > 0;

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

  // Opened from the Topbar's Create pool action, which links to ?create=1.
  // Keeping it in the URL means Back closes the dialog.
  const showCreateModal = searchParams.get('create') === '1';
  const closeCreate = useCallback(() => router.replace(pathname), [router, pathname]);

  // Reset the form each time the dialog is opened rather than on close, so a
  // Back-button dismissal leaves the same clean slate a Cancel does.
  useEffect(() => {
    if (!showCreateModal) return;
    setPoolName('');
    setPoolDeadlineLocal(toDateTimeLocal(DEFAULT_POOL_DEADLINE));
    setPoolEntryFee(0);
    setPoolPrizeDistribution([]);
    setCreateError(null);
  }, [showCreateModal]);

  const handleCloseCreateModal = closeCreate;

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
            payouts: poolPrizeDistribution.map((row) => ({
              rank: row.rank,
              amount: Number(row.amount.toFixed(2)),
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
      ) : view === 'all' ? (
        // The directory is a list you scan and compare, so it is a table.
        // Cards are for "my pools", where each one is a place you are going
        // back to and the badges and countdown are what you came to see.
        <Table minWidth={640} maxHeight="70vh">
          <thead>
            <tr>
              <th>{t('pools.title')}</th>
              <th className="ds-table-num">{t('poolDetail.info.members')}</th>
              <th>{t('poolDetail.info.entryFee')}</th>
              <th>{t('poolDetail.deadline.general')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visiblePools.map((pool) => {
              const isMember = pool.isMember || false;
              const isPoolAdmin = pool.userMembership?.role === 'admin';
              const isDisabled = !isMember && user?.role === 'user';
              const fee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;
              const deadline = Number(pool?.config?.deadline);
              return (
                <tr key={pool.poolId}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                      {/* The name is the link — a table row does not need a
                          separate Open button to be openable. */}
                      {isDisabled ? (
                        <span style={{ fontWeight: 600, color: 'rgb(var(--fg-muted))' }}>{pool.name}</span>
                      ) : (
                        <Link href={`/pools/${pool.poolId}`} style={{ fontWeight: 600, color: 'rgb(var(--fg))' }}>
                          {pool.name}
                        </Link>
                      )}
                      {isPoolAdmin ? <Badge variant="accent">{t('poolDetail.mode.admin')}</Badge> : null}
                      {isMember && !isPoolAdmin ? <Badge variant="success" dot>{t('pools.card.member')}</Badge> : null}
                    </span>
                  </td>
                  <td className="ds-table-num">{pool.memberCount || 0}</td>
                  <td>{fee && fee > 0 ? `${fee} €` : t('poolDetail.info.entryFeeFree')}</td>
                  <td>
                    {Number.isFinite(deadline) && deadline > 0
                      ? new Date(deadline).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {isDisabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        loading={requestingAccess === pool.poolId}
                        onClick={() => handleRequestAccess(pool.poolId)}
                      >
                        {t('pools.actions.requestAccess')}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: '1.25rem',
          }}
        >
          {visiblePools.map((pool) => {
            const isPoolAdmin = pool.userMembership?.role === 'admin';
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
                onConfigure={() => router.push(`/pools/${pool.poolId}/admin/settings`)}
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
        <Modal
          open
          onClose={handleCloseCreateModal}
          busy={creating}
          size="lg"
          title={t('pools.modal.createTitle')}
          closeLabel={t('common.cancel')}
        >

            <form onSubmit={handleSubmit}>
              <div className="config-area ds-form-compact" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
                    gap: '0.6rem',
                    alignItems: 'start',
                  }}
                >
                  <Field label={t('pools.modal.poolNameLabel')}>
                    <Input
                      type="text"
                      value={poolName}
                      onChange={(e) => setPoolName(e.target.value)}
                      placeholder={t('pools.modal.poolNamePlaceholder')}
                      disabled={creating}
                    />
                  </Field>
                  <Field
                    label={<><FaClock aria-hidden style={{ color: 'rgb(var(--fg))' }} /> {t('pools.modal.deadlineLabel')}</>}
                    hint={t('pools.modal.deadlineHint')}
                  >
                    <DateField
                      type="datetime-local"
                      value={poolDeadlineLocal}
                      onChange={(e) => setPoolDeadlineLocal(e.target.value)}
                      disabled={creating}
                    />
                  </Field>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
                    gap: '0.6rem',
                    alignItems: 'start',
                  }}
                >
                  <Field
                    label={<><FaDollarSign aria-hidden style={{ color: 'rgb(var(--fg))' }} /> {t('pools.modal.entryFeeLabel')}</>}
                    hint={t('pools.modal.entryFeeHint')}
                  >
                    <Input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.5"
                      value={poolEntryFee}
                      onChange={(e) => { const v = Number.parseFloat(e.target.value); setPoolEntryFee(Number.isFinite(v) ? Math.max(0, v) : 0); }}
                      disabled={creating}
                    />
                  </Field>
                  <Field
                    label={t('pools.modal.prizePaidPositionsLabel')}
                    hint={t('pools.modal.prizePaidPositionsHint', { count: maxCreatePrizePaidPositions })}
                  >
                    <Input
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
                    />
                  </Field>
                </div>

                <div style={{ color: createPrizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--fg-muted))', fontSize: '0.875rem', fontWeight: 600 }}>
                  {t('adminResults.scoring.prizeTotal', {
                    total: Number(createPrizeTotal.toFixed(2)),
                    available: Number(createPrizePoolTotal.toFixed(2)),
                  })}
                  {createPrizePoolTotal > 0 ? (
                    <span style={{ marginLeft: '0.5rem', color: createPrizeTotalInvalid ? 'rgb(var(--live))' : 'rgb(var(--pitch))' }}>
                      {createPrizeTotalInvalid ? t('adminResults.scoring.prizeTotalInvalid') : t('adminResults.scoring.prizeTotalValid')}
                    </span>
                  ) : null}
                </div>

                {poolPrizeDistribution.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {poolPrizeDistribution.map((row, index) => (
                      <div key={index} className="prize-payout-row">
                        <span className="prize-payout-rank">
                          {t('adminResults.scoring.prizeNumber', { number: index + 1 })}
                        </span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max={maxCreatePrizePaidPositions}
                          step="1"
                          value={row.rank}
                          aria-label={t('adminResults.scoring.prizeRankInput', { number: index + 1 })}
                          onChange={(e) => {
                            const rank = Number.parseInt(e.target.value, 10) || 0;
                            setPoolPrizeDistribution((prev) => prev.map((item, itemIndex) => (
                              itemIndex === index ? { ...item, rank } : item
                            )));
                          }}
                          disabled={creating}
                          invalid={createPrizeRanksInvalid}
                        />
                        <Input
                          type="number"
                          inputMode="decimal"
                          min="0"
                          step="0.01"
                          value={row.amount}
                          aria-label={t('adminResults.scoring.prizeAmountInput', { number: index + 1 })}
                          onChange={(e) => {
                            const value = Number.parseFloat(e.target.value);
                            const amount = Number.isFinite(value) ? Math.max(0, value) : 0;
                            setPoolPrizeDistribution((prev) => prev.map((item, itemIndex) => (
                              itemIndex === index ? { ...item, amount } : item
                            )));
                          }}
                          disabled={creating}
                          invalid={createPrizeTotalInvalid || row.amount <= 0}
                        />
                        <span className="prize-payout-hint">
                          {t('adminResults.scoring.prizePayoutHint', { rank: row.rank })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {createError ? <p className="field-error">{createError}</p> : null}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                <Button variant="ghost"
                  type="button"
                  onClick={handleCloseCreateModal}
                  disabled={creating}
                >
                  {t('common.cancel')}
                </Button>
                <Button variant="primary"
                  type="submit"
                  disabled={creating || !poolName.trim() || createPrizeTotalInvalid}
                >
                  {creating ? t('pools.actions.creating') : t('pools.actions.create')}
                </Button>
              </div>
            </form>
        </Modal>
      ) : null}

      {/* Invite User Modal */}
      {invitingPool ? (
        <Modal
          open
          onClose={handleCloseInviteModal}
          busy={inviting}
          title={t('pools.modal.inviteTitle', { poolName: invitingPool.name })}
          closeLabel={t('common.cancel')}
        >
            <form onSubmit={handleInviteSubmit}>
              <Field label={t('pools.modal.inviteEmailLabel')} error={inviteError || undefined}>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t('pools.modal.inviteEmailPlaceholder')}
                  disabled={inviting}
                  invalid={Boolean(inviteError)}
                />
              </Field>

              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                <Button variant="ghost"
                  type="button"
                  onClick={handleCloseInviteModal}
                  disabled={inviting}
                >
                  {t('common.cancel')}
                </Button>
                <Button variant="primary"
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                >
                  {inviting ? t('pools.actions.sending') : t('pools.actions.sendInvitation')}
                </Button>
              </div>
            </form>
        </Modal>
      ) : null}
    </>
  );
}


