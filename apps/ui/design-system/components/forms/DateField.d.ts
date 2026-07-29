import * as React from 'react';

export interface DateFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Native input type. @default 'date' */
  type?: 'date' | 'datetime-local' | 'time' | 'month' | 'week';
  /** Red border for a failed validation. */
  invalid?: boolean;
}

export declare function DateField(props: DateFieldProps): JSX.Element;
