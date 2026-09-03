'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { trackEvent } from '@/observability';
import { Button } from '../../../../../../design-system/components/core/Button.jsx';

type Status = 'pending' | 'success' | 'error';

const STATUS_TONE: Record<Status, { iconBg: string; iconFg: string }> = {
  pending: { iconBg: 'rgb(var(--info) / 0.10)', iconFg: 'rgb(var(--info))' },
  success: { iconBg: 'rgb(var(--pitch) / 0.10)', iconFg: 'rgb(var(--pitch))' },
  error: { iconBg: 'rgb(var(--live) / 0.10)', iconFg: 'rgb(var(--live))' },
};

function StatusIcon({ status }: Readonly<{ status: Status }>) {
  const tone = STATUS_TONE[status];
  return (
    <div
      aria-hidden
      style={{
        width: 64,
        height: 64,
        borderRadius: '999px',
        background: tone.iconBg,
        color: tone.iconFg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem',
      }}
    >
      {status === 'pending' ? (
        <span className="btn-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      ) : status === 'success' ? (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      )}
    </div>
  );
}

function AcceptAccessRequestContent() {
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
  const userId =
    typeof params?.userId === 'string'
      ? params.userId
      : Array.isArray(params?.userId)
      ? params.userId[0]
      : '';

  const [status, setStatus] = useState<Status>('pending');
  const [message, setMessage] = useState<string>(() => t('acceptRequest.processingMessage'));

  useEffect(() => {
    if (!poolId || !userId) {
      setStatus('error');
      setMessage(t('acceptRequest.errors.invalidLink'));
      toast.error(t('acceptRequest.errors.invalidLink'));
      return;
    }

    if (!user) return;

    const acceptRequest = async () => {
      try {
        const response = await apiClient.post(`/pools/${poolId}/accept-request/${userId}`);
        const successMessage = response.data?.message || t('acceptRequest.success.accepted');
        setStatus('success');
        setMessage(successMessage);
        toast.success(successMessage);

        trackEvent('Access Request Accepted');

        setTimeout(() => router.push(`/pools/${poolId}`), 1500);
      } catch (error: any) {
        const errorMessage =
          error?.response?.data?.message || error?.message || t('acceptRequest.errors.acceptFailed');
        setStatus('error');
        setMessage(errorMessage);
        toast.error(errorMessage);

        trackEvent('Access Request Accept Failed');
      }
    };

    acceptRequest();
  }, [poolId, userId, user, router, t]);

  const heading =
    status === 'pending'
      ? t('acceptRequest.heading.pending')
      : status === 'success'
      ? t('acceptRequest.heading.success')
      : t('acceptRequest.heading.error');

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
      <section
        className="surface"
        style={{
          maxWidth: 480,
          width: '100%',
          padding: '2.25rem 2rem',
          textAlign: 'center',
        }}
      >
        <StatusIcon status={status} />
        <h1
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '1.6rem',
            fontWeight: 700,
            letterSpacing: '-0.015em',
            color: 'rgb(var(--fg))',
            margin: '0 0 0.6rem',
            lineHeight: 1.15,
          }}
        >
          {heading}
        </h1>
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
          {message}
        </p>
        {status === 'pending' ? null : (
          <Button
            variant={status === 'error' ? 'outline' : 'primary'}
            onClick={() => router.push(`/pools/${poolId}`)}
          >
            {t('acceptRequest.actions.goToPools')}
          </Button>
        )}
      </section>
    </main>
  );
}

export default function AcceptAccessRequestPage() {
  return (
    <ProtectedRoute>
      <AcceptAccessRequestContent />
    </ProtectedRoute>
  );
}
