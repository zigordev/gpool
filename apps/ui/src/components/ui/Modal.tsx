'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  /** Footer area — typically your action buttons. */
  footer?: ReactNode;
  /** Disables Esc / overlay close. Use during submit. */
  busy?: boolean;
  /** Visual width preset. */
  size?: 'sm' | 'md' | 'lg';
  /** Optional id, otherwise auto. */
  labelId?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  busy = false,
  size = 'md',
  labelId,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const generatedId = useStableId();
  const titleId = labelId ?? `modal-title-${generatedId}`;

  // Focus trap + Esc + restore focus
  useEffect(() => {
    if (!open) return;

    lastFocusedRef.current = document.activeElement as HTMLElement | null;

    // Focus first focusable element inside dialog
    const dialog = dialogRef.current;
    if (dialog) {
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      requestAnimationFrame(() => first?.focus());
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!busy) {
          event.stopPropagation();
          onClose();
        }
        return;
      }
      if (event.key === 'Tab' && dialog) {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const firstEl = focusable[0]!;
        const lastEl = focusable[focusable.length - 1]!;
        const active = document.activeElement;
        if (event.shiftKey && active === firstEl) {
          event.preventDefault();
          lastEl.focus();
        } else if (!event.shiftKey && active === lastEl) {
          event.preventDefault();
          firstEl.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      requestAnimationFrame(() => lastFocusedRef.current?.focus());
    };
  }, [open, busy, onClose]);

  if (!open || typeof document === 'undefined') return null;

  const maxWidth = { sm: '420px', md: '520px', lg: '720px' }[size];

  return createPortal(
    <div
      className="modal-overlay"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: description ? '0.4rem' : '1.25rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              id={titleId}
              style={{
                width: '100%',
                fontFamily: 'var(--font-display, inherit)',
                fontSize: '1.4rem',
                fontWeight: 700,
                letterSpacing: '-0.015em',
                color: 'rgb(var(--fg))',
              }}
            >
              {title}
            </h2>
            {description ? (
              <p style={{ fontSize: '0.875rem', color: 'rgb(var(--fg-muted))', marginTop: '0.4rem', lineHeight: 1.5 }}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="btn btn-ghost btn-icon"
            style={{ flexShrink: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        {description ? <div style={{ marginBottom: '1.25rem' }} /> : null}

        <div className="modal-body">{children}</div>

        {footer ? (
          <div
            style={{
              display: 'flex',
              gap: '0.625rem',
              justifyContent: 'flex-end',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgb(var(--border-subtle))',
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

let _idCounter = 0;
function useStableId() {
  const ref = useRef<number | null>(null);
  if (ref.current === null) {
    _idCounter += 1;
    ref.current = _idCounter;
  }
  return ref.current;
}
