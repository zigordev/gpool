'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { getApiBaseUrl } from '@/lib/api-base-url';

interface User {
    userId: string;
    email: string;
    role: string;
    locale: Locale;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (redirectPath?: string) => void;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/auth/me`, {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
            });
            if (!response.ok) {
                setUser(null);
                return;
            }

            setUser(await response.json() as User);
        } catch (error: any) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // checkAuth is exposed via context for consumers to trigger a manual
        // re-check too, so it can't be restructured around this one call site.
        // Known rule limitation, not an oversight:
        // https://github.com/facebook/react/issues/34743
        // eslint-disable-next-line react-hooks/set-state-in-effect
        checkAuth();
    }, [checkAuth]);

    const login = (redirectPath?: string) => {
        const currentPath = `${globalThis.location.pathname || '/pools'}${globalThis.location.search || ''}`;
        const targetPath = redirectPath || currentPath;
        const start = new URL(`${getApiBaseUrl()}/auth/google`);
        start.searchParams.set('redirect_uri', targetPath);
        globalThis.location.href = start.toString();
    };

    const logout = async () => {
        try {
            await fetch(`${getApiBaseUrl()}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
            globalThis.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                isAuthenticated: !!user,
                checkAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
