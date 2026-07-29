'use client';

import { useI18n } from '@/i18n/client';
import { useEffect, useState } from 'react';
import { Badge } from '../../../design-system/components/feedback/Badge.jsx';

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
  
  return (
    diff > 0 &&
      <Badge
        variant="warning"
        className="badge-attention"
        title={`${t('poolDetail.deadline.general')} ${deadlineLocale}`}
        aria-label={`${t('poolDetail.deadline.general')} ${deadlineLocale}`}
        leadingIcon={
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
        }
      >
        {formatRemaining(diff).value}
      </Badge>
  );
}
