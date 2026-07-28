import * as React from 'react';

export interface AuthCardProps {
  /** Typically a Logo. */
  logo?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Rendered as an inline alert banner when present. */
  error?: React.ReactNode;
  /** The action area — typically a Button. */
  children?: React.ReactNode;
  /** Fine print below the action, e.g. terms text. */
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export declare function AuthCard(props: AuthCardProps): JSX.Element;
