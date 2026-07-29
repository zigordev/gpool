import * as React from 'react';

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  /** Shown instead of hint, styled as an error. */
  error?: React.ReactNode;
  required?: boolean;
  /** Set when the control's id is managed by the caller, or when there is
   * more than one child (association can't be inferred then). */
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export declare function Field(props: FieldProps): JSX.Element;
