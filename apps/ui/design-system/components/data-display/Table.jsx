import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';

injectOnce('ds-table', `
.ds-table-frame{min-width:0;max-width:100%;overflow:clip;border:1px solid var(--ds-color-border);border-radius:var(--ds-radius-lg);background:var(--ds-color-surface);}
.ds-table-scroll{width:100%;max-width:100%;min-width:0;overflow:auto;scrollbar-gutter:stable;}
.ds-table{width:100%;border-collapse:collapse;font-family:var(--ds-font-sans);font-size:var(--ds-text-sm);color:var(--ds-color-fg);}
.ds-table-strip{padding:8px 12px;background:var(--ds-color-surface-2);border-bottom:1px solid var(--ds-color-border);}
.ds-table-strip-bottom{border-bottom:0;border-top:1px solid var(--ds-color-border);}
/* Only a string caption gets label typography — uppercasing a strip that
   holds a search box would uppercase the search box. */
.ds-table-caption{color:var(--ds-color-fg-subtle);font-family:var(--ds-font-sans);font-size:var(--ds-text-xs);font-weight:var(--ds-weight-bold);letter-spacing:var(--ds-tracking-wide);text-transform:uppercase;}
.ds-table th{position:sticky;top:0;z-index:1;background:var(--ds-color-surface-2);padding:10px 12px;text-align:left;font-size:var(--ds-text-xs);font-weight:var(--ds-weight-bold);letter-spacing:var(--ds-tracking-wide);text-transform:uppercase;color:var(--ds-color-fg-subtle);border-bottom:1px solid var(--ds-color-border);white-space:nowrap;}
.ds-table td{padding:10px 12px;border-bottom:1px solid var(--ds-color-border);vertical-align:middle;}
.ds-table tbody tr:last-child td{border-bottom:0;}
/* For stat tables. An 11-column standings grid spends ~260px on horizontal
   padding at the default, which is the difference between fitting on a phone
   and not. */
.ds-table-compact th,.ds-table-compact td{padding:7px 7px;}
.ds-table-compact td{font-size:var(--ds-text-xs);}
.ds-table-hoverable tbody tr:hover td{background:var(--ds-color-surface-2);}
/* Two classes deep on purpose: .ds-table th already sets text-align:left and
   would otherwise out-specify a single .ds-table-num, leaving a numeric
   column's header sitting left of its own right-aligned numbers. */
.ds-table .ds-table-num{text-align:right;font-variant-numeric:tabular-nums;}
`);

/** Presentational table: the frame, the scroll container, and header/cell
 * styling driven by tokens.
 *
 * Deliberately **not** a data grid. Sorting, pagination, column visibility
 * and virtualisation are a different problem, well solved by TanStack Table,
 * and the operator console already uses it — reimplementing that here would
 * be strictly worse. Pair this with whatever table engine you like, or use
 * it bare for a table that just needs to look right.
 *
 * The header is always sticky; `maxHeight` is what gives it something to
 * stick against, by capping the scroll container.
 */
export function Table({ caption, footer, minWidth, maxHeight, density = 'default', hoverable = true, children, className = '', style }) {
  return (
    <div className={`ds-table-frame ${className}`.trim()} style={style}>
      {caption ? (
        <div className={`ds-table-strip ${typeof caption === 'string' ? 'ds-table-caption' : ''}`.trim()}>
          {caption}
        </div>
      ) : null}
      <div className="ds-table-scroll" style={maxHeight ? { maxHeight } : undefined}>
        <table
          className={`ds-table ${density === 'compact' ? 'ds-table-compact' : ''} ${hoverable ? 'ds-table-hoverable' : ''}`.replace(/\s+/g, ' ').trim()}
          style={minWidth ? { minWidth } : undefined}
        >
          {children}
        </table>
      </div>
      {footer ? <div className="ds-table-strip ds-table-strip-bottom">{footer}</div> : null}
    </div>
  );
}
