'use client';

import { useState, type ReactNode } from 'react';
import { Modal } from '@/components/ui/Modal';

export function PoolDetailModalButton({
  title,
  icon,
  children,
}: Readonly<{
  title: string;
  icon: ReactNode;
  children: ReactNode;
}>) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="pool-detail-modal-trigger"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={(event) => event.stopPropagation()}
        aria-haspopup="dialog"
        aria-label={title}
        title={title}
        style={{
          display: 'grid',
          alignSelf: 'flex-start',
          placeItems: 'center',
          width: '2.25rem',
          height: '2.25rem',
          padding: 0,
          border: '1px solid rgb(var(--border) / 0.5)',
          borderRadius: '50%',
          background: 'var(--panel-muted-bg)',
          color: 'rgb(var(--fg))',
          font: 'inherit',
          cursor: 'pointer',
        }}
      >
        <span aria-hidden style={{ display: 'inline-flex' }}>{icon}</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={title} size="lg">
        <div style={{ maxHeight: 'min(68vh, 620px)', overflowY: 'auto', paddingRight: '0.2rem' }}>
          {children}
        </div>
      </Modal>
    </>
  );
}
