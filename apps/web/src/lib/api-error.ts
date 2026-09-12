interface ProblemDetails {
  status?: number;
  detail?: string;
  code?: string;
  params?: Record<string, unknown>;
}

const problemFrom = (error: unknown): ProblemDetails | undefined => {
  const body = (error as { response?: { data?: unknown } } | undefined)?.response?.data;
  return typeof body === 'object' && body !== null ? (body as ProblemDetails) : undefined;
};

/**
 * The human-readable half of an RFC 9457 response, for a toast that has a
 * translated fallback behind it.
 */
export const apiErrorDetail = (error: unknown): string | undefined => {
  const detail = problemFrom(error)?.detail;
  return typeof detail === 'string' && detail.trim() ? detail : undefined;
};

/** The translation key the API asks the client to render, when it sends one. */
export const apiErrorCode = (error: unknown): string | undefined => {
  const code = problemFrom(error)?.code;
  return typeof code === 'string' && code.trim() ? code : undefined;
};

export const apiErrorParams = (error: unknown): Record<string, unknown> | undefined =>
  problemFrom(error)?.params;
