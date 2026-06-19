import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import type { AuthRole, Locale } from './authenticated-user';

const USER_ID_HEADER = 'x-auth-user-id';
const USER_EMAIL_HEADER = 'x-auth-user-email';
const USER_ROLE_HEADER = 'x-auth-user-role';
const USER_NAME_HEADER = 'x-auth-user-name';
const USER_LOCALE_HEADER = 'x-auth-user-locale';
const USER_EXP_HEADER = 'x-auth-user-exp';
const SIGNATURE_HEADER = 'x-auth-signature';

function normalizeEmail(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeRole(value: string | undefined): AuthRole | null {
  if (value === 'admin' || value === 'user') return value;
  return null;
}

function normalizeLocale(value: string | undefined): Locale {
  const locale = value?.trim().toLowerCase().split(/[-_]/)[0];
  return locale === 'en' ? 'en' : 'es';
}

function safeStringEqual(left: string, right: string): boolean {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);
  if (leftBytes.length !== rightBytes.length) return false;
  return timingSafeEqual(leftBytes, rightBytes);
}

function signPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function buildPayload(
  userId: string,
  email: string,
  role: AuthRole,
  name: string,
  locale: Locale,
  exp: string,
): string {
  return `${userId}\n${email}\n${role}\n${name}\n${locale}\n${exp}`;
}

@Injectable()
export class SessionUserGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.configService.get<string>('AUTH_SESSION_SECRET', '').trim();
    if (!secret) {
      throw new ForbiddenException('AUTH_SESSION_SECRET is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.header(USER_ID_HEADER)?.trim() || '';
    const email = normalizeEmail(request.header(USER_EMAIL_HEADER));
    const role = normalizeRole(request.header(USER_ROLE_HEADER));
    const name = request.header(USER_NAME_HEADER)?.trim() || '';
    const locale = normalizeLocale(request.header(USER_LOCALE_HEADER));
    const exp = request.header(USER_EXP_HEADER)?.trim() || '';
    const providedSignature = request.header(SIGNATURE_HEADER)?.trim() || '';

    if (!userId || !email || !role || !exp || !providedSignature) {
      throw new UnauthorizedException('Missing authenticated session headers');
    }

    const expSeconds = Number(exp);
    if (!Number.isFinite(expSeconds) || expSeconds <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Session has expired');
    }

    const payload = buildPayload(userId, email, role, name, locale, exp);
    const expectedSignature = signPayload(secret, payload);

    if (!safeStringEqual(providedSignature, expectedSignature)) {
      throw new ForbiddenException('Invalid session signature');
    }

    request.user = {
      userId,
      email,
      role,
      name: name || email.split('@')[0] || 'User',
      locale,
    };

    return true;
  }
}
