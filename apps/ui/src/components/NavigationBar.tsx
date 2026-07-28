'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import { LANGUAGE_COOKIE, SUPPORTED_LOCALES, type Locale } from '@/i18n/config';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../../design-system/components/core/Button.jsx';
import { Flag } from '../../design-system/components/icons/Flag.jsx';
import { Icon } from '../../design-system/components/icons/Icon.jsx';
import { Menu, MenuItem } from '../../design-system/components/overlay/Menu.jsx';

const LOCALE_META: Record<Locale, { label: string; flagCode: 'gb' | 'es' }> = {
  es: { label: 'Español', flagCode: 'es' },
  en: { label: 'English', flagCode: 'gb' },
};

const ICON_STYLE: React.CSSProperties = { lineHeight: 1 };

export function ThemeButton() {
  const { t } = useI18n();
  const [dark, setDark] = useState(false);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      // Also flip data-mode: the shared design-system chrome (Sidebar/
      // Topbar/BottomNav) keys its dark palette off `[data-mode="dark"]`,
      // a separate mechanism from gpool's own `.dark` class toggle above.
      document.documentElement.setAttribute('data-mode', 'dark');
      localStorage.setItem('gpool-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-mode');
      localStorage.setItem('gpool-theme', 'light');
    }
  };

  return (
    <Button
      aria-label={`${t('theme.toggle')}: ${dark ? t('theme.light') : t('theme.dark')}`}
      onClick={toggle}
      size="icon"
      style={ICON_STYLE}
      title={`${t('theme.toggle')}: ${dark ? t('theme.light') : t('theme.dark')}`}
      type="button"
      variant="ghost"
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </Button>
  );
}

export function LanguageButton() {
  const { locale, t } = useI18n();
  const { user } = useAuth();

  const switchTo = async (next: Locale) => {
    if (next === locale) return;
    document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=${365 * 24 * 60 * 60}`;
    if (user) {
      try {
        await fetch('/api/proxy/auth/me/locale', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ locale: next }),
          cache: 'no-store',
        });
      } catch {
        // The cookie still updates the UI immediately; the server preference will retry on next change.
      }
    }
    globalThis.location.reload();
  };

  return (
    <Menu
      trigger={
        <Button
          aria-label={t('nav.language')}
          size="icon"
          style={ICON_STYLE}
          title={t('nav.language')}
          type="button"
          variant="ghost"
        >
          <Icon name="globe" />
        </Button>
      }
    >
      {({ close }: { close: () => void }) => (
        <>
          {SUPPORTED_LOCALES.map((loc) => {
            const meta = LOCALE_META[loc];
            return (
              <MenuItem key={loc} onClick={() => { close(); switchTo(loc); }}>
                <Flag code={meta.flagCode} /> {meta.label}
              </MenuItem>
            );
          })}
        </>
      )}
    </Menu>
  );
}

export function UserButton() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const isSystemAdmin = user?.role === 'admin';

  if (!user) return null;

  return (
    <Menu
      trigger={
        <Button
          aria-label={t('nav.user')}
          size="icon"
          style={ICON_STYLE}
          title={t('nav.user')}
          type="button"
          variant="ghost"
        >
          <Icon name="user" />
        </Button>
      }
    >
      {({ close }: { close: () => void }) => (
        <>
          <div
            style={{
              padding: '6px 10px 8px', marginBottom: 4,
              borderBottom: '1px solid var(--ds-color-border)',
            }}
          >
            <div style={{ fontSize: 'var(--ds-text-xs)', fontWeight: 'var(--ds-weight-bold)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ds-color-fg-subtle)' }}>
              {t('nav.user')}
            </div>
            <div style={{ fontSize: 'var(--ds-text-sm)', fontWeight: 'var(--ds-weight-semibold)', color: 'var(--ds-color-fg)', wordBreak: 'break-word' }}>
              {user.email}
            </div>
          </div>
          {isSystemAdmin ? (
            // Tournament admin edits the real match schedule/bracket/player
            // roster shared by every pool — a platform-level concern, not a
            // specific pool's own settings (that's the per-pool "Manage" tab
            // in PoolNav instead). Lives here, not the primary sidebar, since
            // it's a secondary/account-level action, not a peer of "Pools".
            <MenuItem onClick={() => { close(); router.push('/admin'); }}>
              <Icon name="shield" /> {t('systemAdmin.tabsLabel')}
            </MenuItem>
          ) : null}
          <MenuItem onClick={() => { close(); logout(); }}>
            <Icon name="log-out" /> {t('nav.logout')}
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
