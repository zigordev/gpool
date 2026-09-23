import { afterEach, describe, expect, it } from 'vitest';

import { contentSecurityPolicy, nonceFrom } from './csp';

describe('contentSecurityPolicy', () => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = base;
  });

  it('vouches for scripts carrying the nonce and reports everything else', () => {
    const policy = contentSecurityPolicy('bm9uY2U=');

    expect(policy).toContain("script-src 'self' 'nonce-bm9uY2U='");
    expect(policy).toContain('report-uri /rum/csp');
  });

  it('lets the page call the API on its own origin', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'https://gpool-api.zigordev.com/v1';

    expect(contentSecurityPolicy('n')).toContain(
      "connect-src 'self' https://gpool-api.zigordev.com"
    );
  });

  it('lets the country flags load from the CDN react-country-flag draws them from', () => {
    expect(contentSecurityPolicy('n')).toContain("img-src 'self' data: https://cdn.jsdelivr.net;");
  });

  it('gives back the nonce a policy carries, so a hand-written script can use it', () => {
    expect(nonceFrom(contentSecurityPolicy('bm9uY2U='))).toBe('bm9uY2U=');
    expect(nonceFrom("default-src 'self'")).toBeUndefined();
    expect(nonceFrom(null)).toBeUndefined();
  });

  it('allows only its own origin when the API address is missing or unreadable', () => {
    process.env.NEXT_PUBLIC_API_BASE_URL = 'not a url';

    expect(contentSecurityPolicy('n')).toContain("connect-src 'self';");
  });
});
