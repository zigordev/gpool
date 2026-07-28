import * as React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  style?: React.CSSProperties;
}

export declare function EmptyState(props: EmptyStateProps): JSX.Element;
