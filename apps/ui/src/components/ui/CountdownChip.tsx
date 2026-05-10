'use client';

import { useI18n } from '@/i18n/client';
import { useEffect, useState } from 'react';

interface Props {
  deadline: number;
}

function formatRemaining(diffMs: number): { value: string; } {
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = totalSeconds / 60;
  const totalHours = totalMinutes / 60;
  const totalDays = totalHours / 24;

  const days = Math.floor(totalDays);
  const hours = Math.floor((totalDays % 1) * 24);
  const minutes = Math.floor((totalHours % 1) * 60);
  const seconds = totalSeconds % 60;

  return { value: `${days}d ${hours}h ${minutes}m ${seconds}s` };
}

export function CountdownChip({ deadline }: Readonly<Props>) {
  const { t, locale } = useI18n();
  const [tick, setTick] = useState(() => Date.now());

  const deadlineLocale = new Date(deadline).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  useEffect(() => {
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = deadline - tick;
  let value: string;
  if (diff <= 0) {
    value = t('poolDetail.deadline.passed');
  } else {
    const formatted = formatRemaining(diff);
    value = formatted.value;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '0.25rem',
        padding: '0.85rem 1.05rem',
        borderRadius: 'var(--radius-md)',
        background: 'rgb(var(--sunset) / 0.10)',
        border: `1px solid rgb(var(--sunset) / 0.30)`,
        minWidth: '180px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: 'rgb(var(--sunset))' }}
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgb(var(--sunset))',
          }}
        >
          {`${t('poolDetail.deadline.general')} ${deadlineLocale}`}
        </span>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display, inherit)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: 'rgb(var(--sunset))',
          letterSpacing: '-0.01em',
          lineHeight: 1.05,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}
