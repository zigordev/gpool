import type { Request } from 'express';

export type AuthRole = 'admin' | 'user';
export type Locale = 'es' | 'en';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: AuthRole;
  name: string;
  locale: Locale;
}

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};
