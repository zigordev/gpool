import * as React from 'react';

export interface AuthShellProps {
  children?: React.ReactNode;
  /** Rendered top-right, e.g. ThemeButton + LanguageButton. */
  utilities?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export declare function AuthShell(props: AuthShellProps): JSX.Element;
