'use client';

import { useI18n } from '@/i18n/client';

export function PlayerEliminatedBadge() {
  const { t } = useI18n();

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        width: 'fit-content',
        maxWidth: '100%',
        padding: '0.16rem 0.46rem',
        borderRadius: '999px',
        border: '1px solid rgb(var(--live) / 0.68)',
        background: 'rgb(var(--live) / 0.18)',
        color: 'rgb(var(--live))',
        boxShadow: '0 0 0 2px rgb(var(--live) / 0.08)',
        fontSize: '0.66rem',
        fontWeight: 850,
        letterSpacing: '0.04em',
        lineHeight: 1.2,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {t('poolDetail.players.eliminated')}
    </span>
  );
}
