import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Draws a danger-colored border, e.g. after failed validation. */
  invalid?: boolean;
}

export declare function Input(props: InputProps): JSX.Element;
