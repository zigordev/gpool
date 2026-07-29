import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  /** Show a small leading status dot (e.g. for a "live" indicator). */
  dot?: boolean;
  /** Small glyph before the label. Ignored when `dot` — one marker or the
   *  other, two reads as two separate signals. */
  leadingIcon?: React.ReactNode;
  children: React.ReactNode;
}

export declare function Badge(props: BadgeProps): JSX.Element;
