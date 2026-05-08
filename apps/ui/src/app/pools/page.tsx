'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/i18n/client';
import toast from 'react-hot-toast';
import { rum } from '@/lib/rum';
import { PoolCard } from '@/components/pool/PoolCard';
import { Loading } from '@/components/Loading';

function PoolsContent() {
  const { user } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [poolName, setPoolName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingPool, setEditingPool] = useState<Pool | null>(null);
  const [editName, setEditName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [invitingPool, setInvitingPool] = useState<Pool | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [requestingAccess, setRequestingAccess] = useState<string | null>(null);

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
    setCreateError(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setPoolName('');
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
    try {
      setCreating(true);
      setCreateError(null);
      const response = await apiClient.post('/pools', { name: poolName.trim() });
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

  const handleEditPool = (pool: Pool) => {
    setEditingPool(pool);
    setEditName(pool.name);
    setUpdateError(null);
  };

  const handleCloseEditModal = () => {
    setEditingPool(null);
    setEditName('');
    setUpdateError(null);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPool) return;
    if (!editName.trim() || editName.trim().length < 3) {
      setUpdateError(t('pools.validation.nameMin'));
      return;
    }
    if (editName.trim().length > 100) {
      setUpdateError(t('pools.validation.nameMax'));
      return;
    }
    try {
      setUpdating(true);
      setUpdateError(null);
      await apiClient.put(`/pools/${editingPool.poolId}`, { name: editName.trim() });
      await fetchPools();
      rum?.trackCustomEvent('Pool Updated', { poolId: editingPool.poolId, newName: editName.trim() });
      toast.success(t('pools.toast.updated'));
      handleCloseEditModal();
    } catch (err: any) {
      console.error('Failed to update pool:', err);
      const message = err.response?.data?.message || t('pools.errors.update');
      setUpdateError(message);
      toast.error(message);
    } finally {
      setUpdating(false);
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
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)',
              fontWeight: 700,
              letterSpacing: '-0.025em',
            }}
          >
            <span>{t('pools.title')}</span>
          </h1>
        </div>
        {user?.role === 'admin' ? (
          <button type="button" onClick={handleCreatePool} className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('pools.actions.create')}
          </button>
        ) : null}
      </header>

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
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: '1.25rem',
          }}
        >
          {pools.map((pool) => {
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
                onAdministrate={() =>
                  router.push(`/pools/admin/results?poolId=${encodeURIComponent(pool.poolId)}`)
                }
                onEdit={() => handleEditPool(pool)}
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
              {t('pools.modal.createTitle')}
            </h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
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
                  disabled={creating || !poolName.trim()}
                  className="btn btn-primary"
                >
                  {creating ? t('pools.actions.creating') : t('pools.actions.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Edit Pool Modal */}
      {editingPool ? (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
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
              {t('pools.modal.editTitle')}
            </h2>

            <form onSubmit={handleUpdateSubmit}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="editPoolName" className="field-label">
                  {t('pools.modal.poolNameLabel')}
                </label>
                <input
                  id="editPoolName"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder={t('pools.modal.poolNamePlaceholder')}
                  disabled={updating}
                  className="input"
                  autoFocus
                />
                {updateError ? <p className="field-error">{updateError}</p> : null}
              </div>

              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={updating}
                  className="btn btn-ghost"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={updating || !editName.trim() || editName.trim() === editingPool.name}
                  className="btn btn-primary"
                >
                  {updating ? t('pools.actions.updating') : t('pools.actions.update')}
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
