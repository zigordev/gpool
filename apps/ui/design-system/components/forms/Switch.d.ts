import * as React from 'react';

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** Text beside the control. Without it the switch reaches assistive tech
   * unlabelled, so pass this or an `aria-label`. */
  label?: React.ReactNode;
  className?: string;
}

export declare function Switch(props: SwitchProps): JSX.Element;
