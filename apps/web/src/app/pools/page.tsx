'use client';

import { Suspense } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PoolsScreen } from '@/components/pool/PoolsScreen';

/** The directory: every pool in the system, as a table you scan. */
export default function AllPoolsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <PoolsScreen view="all" />
      </Suspense>
    </ProtectedRoute>
  );
}
