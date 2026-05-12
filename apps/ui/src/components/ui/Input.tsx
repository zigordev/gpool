'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { className = '', invalid, style, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={`input ${className}`.trim()}
      style={{
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
