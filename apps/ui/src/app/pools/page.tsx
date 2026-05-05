'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useI18n } from '@/i18n/client';
import toast from 'react-hot-toast';
import { rum } from '@/lib/rum';

interface Pool {
  poolId: string;
  name: string;
  description?: string;
  adminUserId: string;
  adminName?: string;
  adminEmail?: string;
  memberCount?: number;
  createdAt: number;
  isMember?: boolean;
  userMembership?: any;
  config: any;
}

function ownerInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0] + parts[1]![0]).toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

function PoolCard({
  pool,
  isPoolAdmin,
  isMember,
  isDisabled,
  requesting,
  onOpen,
  onAdministrate,
  onEdit,
  onInvite,
  onRequestAccess,
  t,
}: {
  pool: Pool;
  isPoolAdmin: boolean;
  isMember: boolean;
  isDisabled: boolean;
  requesting: boolean;
  onOpen: () => void;
  onAdministrate: () => void;
  onEdit: () => void;
  onInvite: () => void;
  onRequestAccess: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const ownerLabel = pool.adminName || pool.adminEmail || t('pools.card.unknownOwner');

  const entryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;

  return (
    <article
      onClick={onOpen}
      role={isDisabled ? undefined : 'button'}
      tabIndex={isDisabled ? -1 : 0}
      onKeyDown={(e) => {
        if (isDisabled) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-disabled={isDisabled || undefined}
      className={`card ${isDisabled ? 'card-disabled' : 'card-interactive'}`}
      style={{ padding: 0, overflow: 'hidden' }}
    >
      <div className="pool-cover">
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '0.65rem 0.85rem',
            zIndex: 1,
          }}
        >
          <span className="badge" style={{ background: 'rgb(255 255 255 / 0.95)', color: 'rgb(var(--pitch))', border: 'none' }}>
            {t('pools.card.members', { count: pool.memberCount || 0 })}
          </span>
          {entryFee !== null ? (
            <>
              <span className="badge" style={{ background: 'rgb(255 255 255 / 0.95)', color: 'rgb(var(--pitch))', border: 'none' }}>
                {t('poolDetail.info.entryFee')}: {entryFee > 0 ? `${entryFee} €` : t('poolDetail.info.entryFeeFree')}
              </span>
            </>
          ) : null}
        </div>
        {isPoolAdmin ? (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              display: 'flex',
              gap: '0.25rem',
              zIndex: 2,
            }}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInvite();
              }}
              title={t('pools.actions.inviteTitle')}
              aria-label={t('pools.actions.inviteTitle')}
              className="btn btn-icon"
              style={{
                background: 'rgb(255 255 255 / 0.95)',
                color: 'rgb(var(--fg))',
                border: 'none',
                width: '2rem',
                height: '2rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zm0 2a6 6 0 00-6 1 1 1 0 001 1h10a1 1 0 001-1 6 6 0 00-6-1zm8-4a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              title={t('pools.actions.editTitle')}
              aria-label={t('pools.actions.editTitle')}
              className="btn btn-icon"
              style={{
                background: 'rgb(255 255 255 / 0.95)',
                color: 'rgb(var(--fg))',
                border: 'none',
                width: '2rem',
                height: '2rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l6.286-6.286z" />
              </svg>
            </button>
          </div>
        ) : null}
      </div>

      <div style={{ padding: '1.1rem 1.25rem 1.25rem' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            marginBottom: '0.4rem',
            color: 'rgb(var(--fg))',
          }}
        >
          {pool.name}
        </h3>
        {pool.description ? (
          <p
            style={{
              color: 'rgb(var(--fg-muted))',
              fontSize: '0.9rem',
              marginBottom: '0.85rem',
              lineHeight: 1.5,
            }}
          >
            {pool.description}
          </p>
        ) : null}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid rgb(var(--border-subtle))',
          }}
        >
          <span
            aria-hidden
            className="avatar"
            style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.7rem' }}
          >
            {ownerInitials(ownerLabel)}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgb(var(--fg-subtle))',
                lineHeight: 1.2,
              }}
            >
              {t('pools.card.owner')}
            </span>
            <span
              style={{
                fontSize: '0.875rem',
                color: 'rgb(var(--fg))',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {ownerLabel}
            </span>
          </div>

          {isDisabled ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRequestAccess();
              }}
              disabled={requesting}
              className="btn btn-outline btn-sm"
            >
              {requesting ? t('pools.actions.requesting') : t('pools.actions.requestAccess')}
            </button>
          ) : null}
          {isPoolAdmin ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAdministrate();
              }}
              className="btn btn-primary btn-sm"
            >
              {t('pools.actions.administrate')}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

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

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
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
  };

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
      <main
        style={{
          padding: '4rem 1.25rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <p style={{ color: 'rgb(var(--fg-muted))', fontWeight: 500 }}>{t('pools.loading')}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        position: 'relative',
        minHeight: 'calc(100vh - 4rem)',
        background: 'rgb(var(--bg))',
      }}
    >
      <div
        aria-hidden
        className="bg-mesh"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      />

      <div className="container-app" style={{ position: 'relative' }}>
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
            <p className="eyebrow" style={{ marginBottom: '0.4rem' }}>
              {t('pools.title')}
            </p>
            <h1
              style={{
                fontSize: 'clamp(1.85rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '-0.025em',
              }}
            >
              <span className="gradient-text">{t('pools.subtitle')}</span>
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
                  isMember={isMember}
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
      </div>

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
    </main>
  );
}

export default function PoolsPage() {
  return (
    <ProtectedRoute>
      <PoolsContent />
    </ProtectedRoute>
  );
}
