'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PoolsScreen } from '@/components/pool/PoolsScreen';

/** The landing page: the pools you are actually in, as cards.
 *
 * This used to redirect to /pools, so signing in dropped you in the whole
 * directory — mostly pools you have nothing to do with. */
export default function HomePage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <PoolsScreen view="mine" />
      </Suspense>
    </ProtectedRoute>
  );
}
