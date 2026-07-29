import React from 'react';
import { createPortal } from 'react-dom';
import { injectOnce } from '../_shared/injectStyle.js';
import { Button } from '../core/Button.jsx';
import { Icon } from '../icons/Icon.jsx';

injectOnce('ds-modal', `
.ds-modal-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:20px;background:oklch(15% 0.01 264 / 0.5);backdrop-filter:blur(3px);}
.ds-modal{width:100%;max-height:min(90vh, calc(100vh - 40px));overflow-y:auto;background:var(--ds-color-surface);border:1px solid var(--ds-color-border);border-radius:var(--ds-radius-xl);box-shadow:var(--ds-shadow-xl);padding:24px;font-family:var(--ds-font-sans);color:var(--ds-color-fg);}
.ds-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
.ds-modal-title{margin:0;font-size:var(--ds-text-lg);font-weight:var(--ds-weight-bold);letter-spacing:-0.015em;color:var(--ds-color-fg);}
.ds-modal-description{margin:6px 0 0;font-size:var(--ds-text-sm);line-height:1.5;color:var(--ds-color-fg-muted);}
.ds-modal-body{margin-top:20px;}
.ds-modal-footer{display:flex;justify-content:flex-end;gap:10px;margin-top:24px;padding-top:20px;border-top:1px solid var(--ds-color-border);}
`);

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const WIDTHS = { sm: 420, md: 520, lg: 720 };

/** A modal dialog: portalled, focus-trapped, and dismissible.
 *
 * The behaviour here is the point. A dialog that does not trap focus lets
 * Tab wander into the page behind it; one that does not restore focus on
 * close leaves a keyboard user at the top of the document; one rendered in
 * place rather than through a portal gets clipped by any ancestor with
 * `overflow` or its own stacking context. All three are invisible to a
 * mouse user and immediately broken for everyone else, so none of them are
 * optional.
 *
 * `busy` closes every exit — Esc, the overlay, the close button — for the
 * duration of a submit, so an in-flight request cannot be abandoned by a
 * stray keypress.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  busy = false,
  size = 'md',
  closeLabel = 'Close',
  className = '',
  style,
}) {
  const dialogRef = React.useRef(null);
  const lastFocusedRef = React.useRef(null);
  const titleId = React.useId();

  // Held in refs so the effect below can depend on `open` alone. Callers pass
  // onClose as an inline arrow, so depending on it re-runs the effect every
  // render — and each cleanup pass would haul focus back out of the dialog
  // and overwrite the element we are supposed to return focus to.
  const onCloseRef = React.useRef(onClose);
  const busyRef = React.useRef(busy);
  React.useEffect(() => { onCloseRef.current = onClose; busyRef.current = busy; });

  React.useEffect(() => {
    if (!open) return undefined;

    lastFocusedRef.current = document.activeElement;
    const dialog = dialogRef.current;
    if (dialog) {
      const first = dialog.querySelectorAll(FOCUSABLE)[0];
      requestAnimationFrame(() => first?.focus());
    }

    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (!busyRef.current) {
          event.stopPropagation();
          onCloseRef.current();
        }
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = dialog.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => lastFocusedRef.current?.focus());
    };
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="ds-modal-overlay" onClick={() => { if (!busy) onClose(); }}>
      <div
        ref={dialogRef}
        className={`ds-modal ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        style={{ maxWidth: WIDTHS[size] ?? WIDTHS.md, ...style }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ds-modal-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            {title ? <h2 className="ds-modal-title" id={titleId}>{title}</h2> : null}
            {description ? <p className="ds-modal-description">{description}</p> : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={closeLabel}
            style={{ flexShrink: 0 }}
          >
            <Icon name="x" size={14} />
          </Button>
        </div>

        <div className="ds-modal-body">{children}</div>

        {footer ? <div className="ds-modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
