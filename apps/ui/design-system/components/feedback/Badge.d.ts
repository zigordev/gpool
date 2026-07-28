import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info';
  /** Show a small leading status dot (e.g. for a "live" indicator). */
  dot?: boolean;
  children: React.ReactNode;
}

export declare function Badge(props: BadgeProps): JSX.Element;
