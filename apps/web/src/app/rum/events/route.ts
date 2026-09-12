import { createRumIngestRoute } from '@/observability/next';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * RUM ingest. Unauthenticated by necessity — anonymous visitors report here,
 * often during page unload — so the handler carries the same-origin check, the
 * body-size cap, the per-client rate limit and the field validation.
 */
/**
 * gpool's business events. Names only — the previous call sites passed a
 * `metadata` object containing the invitee's email address and pool names,
 * which could never become a Prometheus label and only ever sent personal data
 * to a public endpoint.
 */
export const POST = createRumIngestRoute({
  customInteractions: [
    'Pool Created',
    'User Invited',
    'Access Requested',
    'Invitation Accepted',
    'Invitation Accept Failed',
    'Access Request Accepted',
    'Access Request Accept Failed',
  ],
});
