'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNavCenter } from '@/contexts/NavCenterContext';
import { useI18n } from '@/i18n/client';
import { LANGUAGE_COOKIE, SUPPORTED_LOCALES, type Locale } from '@/i18n/config';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { FaGlobe, FaMoon, FaSun, FaUser } from 'react-icons/fa6';
import { Logo } from './Logo';

const LOCALE_META: Record<Locale, { label: string; flagCode: string }> = {
  es: { label: 'Español', flagCode: 'es' },
  en: { label: 'English', flagCode: 'gb' },
};

const NAV_ICON_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2rem',
  height: '2rem',
  padding: 0,
  background: 'transparent',
  border: 'none',
  borderRadius: '999px',
  cursor: 'pointer',
  color: 'rgb(var(--pitch))',
  transition: 'background 0.15s ease',
  flexShrink: 0,
};

function ThemeButton() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('gpool-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('gpool-theme', 'light');
    }
  };

  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      style={NAV_ICON_STYLE}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgb(var(--pitch) / 0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {dark ? <FaSun size={18} aria-hidden /> : <FaMoon size={18} aria-hidden />}
    </button>
  );
}

function LanguageButton() {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const switchTo = (next: Locale) => {
    setOpen(false);
    if (next === locale) return;
    document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=${365 * 24 * 60 * 60}`;
    window.location.reload();
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t('nav.language')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={NAV_ICON_STYLE}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgb(var(--pitch) / 0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <FaGlobe size={22} aria-hidden />
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className="glass-strong"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            minWidth: '10rem',
            padding: '0.4rem',
            zIndex: 1000,
          }}
        >
          {SUPPORTED_LOCALES.map((loc) => {
            const meta = LOCALE_META[loc];
            const active = loc === locale;
            return (
              <button
                key={loc}
                type="button"
                role="menuitem"
                onClick={() => switchTo(loc)}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.5rem 0.75rem',
                  background: active ? 'rgb(var(--pitch) / 0.1)' : 'transparent',
                  color: active ? 'rgb(var(--pitch))' : 'rgb(var(--fg))',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: active ? 700 : 500,
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgb(var(--bg-subtle))'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span className={`fi fi-${meta.flagCode}`} style={{ fontSize: '1.1rem', borderRadius: '2px', flexShrink: 0 }} aria-hidden />
                {meta.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function UserButton() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.user')}
        style={NAV_ICON_STYLE}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgb(var(--pitch) / 0.1)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        <FaUser size={17} aria-hidden />
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className="glass-strong"
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            minWidth: '14rem',
            padding: '0.4rem',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '0.55rem 0.75rem 0.65rem',
              borderBottom: '1px solid rgb(var(--border-subtle))',
              marginBottom: '0.25rem',
            }}
          >
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgb(var(--fg-subtle))', margin: 0, marginBottom: '0.2rem' }}>
              {t('nav.user')}
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgb(var(--fg))', margin: 0, wordBreak: 'break-word' }}>
              {user.email}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); logout(); }}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 0.75rem',
              background: 'transparent',
              color: 'rgb(var(--fg))',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgb(var(--bg-subtle))'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {t('nav.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function NavigationBar() {
  const { center, subBar } = useNavCenter();
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgb(var(--bg) / 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <nav
          aria-label="Primary"
          className={`nav-shell${center ? ' nav-shell--has-center' : ''}`}
        >
          <div className="nav-logo-area">
            <Logo size="sm" />
          </div>

          {center ? (
            <div className="nav-center-area">
              {center}
            </div>
          ) : null}

          <div className="nav-icons-area">
            <ThemeButton />
            <LanguageButton />
            <UserButton />
          </div>
        </nav>

        {subBar ? (
          <div className="nav-sub-bar">{subBar}</div>
        ) : null}
      </header>

      {center ? (
        <div className="nav-mobile-bottom-area" aria-hidden={false}>
          {center}
        </div>
      ) : null}
    </>
  );
}
