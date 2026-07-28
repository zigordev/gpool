import * as React from 'react';

export interface StatTileProps {
  label: React.ReactNode;
  value: React.ReactNode;
  delta?: React.ReactNode;
  direction?: 'up' | 'down' | 'flat';
  hint?: React.ReactNode;
  /** Small glyph beside the label. */
  icon?: React.ReactNode;
  tone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  /** Colours the value independently of the border — for signed numbers
   * (PnL, balance) where the value itself is the signal. */
  valueTone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  className?: string;
  style?: React.CSSProperties;
}

export declare function StatTile(props: StatTileProps): JSX.Element;
