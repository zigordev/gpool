'use client';

import type { ReactNode } from 'react';

interface Props {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  required?: boolean;
}

export function FormField({ label, htmlFor, hint, error, required, children }: Props) {
  return (
    <div style={{ marginBottom: '0.25rem' }}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
        {required ? <span aria-hidden style={{ color: 'rgb(var(--live))', marginLeft: '0.25rem' }}>*</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p style={{ fontSize: '0.75rem', color: 'rgb(var(--fg-subtle))', marginTop: '0.4rem' }}>
          {hint}
        </p>
      ) : null}
      {error ? <p className="field-error" role="alert">{error}</p> : null}
    </div>
  );
}
