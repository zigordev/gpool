'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  attention?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = '', invalid, attention, style, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`input ${className}`.trim()}
      style={{
        ...(attention
          ? {
              borderColor: 'rgb(var(--sunset) / 0.75)',
              boxShadow: '0 0 0 3px rgb(var(--sunset) / 0.14)',
            }
          : null),
        ...(invalid
          ? {
              borderColor: 'rgb(var(--live))',
              boxShadow: '0 0 0 3px rgb(var(--live) / 0.12)',
            }
          : null),
        ...style,
      }}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
});
