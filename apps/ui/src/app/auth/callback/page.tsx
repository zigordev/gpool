'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function AuthCallbackPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { checkAuth } = useAuth();
    const { t } = useI18n();
    const [status, setStatus] = useState(() => t('authCallback.processing'));

    useEffect(() => {
        const processCallback = async () => {
            const error = searchParams.get('error');

            if (error) {
                router.replace(`/login?error=${encodeURIComponent(error)}`);
                return;
            }

            setStatus(t('authCallback.authenticating'));

            try {
                await checkAuth();
                router.replace('/pools');
            } catch {
                router.replace('/login?error=auth_verification_failed');
            }
        };

        processCallback();
    }, [searchParams, router, checkAuth, t]);

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <p>{status}</p>
        </div>
    );
}

export default function AuthCallbackPage() {
    const { t } = useI18n();

    return (
        <Suspense
            fallback={
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <p>{t('authCallback.processing')}</p>
                </div>
            }
        >
            <AuthCallbackPageContent />
        </Suspense>
    );
}
