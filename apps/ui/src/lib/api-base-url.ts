const DEFAULT_API_BASE_URL = 'http://localhost:3010';

export function getApiBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const normalized = (explicit || DEFAULT_API_BASE_URL).replace(/\/+$/g, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}
