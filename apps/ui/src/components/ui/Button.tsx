'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'solid' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: Variant;
  size?: Size;
  iconOnly?: boolean;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  children?: ReactNode;
}

export function Button({
  variant = 'outline',
  size = 'md',
  iconOnly = false,
  loading = false,
  leadingIcon,
  trailingIcon,
  className = '',
  disabled,
  children,
  ...rest
}: Readonly<Props>) {
  const variantClass = {
    primary: 'btn-primary',
    solid: 'btn-solid',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  }[size];

  const classes = ['btn', variantClass, sizeClass, iconOnly ? 'btn-icon' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={rest.type ?? 'button'}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <span aria-hidden className="btn-spinner" />
      ) : leadingIcon ? (
        <span aria-hidden style={{ display: 'inline-flex' }}>{leadingIcon}</span>
      ) : null}
      {children}
      {trailingIcon && !loading ? (
        <span aria-hidden style={{ display: 'inline-flex' }}>{trailingIcon}</span>
      ) : null}
    </button>
  );
}
