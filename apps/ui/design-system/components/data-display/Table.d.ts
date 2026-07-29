import * as React from 'react';

export interface TableProps {
  /** Strip above the header row. A string gets uppercase label typography;
   *  any other node is left alone, so it can hold filters or a search box. */
  caption?: React.ReactNode;
  /** Strip below the table, in the same frame — pagination, totals, a count. */
  footer?: React.ReactNode;
  /** Floor for the table's width — below it, the frame scrolls horizontally
   *  instead of crushing columns. Required for frozen (sticky-left) columns
   *  to be worth anything. */
  minWidth?: number | string;
  /** Caps the scroll container's height, which is what makes the always-sticky header stick. */
  maxHeight?: number | string;
  /** `compact` tightens cell padding for stat tables — the kind with ten
   *  numeric columns, where default padding is what pushes it off-screen.
   *  @default 'default' */
  density?: 'default' | 'compact';
  /** Row hover highlight. @default true */
  hoverable?: boolean;
  /** `<thead>` / `<tbody>` — the table's own markup. */
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export declare function Table(props: TableProps): JSX.Element;
