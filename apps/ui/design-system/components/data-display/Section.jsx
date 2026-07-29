import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';
import { Icon } from '../icons/Icon.jsx';

injectOnce('ds-section', `
.ds-section{min-width:0;font-family:var(--ds-font-sans);color:var(--ds-color-fg);}
.ds-section-surface{background:var(--ds-color-surface);border:1px solid var(--ds-color-border);border-radius:var(--ds-radius-lg);}
.ds-section-subtle{background:var(--ds-color-surface-2);border:1px solid var(--ds-color-border);border-radius:var(--ds-radius-lg);}
.ds-section-plain{border-bottom:1px solid var(--ds-color-border);}
.ds-section-default{padding:24px;}
.ds-section-compact{padding:10px 12px;}
.ds-section-head{display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%;}
.ds-section-headbtn{appearance:none;border:0;padding:0;margin:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;}
.ds-section-eyebrow{font-size:var(--ds-text-xs);font-weight:var(--ds-weight-bold);letter-spacing:var(--ds-tracking-wide);text-transform:uppercase;color:var(--ds-color-fg-subtle);margin-bottom:6px;}
.ds-section-title{margin:0;font-weight:var(--ds-weight-bold);letter-spacing:-0.01em;color:var(--ds-color-fg);}
.ds-section-default .ds-section-title{font-size:var(--ds-text-xl);}
.ds-section-compact .ds-section-title{font-size:var(--ds-text-sm);}
.ds-section-description{margin:6px 0 0;font-size:var(--ds-text-sm);line-height:1.5;color:var(--ds-color-fg-muted);}
.ds-section-trailing{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.ds-section-chevron{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:999px;background:var(--ds-color-surface-2);color:var(--ds-color-fg-muted);transition:transform var(--ds-duration-fast) var(--ds-ease-out);}
.ds-section-plain .ds-section-chevron{background:transparent;}
.ds-section-body{border-top:1px solid var(--ds-color-border);}
.ds-section-default .ds-section-body{margin-top:20px;padding-top:20px;}
.ds-section-compact .ds-section-body{margin-top:8px;padding-top:8px;}
`);

/** A titled block of content, optionally collapsible.
 *
 * This is the shape every screen in these apps reaches for — an eyebrow, a
 * title, something on the right (a count, an action), a description, and a
 * rule above the content. It existed eight times over in gpool before it
 * lived here.
 *
 * When `collapsible`, the header is a real `<button>` carrying
 * `aria-expanded` and `aria-controls`. A `div` with `role="button"` and a
 * hand-rolled Enter/Space handler is the usual shortcut and it loses the
 * things a button gives for free.
 */
export function Section({
  title,
  eyebrow,
  trailing,
  description,
  collapsible = false,
  defaultExpanded = true,
  expanded,
  onExpandedChange,
  density = 'default',
  tone = 'surface',
  children,
  className = '',
  style,
  contentStyle,
}) {
  const [internal, setInternal] = React.useState(defaultExpanded);
  const isOpen = expanded ?? internal;
  const bodyId = React.useId();

  const toggle = () => {
    if (expanded === undefined) setInternal((v) => !v);
    onExpandedChange?.(!isOpen);
  };

  const heading = (
    <div style={{ minWidth: 0, flex: 1 }}>
      {eyebrow ? <div className="ds-section-eyebrow">{eyebrow}</div> : null}
      <h2 className="ds-section-title">{title}</h2>
      {description ? <p className="ds-section-description">{description}</p> : null}
    </div>
  );

  const cls = ['ds-section', `ds-section-${density}`, `ds-section-${tone}`, className]
    .filter(Boolean).join(' ');

  return (
    <section className={cls} style={style}>
      <div className="ds-section-head">
        {collapsible ? (
          <button
            type="button"
            className="ds-section-headbtn"
            onClick={toggle}
            aria-expanded={isOpen}
            aria-controls={bodyId}
            style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}
          >
            {heading}
            <span
              className="ds-section-chevron"
              aria-hidden="true"
              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <Icon name="chevron-down" size={12} />
            </span>
          </button>
        ) : heading}
        {trailing ? <div className="ds-section-trailing">{trailing}</div> : null}
      </div>
      {!collapsible || isOpen ? (
        <div id={bodyId} className="ds-section-body" style={contentStyle}>
          {children}
        </div>
      ) : null}
    </section>
  );
}
