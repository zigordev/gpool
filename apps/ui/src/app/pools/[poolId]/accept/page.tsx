'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { trackEvent } from '@/observability';

function AcceptInvitationContent() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { t } = useI18n();

  const poolId =
    typeof params?.poolId === 'string'
      ? params.poolId
      : Array.isArray(params?.poolId)
      ? params.poolId[0]
      : '';

  useEffect(() => {
    if (!poolId) {
      toast.error(t('acceptInvitation.errors.invalidLink'));
      router.push('/pools');
      return;
    }

    if (!user) return;

    const accept = async () => {
      try {
        const response = await apiClient.post(`/pools/${poolId}/accept-invitation`);
        const successMessage = response.data?.message || t('acceptInvitation.success.joined');
        toast.success(successMessage);

        trackEvent('Invitation Accepted');

        globalThis.location.href = `/pools/${poolId}`;
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || error?.message || t('acceptInvitation.errors.acceptFailed');
        toast.error(errorMessage);
        trackEvent('Invitation Accept Failed');
        globalThis.location.href = '/pools';
      }
    };

    accept();
  }, [poolId, user, router, t]);

  return (
    <main
      style={{
        padding: 'var(--spacing-2xl) var(--spacing-md)',
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <span
          aria-hidden
          className="btn-spinner"
          style={{ width: 32, height: 32, borderWidth: 3, color: 'rgb(var(--accent-from))' }}
        />
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.95rem' }}>
          {t('acceptInvitation.processing')}
        </p>
      </div>
    </main>
  );
}

export default function AcceptInvitationPage() {
  return (
    <ProtectedRoute>
      <AcceptInvitationContent />
    </ProtectedRoute>
  );
}
