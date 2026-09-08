import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile } from 'passport-google-oauth20';
import { v4 as uuidv4 } from 'uuid';
import type { AuthRole, AuthenticatedUser, Locale } from '../common/auth/authenticated-user';
import { AuthRepository } from './database/auth.repository';

const DEFAULT_LOCALE = 'es';
const SUPPORTED_LOCALES = new Set(['es', 'en']);

function normalizeLocale(value: string | null | undefined): Locale {
  const locale = value?.trim().toLowerCase().split(/[-_]/)[0] || DEFAULT_LOCALE;
  return (SUPPORTED_LOCALES.has(locale) ? locale : DEFAULT_LOCALE) as Locale;
}

function normalizeRole(value: string | null | undefined): AuthRole {
  return value === 'admin' ? 'admin' : 'user';
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authRepository: AuthRepository
  ) {}

  private toAuthenticatedUser(row: {
    userId: string;
    email: string;
    role: string;
    name?: string | null;
    locale?: string | null;
  }): AuthenticatedUser {
    return {
      userId: row.userId,
      email: row.email,
      role: normalizeRole(row.role),
      name: row.name || row.email.split('@')[0] || 'User',
      locale: normalizeLocale(row.locale),
    };
  }

  async validateGoogleProfile(profile: Profile): Promise<AuthenticatedUser> {
    const email = profile.emails?.[0]?.value?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('Google account has no email address');
    }

    if (profile.emails?.[0]?.verified === false) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    const fullName =
      `${profile.name?.givenName?.trim() ?? ''} ${profile.name?.familyName?.trim() ?? ''}`.trim() ||
      profile.displayName?.trim() ||
      email;
    const picture = profile.photos?.[0]?.value?.trim() ?? '';

    let dbUser = await this.authRepository.getUserByEmail(email);

    if (dbUser) {
      const updates: Record<string, unknown> = {};
      if (dbUser.name !== fullName) updates.name = fullName;
      if (dbUser.picture !== picture) updates.picture = picture;
      if (Object.keys(updates).length > 0) {
        dbUser = await this.authRepository.updateUser(dbUser.userId, updates);
      }
    } else {
      const userId = uuidv4();
      dbUser = await this.authRepository.createUser({
        userId,
        email,
        name: fullName,
        picture,
        role: 'user',
        locale: DEFAULT_LOCALE,
      });
      this.logger.log(`New user created from Google login: ${userId}`);
    }

    return this.toAuthenticatedUser(dbUser);
  }

  async getAuthenticatedUser(userId: string): Promise<AuthenticatedUser | null> {
    const dbUser = await this.authRepository.getUser(userId);
    return dbUser ? this.toAuthenticatedUser(dbUser) : null;
  }

  getSuccessRedirectUrl(overrideUrl?: string | null): string {
    return this.createAllowedRedirectUrl(
      overrideUrl,
      this.configService.get<string>('AUTH_SUCCESS_REDIRECT_URL')
    ).toString();
  }

  getFailureRedirectUrl(errorCode = 'auth_failed', overrideUrl?: string | null): string {
    const url = this.createAllowedRedirectUrl(
      overrideUrl,
      this.configService.get<string>('AUTH_FAILURE_REDIRECT_URL')
    );
    url.searchParams.set('error', errorCode);
    return url.toString();
  }

  private createAllowedRedirectUrl(
    overrideUrl: string | null | undefined,
    fallbackUrl: string | undefined
  ): URL {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', '');
    const fallback = fallbackUrl?.trim() || `${frontendUrl.replace(/\/+$/, '')}/`;

    const candidate = overrideUrl?.trim();
    if (!candidate) {
      return new URL(fallback);
    }

    try {
      const resolved = new URL(candidate, fallback);
      const allowed = new URL(fallback);
      if (resolved.origin === allowed.origin) {
        return resolved;
      }
    } catch {
      // Fall through to the configured redirect below.
    }

    return new URL(fallback);
  }

  async updateLocale(userId: string, locale: string) {
    const updated = await this.authRepository.updateUser(userId, {
      locale: normalizeLocale(locale),
    });

    return {
      userId: updated.userId,
      email: updated.email,
      role: updated.role,
      name: updated.name || null,
      picture: updated.picture || null,
      locale: updated.locale || DEFAULT_LOCALE,
    };
  }
}
