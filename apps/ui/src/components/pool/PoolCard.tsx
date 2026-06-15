import { CountdownChip } from '@/components/ui/CountdownChip';
import { IoSettings } from 'react-icons/io5';

export function PoolCard({
  pool,
  onOpen,
  isPoolAdmin,
  isDisabled,
  requesting,
  onInvite,
  onConfigure,
  onRequestAccess,
  t,
}: Readonly<{
  pool: Pool;
  onOpen: () => void;
  isPoolAdmin: boolean;
  isDisabled: boolean;
  requesting: boolean;
  onInvite: () => void;
  onConfigure: () => void;
  onRequestAccess: () => void;
  t: (k: string, p?: Record<string, string | number>) => string;
}>) {
  const ownerLabel = pool.adminName || pool.adminEmail || t('pools.card.unknownOwner');

  const entryFee = typeof pool?.config?.entryFee === 'number' ? pool.config.entryFee : null;
  const deadline = Number(pool?.config?.deadline);
  const hasDeadline = Number.isFinite(deadline) && deadline > 0;

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
          <span className="badge" style={{ background: 'rgb(var(--surface-strong) / 0.96)', color: 'rgb(var(--pitch))', border: 'none' }}>
            {t('pools.card.members', { count: pool.memberCount || 0 })}
          </span>
          <span className="badge" style={{ background: 'rgb(var(--surface-strong) / 0.96)', color: 'rgb(var(--pitch))', border: 'none' }}>
            {t('poolDetail.info.entryFee')}: {entryFee > 0 ? `${entryFee} €` : t('poolDetail.info.entryFeeFree')}
          </span>
        </div>
        {isPoolAdmin ? (
          <div
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
                onConfigure();
              }}
              title={t('pools.actions.configuration')}
              aria-label={t('pools.actions.configuration')}
              className="btn btn-icon"
              style={{
                background: 'rgb(var(--surface-strong) / 0.96)',
                color: 'rgb(var(--fg))',
                border: 'none',
                width: '2rem',
                height: '2rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <IoSettings size={14} aria-hidden />
            </button>
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
                background: 'rgb(var(--surface-strong) / 0.96)',
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

          </div>
        ) : null}
      </div>

      <div style={{ padding: '1.1rem 1.25rem 1.25rem', textAlign: 'left' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
            marginBottom: '0.4rem',
            color: 'rgb(var(--fg))',
            textAlign: 'left',
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
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
            {hasDeadline ? <CountdownChip deadline={deadline} /> : null}
          </div>
        </div>
      </div>
    </article>
  );
}
