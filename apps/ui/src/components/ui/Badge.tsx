'use client';

import type { HTMLAttributes, ReactNode } from 'react';

type Variant = 'pitch' | 'sunset' | 'neutral' | 'live' | 'gold' | 'info';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  children: ReactNode;
  leadingIcon?: ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  children,
  leadingIcon,
  className = '',
  ...rest
}: Props) {
  const variantClass = {
    pitch: 'badge-pitch',
    sunset: 'badge-sunset',
    neutral: 'badge-neutral',
    live: 'badge-live',
    gold: 'badge-gold',
    info: 'badge-info',
  }[variant];

  return (
    <span className={`badge ${variantClass} ${className}`.trim()} {...rest}>
      {leadingIcon ? <span aria-hidden style={{ display: 'inline-flex' }}>{leadingIcon}</span> : null}
      {children}
    </span>
  );
}
