import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-topbar-tabs-nav', `
.ds-topbar-tabs-nav{display:flex;align-items:center;gap:var(--ds-space-5);}
.ds-topbar-tab{position:relative;display:inline-flex;align-items:center;gap:6px;padding:10px 1px;border:0;background:transparent;
  font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);font-weight:var(--ds-weight-semibold);color:var(--ds-color-fg-muted);
  cursor:pointer;white-space:nowrap;text-decoration:none;transition:color var(--ds-duration-fast) var(--ds-ease-out);}
.ds-topbar-tab:hover:not(.ds-topbar-tab-active){color:var(--ds-color-fg);}
.ds-topbar-tab-active{color:var(--ds-color-fg);}
.ds-topbar-tab-active::after{content:'';position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--ds-color-accent);border-radius:var(--ds-radius-full);}
.ds-topbar-tab-icon{display:inline-flex;flex-shrink:0;}
`);

/** Section tabs that sit flush in Topbar's `tabs` slot — the typical
 * "GitHub tabs" look (underline on the active item), not a floating pill
 * container. Real navigation (each tab is a link), so the active-match
 * convention mirrors Sidebar/BottomNav exactly: pass `activeHref` and
 * `linkComponent` the same way. */
export function TopbarTabs({ items, activeHref, linkComponent = 'a', ariaLabel = 'Sections', className = '', style }) {
  const Link = linkComponent;

  return (
    <nav className={`ds-topbar-tabs-nav ${className}`.trim()} style={style} aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.href === activeHref || (Boolean(activeHref) && activeHref.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`ds-topbar-tab ${active ? 'ds-topbar-tab-active' : ''}`.trim()}
          >
            {item.icon ? <span className="ds-topbar-tab-icon" aria-hidden="true">{item.icon}</span> : null}
            {item.label}
            {item.badge}
          </Link>
        );
      })}
    </nav>
  );
}
