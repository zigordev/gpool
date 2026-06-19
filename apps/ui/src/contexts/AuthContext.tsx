'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';

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
            const response = await fetch('/api/auth/session', {
                method: 'GET',
                cache: 'no-store',
            });
            if (!response.ok) {
                setUser(null);
                return;
            }

            const payload = await response.json() as {
                authenticated?: boolean;
                user?: User;
            };

            if (payload.authenticated && payload.user) {
                setUser(payload.user);
            } else {
                setUser(null);
            }
        } catch (error: any) {
            console.error('Auth check failed:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = (redirectPath?: string) => {
        const currentPath = `${globalThis.location.pathname || '/pools'}${globalThis.location.search || ''}`;
        const targetPath = redirectPath || currentPath;
        globalThis.location.href = `/api/auth/google/start?redirect=${encodeURIComponent(targetPath)}`;
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/session', {
                method: 'DELETE',
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
