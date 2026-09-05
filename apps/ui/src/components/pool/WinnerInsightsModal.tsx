'use client';

import { useEffect, useState } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { FaTrophy } from 'react-icons/fa';
import { useI18n } from '@/i18n/client';
import { apiClient } from '@/lib/api';
import { countryIsoCode } from '@/lib/country-flags';
import { Modal } from '../../../design-system/components/overlay/Modal.jsx';

type WinnerSelection = {
  teamId: string;
  teamName: string;
  count: number;
  percentage: number;
  correct: boolean | null;
};

type WinnerInsights = {
  memberCount: number;
  actualWinnerTeamId: string | null;
  selections: WinnerSelection[];
};

export function WinnerInsightsModal({
  poolId,
  open,
  onClose,
}: Readonly<{
  poolId: string;
  open: boolean;
  onClose: () => void;
}>) {
  const { t } = useI18n();
  const [data, setData] = useState<WinnerInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setData(null);
      setError(null);
    }
  }

  useEffect(() => {
    if (!open) return;
    let active = true;
    // Must re-arm on every open, not just mount, so a fresh spinner shows
    // each time the modal reopens. Acknowledged upstream as a rule
    // limitation with no clean restructuring:
    // https://github.com/facebook/react/issues/34743
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    apiClient
      .get(`/pools/${poolId}/bracket/winner-insights`)
      .then((response) => {
        if (active) setData(response.data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.message ||
              t('poolDetail.winnerInsights.loadError'),
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, poolId, t]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('poolDetail.winnerInsights.title')}
      size="md"
    >
      {loading ? (
        <p style={messageStyle}>{t('common.loading')}</p>
      ) : error ? (
        <p role="alert" style={{ ...messageStyle, color: 'rgb(var(--live))' }}>
          {error}
        </p>
      ) : data?.selections.length ? (
        <div style={{ display: 'grid', gap: '0.45rem' }}>
          {data.selections.map((selection) => {
            const tone =
              selection.correct === true
                ? 'var(--pitch)'
                : selection.correct === false
                  ? 'var(--live)'
                  : 'var(--gold)';
            return (
              <div
                key={selection.teamId}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem',
                  border: `1px solid rgb(${tone} / 0.45)`,
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgb(var(--bg-elevated))',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: `${selection.percentage}%`,
                    background: `rgb(${tone} / 0.08)`,
                  }}
                />
                <span
                  style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: 0,
                    color: 'rgb(var(--fg))',
                    fontWeight: 800,
                  }}
                >
                  <ReactCountryFlag
                    countryCode={countryIsoCode(selection.teamName)}
                    svg
                    style={{ width: '1.6em', height: '1.6em', flexShrink: 0 }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selection.teamName}
                  </span>
                  {selection.correct === true ? (
                    <FaTrophy aria-label={t('poolDetail.winnerInsights.correct')} style={{ color: 'rgb(var(--gold))' }} />
                  ) : null}
                </span>
                <strong
                  style={{
                    position: 'relative',
                    color: 'rgb(var(--fg))',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatPercentage(selection.percentage)}
                </strong>
              </div>
            );
          })}
        </div>
      ) : (
        <p style={messageStyle}>{t('poolDetail.winnerInsights.empty')}</p>
      )}
    </Modal>
  );
}

function formatPercentage(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}%`;
}

const messageStyle: React.CSSProperties = {
  margin: 0,
  padding: '1rem',
  color: 'rgb(var(--fg-muted))',
  fontSize: '0.85rem',
  textAlign: 'center',
};
