import React from 'react';
import { injectOnce } from '../_shared/injectStyle.js';
import { Input } from './Input.jsx';

injectOnce('ds-datefield', `
.ds-datefield::-webkit-calendar-picker-indicator{opacity:.5;cursor:pointer;transition:opacity var(--ds-duration-fast) var(--ds-ease-out);}
.ds-datefield:hover::-webkit-calendar-picker-indicator,
.ds-datefield:focus::-webkit-calendar-picker-indicator{opacity:1;}
.ds-datefield::-webkit-datetime-edit{color:var(--ds-color-fg);}
.ds-datefield:invalid::-webkit-datetime-edit{color:var(--ds-color-fg-faint);}
.ds-datefield:disabled::-webkit-calendar-picker-indicator{opacity:.3;cursor:not-allowed;}
`);

/** A date / datetime / time field, styled to match `Input` exactly.
 *
 * Deliberately the **native** control rather than a custom calendar popover.
 * The platform already gives correct locale-aware formatting, full keyboard
 * navigation, screen-reader semantics and — on mobile — the OS picker, all
 * of which a hand-rolled calendar has to re-earn and usually doesn't. What
 * was actually missing here was consistent *styling*, not a new widget: an
 * unstyled date input sits noticeably shorter and squarer than every other
 * field beside it.
 *
 * The picker icon follows the theme through `color-scheme`, which the theme
 * files set — so it turns light in dark mode without extra work.
 *
 * For a **range** with presets, this is not the component — that genuinely
 * needs a calendar surface, and is worth a real dependency rather than a
 * thin reimplementation.
 */
export function DateField({ type = 'date', className = '', ...props }) {
  return <Input type={type} className={`ds-datefield ${className}`.trim()} {...props} />;
}
