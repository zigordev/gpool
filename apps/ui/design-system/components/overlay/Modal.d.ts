import * as React from 'react';

export interface ModalProps {
  open: boolean;
  /** Required: Esc, the overlay and the close button all route through it. */
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Disables every way out while a submit is in flight. */
  busy?: boolean;
  /** 420 / 520 / 720px. @default 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible name for the close button; translate it. @default 'Close' */
  closeLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export declare function Modal(props: ModalProps): JSX.Element | null;
