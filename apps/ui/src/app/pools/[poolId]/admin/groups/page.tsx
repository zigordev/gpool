'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/client';
import { Section } from '@/components/ui/Section';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { countryIsoCode } from '@/lib/country-flags';
import ReactCountryFlag from 'react-country-flag';
import { useAdminContext } from '@/contexts/AdminContext';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { IoSettings } from 'react-icons/io5';

function ScoreInput({
  value,
  onChange,
  ariaLabel,
}: Readonly<{
  value: number | '';
  onChange: (next: string) => void;
  ariaLabel: string;
}>) {
  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value === '' ? '' : String(value)}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '' || /^\d+$/.test(v)) onChange(v);
      }}
      onKeyDown={(e) => {
        if (e.key === '-' || e.key === '.' || e.key === 'e' || e.key === 'E') e.preventDefault();
      }}
      aria-label={ariaLabel}
      style={{
        width: '2rem',
        padding: '0.18rem 0.1rem',
        textAlign: 'center',
        fontFamily: 'var(--font-display, inherit)',
        fontSize: '0.98rem',
        fontWeight: 700,
        color: 'rgb(var(--fg))',
        background: 'rgb(var(--input-bg))',
        border: '1px solid rgb(var(--border))',
        borderRadius: 'var(--radius-md)',
        fontVariantNumeric: 'tabular-nums',
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
      }}
    />
  );
}

interface ResultEntryRowProps {
  match: Match;
  locale: string;
  result: { homeResult: number | ''; awayResult: number | '' };
  onChange: (matchId: string, side: 'home' | 'away', value: string) => void;
}

function ResultEntryRow({ match, locale, result, onChange }: Readonly<ResultEntryRowProps>) {
  const formattedDate = new Date(match.scheduledAt).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const matchDate = match.matchNumber ? `P${match.matchNumber} · ${formattedDate}` : formattedDate;

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 4.65rem minmax(0, 1fr) 9rem',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.38rem 0.5rem',
        background: 'linear-gradient(var(--card-sheen), var(--card-sheen)), rgb(var(--bg-elevated))',
        backdropFilter: 'blur(12px) saturate(140%)',
        WebkitBackdropFilter: 'blur(12px) saturate(140%)',
        border: '1px solid rgb(var(--border))',
        boxShadow: 'inset 0 1px 0 var(--card-inset-highlight), 0 3px 10px rgb(0 0 0 / 0.10)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <ReactCountryFlag countryCode={countryIsoCode(match.homeTeamName)} svg style={{ width: '2em', height: '2em' }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.homeTeamName}</span>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2rem 0.45rem 2rem', alignItems: 'center' }}>
        <ScoreInput
          value={result.homeResult ?? ''}
          onChange={(v) => onChange(match.matchId, 'home', v)}
          ariaLabel={`${match.homeTeamName} result`}
        />
        <span
          aria-hidden
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: '1.1rem',
            color: 'rgb(var(--fg-subtle))',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          –
        </span>
        <ScoreInput
          value={result.awayResult ?? ''}
          onChange={(v) => onChange(match.matchId, 'away', v)}
          ariaLabel={`${match.awayTeamName} result`}
        />
      </div>

      <div style={{ minWidth: 0, textAlign: 'right' }}>
        <p
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'rgb(var(--fg))',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            justifyContent: 'flex-end',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{match.awayTeamName}</span>
          <ReactCountryFlag countryCode={countryIsoCode(match.awayTeamName)} svg style={{ width: '2em', height: '2em' }} />
        </p>
      </div>

      <div
        style={{
          minWidth: 0,
          display: 'grid',
          justifyItems: 'end',
          gap: '0.15rem',
          fontSize: '0.65rem',
          lineHeight: 1.1,
          color: 'rgb(var(--fg-muted))',
        }}
      >
        <span
          style={{
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 600,
            color: 'rgb(var(--fg-subtle))',
          }}
        >
          {matchDate}
        </span>
      </div>
    </article>
  );
}

export default function AdminGroupsPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const {
    poolId, poolName,
    scoringConfig, setScoringConfig,
    poolNotSelected,
    groups, matchesByGroup, results, handleResultChange,
  } = useAdminContext();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeletePool = async () => {
    if (!poolId || poolId === 'all-pools') return;
    try {
      setDeleting(true);
      await apiClient.delete(`/pools/${poolId}`);
      toast.success(t('adminResults.toast.poolDeleted'));
      router.push('/pools');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('adminResults.errors.deletePool'));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="content-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Group phase scoring */}
      <Section title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><IoSettings size={13} aria-hidden />{t('adminResults.scoring.title')}</span>} collapsible defaultExpanded density="compact" tone="muted">
        <div className="config-area" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
          <FormField label={t('adminResults.scoring.groupPhaseWinner')}>
            <Input type="number" inputMode="numeric" min="0" value={scoringConfig.winnerPoints} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setScoringConfig((prev) => ({ ...prev, winnerPoints: Math.max(0, value) })); }} />
          </FormField>
          <FormField label={t('adminResults.scoring.groupPhaseExact')}>
            <Input type="number" inputMode="numeric" min="0" value={scoringConfig.exactResultPoints} onChange={(e) => { const value = Number.parseInt(e.target.value, 10) || 0; setScoringConfig((prev) => ({ ...prev, exactResultPoints: Math.max(0, value) })); }} />
          </FormField>
        </div>
      </Section>

      {/* Match results */}
      {groups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {groups.map((group) => {
            const groupMatches = matchesByGroup[group] || [];
            return (
              <Section
                key={group}
                title={t('adminResults.groupPhase.group', { group })}
                collapsible
                defaultExpanded
                density="compact"
                tone="subtle"
                contentStyle={{ marginTop: '0.35rem', paddingTop: '0.35rem' }}
                style={{ padding: '0.45rem 0.55rem' }}
              >
                {groupMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {groupMatches.map((match) => (
                      <ResultEntryRow
                        key={match.matchId}
                        match={match}
                        locale={locale}
                        result={results[match.matchId] || { homeResult: '', awayResult: '' }}
                        onChange={handleResultChange}
                      />
                    ))}
                  </div>
                ) : null}
              </Section>
            );
          })}
        </div>
      ) : (
        <p style={{ color: 'rgb(var(--fg-muted))', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem', margin: 0 }}>
          {t('adminResults.groupPhase.empty')}
        </p>
      )}

      {/* Danger zone */}
      {!poolNotSelected && (
        <section
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgb(var(--live) / 0.35)',
            background: 'rgb(var(--live) / 0.04)',
          }}
        >
          <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(var(--live))', marginBottom: '0.65rem' }}>
            {t('adminResults.dangerZone.title')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgb(var(--fg-muted))', lineHeight: 1.5 }}>
              {t('adminResults.dangerZone.deletePoolDescription')}
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                flexShrink: 0,
                padding: '0.45rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgb(var(--live) / 0.5)',
                background: 'rgb(var(--live) / 0.08)',
                color: 'rgb(var(--live))',
                fontSize: '0.875rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {t('adminResults.dangerZone.deletePoolButton')}
            </button>
          </div>
        </section>
      )}

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-pool-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgb(0 0 0 / 0.55)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setShowDeleteConfirm(false); }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: 'rgb(var(--bg-elevated))',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgb(var(--live) / 0.35)',
              boxShadow: 'var(--shadow-lg)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <h2 id="delete-pool-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'rgb(var(--fg))' }}>
              {t('adminResults.dangerZone.confirmTitle', { name: poolName || poolId })}
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgb(var(--fg-muted))', lineHeight: 1.6 }}>
              {t('adminResults.dangerZone.confirmDescription')}
            </p>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" disabled={deleting} onClick={() => setShowDeleteConfirm(false)} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
                {t('adminResults.dangerZone.cancelButton')}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeletePool}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.1rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: 'rgb(var(--live))',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting && <span className="btn-spinner" style={{ width: '0.8rem', height: '0.8rem', borderWidth: 2, borderColor: 'rgb(255 255 255 / 0.35)', borderTopColor: '#fff' }} />}
                {deleting ? t('adminResults.dangerZone.deleting') : t('adminResults.dangerZone.confirmButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
