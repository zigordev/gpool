import { withRouteMetrics } from '@/observability/http-metrics';
import { createRumIngestRoute } from '@/observability/next';
import { RUM_VOCABULARY } from '@/observability/rum-vocabulary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withRouteMetrics('/rum/events', createRumIngestRoute(RUM_VOCABULARY));
