'use client';

import { useState, type ReactNode } from 'react';
import { Modal } from 'design-system/components/overlay/Modal.jsx';

export function PoolDetailModalButton({
  title,
  icon,
  label,
  disabled = false,
  children,
}: Readonly<{
  title: string;
  icon: ReactNode;
  label?: string;
  disabled?: boolean;
  children: ReactNode;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`pool-detail-modal-trigger${label ? ' pool-detail-action-trigger' : ''}`}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(event) => event.stopPropagation()}
        aria-haspopup="dialog"
        aria-label={title}
        title={title}
        style={{
          display: label ? 'inline-flex' : 'grid',
          alignSelf: 'flex-start',
          alignItems: 'center',
          justifyContent: 'center',
          placeItems: 'center',
          gap: label ? '0.4rem' : undefined,
          width: label ? 'auto' : '2.25rem',
          height: '2.25rem',
          padding: label ? '0.45rem 0.85rem' : 0,
          border: '1px solid rgb(var(--border) / 0.85)',
          borderRadius: label ? 'var(--radius-full)' : '50%',
          background: 'var(--panel-muted-bg)',
          color: 'rgb(var(--fg))',
          font: 'inherit',
          fontSize: label ? '0.78rem' : undefined,
          fontWeight: label ? 700 : undefined,
          lineHeight: label ? 1.2 : undefined,
          whiteSpace: label ? 'normal' : undefined,
          textAlign: label ? 'center' : undefined,
        }}
      >
        <span aria-hidden style={{ display: 'inline-flex' }}>{icon}</span>
        {label ? <span>{label}</span> : null}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} size="lg">
        <div
          style={{
            maxHeight: 'min(68vh, 620px)',
            minWidth: 0,
            maxWidth: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
            paddingRight: '0.2rem',
          }}
        >
          {children}
        </div>
      </Modal>
    </>
  );
}
