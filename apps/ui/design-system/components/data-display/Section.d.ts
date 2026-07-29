import * as React from 'react';

export interface SectionProps {
  title: React.ReactNode;
  /** Small uppercase label above the title. */
  eyebrow?: React.ReactNode;
  /** Right-hand area beside the title — a count, a button. */
  trailing?: React.ReactNode;
  description?: React.ReactNode;
  /** Turns the header into a real <button> with aria-expanded/aria-controls. */
  collapsible?: boolean;
  defaultExpanded?: boolean;
  /** Pass to control expansion yourself; pairs with onExpandedChange. */
  expanded?: boolean;
  onExpandedChange?: (next: boolean) => void;
  /** @default 'default' */
  density?: 'default' | 'compact';
  /** `plain` is a bare rule-under-the-heading, for stacking inside a card. */
  tone?: 'surface' | 'subtle' | 'plain';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  contentStyle?: React.CSSProperties;
}

export declare function Section(props: SectionProps): JSX.Element;
