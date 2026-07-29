import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export declare function Select(props: SelectProps): JSX.Element;
