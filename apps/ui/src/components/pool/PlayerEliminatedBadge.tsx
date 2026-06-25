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
        padding: '0.1rem 0.34rem',
        borderRadius: '999px',
        border: '1px solid rgb(var(--live) / 0.36)',
        background: 'rgb(var(--live) / 0.12)',
        color: 'rgb(var(--live))',
        fontSize: '0.62rem',
        fontWeight: 750,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {t('poolDetail.players.eliminated')}
    </span>
  );
}
