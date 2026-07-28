import * as React from 'react';

export interface TopbarTabItem {
  href: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** e.g. a Badge for a pending/missing count. */
  badge?: React.ReactNode;
}

export interface TopbarTabsProps {
  items: TopbarTabItem[];
  activeHref: string;
  /** Link component to render each tab as, e.g. Next.js `Link`. @default 'a' */
  linkComponent?: React.ElementType;
  /** @default 'Sections' */
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export declare function TopbarTabs(props: TopbarTabsProps): JSX.Element;
