function apiOrigin(): string | undefined {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!base) return undefined;
  try {
    return new URL(base).origin;
  } catch {
    return undefined;
  }
}

export function contentSecurityPolicy(nonce: string): string {
  const connect = ["'self'", apiOrigin()].filter(Boolean).join(' ');

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data:",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'nonce-${nonce}'`,
    `connect-src ${connect}`,
    'report-uri /rum/csp',
  ].join('; ');
}

export function nonceFrom(policy: string | null | undefined): string | undefined {
  return policy?.match(/'nonce-([^']+)'/)?.[1];
}
