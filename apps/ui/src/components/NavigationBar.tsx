'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Logo } from './Logo';

function initials(value: string | undefined | null): string {
  if (!value) return '?';
  const trimmed = value.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function NavigationBar() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showUserMenu) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (
        menuRef.current?.contains(target) ||
        triggerRef.current?.contains(target)
      ) {
        return;
      }
      setShowUserMenu(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showUserMenu]);

  // Don't show navigation on login page
  if (pathname === '/login') {
    return null;
  }

  const isPoolsActive = pathname === '/pools' || pathname?.startsWith('/pools/');

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgb(var(--bg-elevated) / 0.78)',
        backdropFilter: 'blur(14px) saturate(140%)',
        WebkitBackdropFilter: 'blur(14px) saturate(140%)',
        borderBottom: '1px solid rgb(var(--border-subtle))',
      }}
    >
      <nav
        aria-label="Primary"
        style={{
          width: '100%',
          maxWidth: '80rem',
          margin: '0 auto',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Logo size="sm" />
        </div>

        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setShowUserMenu((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
              aria-label={t('nav.user')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                padding: '0.3rem 0.8rem 0.3rem 0.4rem',
                background: showUserMenu ? 'rgb(var(--bg-subtle))' : 'transparent',
                border: '1px solid rgb(var(--border))',
                borderRadius: '999px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'rgb(var(--fg))',
                transition: 'all 0.18s ease',
              }}
            >
              <span
                aria-hidden
                className="avatar"
                style={{ width: '1.75rem', height: '1.75rem', fontSize: '0.7rem', border: 'none' }}
              >
                {initials(user.email)}
              </span>
              <span style={{ display: 'none' }} className="nav-user-label">
                {user.email}
              </span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'rgb(var(--fg-subtle))' }}
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showUserMenu ? (
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
                  <p
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      color: 'rgb(var(--fg-subtle))',
                      margin: 0,
                      marginBottom: '0.2rem',
                    }}
                  >
                    {t('nav.user')}
                  </p>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'rgb(var(--fg))',
                      margin: 0,
                      wordBreak: 'break-word',
                    }}
                  >
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  role="menuitem"
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgb(var(--bg-subtle))';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  {t('nav.logout')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
