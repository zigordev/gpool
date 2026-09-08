import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import { AuthRepository } from './database/auth.repository';

function configFrom(values: Record<string, string>): ConfigService {
  return {
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  } as unknown as ConfigService;
}

const REDIRECTS = {
  FRONTEND_URL: 'https://gpool.example.com',
  AUTH_SUCCESS_REDIRECT_URL: 'https://gpool.example.com/auth/callback',
  AUTH_FAILURE_REDIRECT_URL: 'https://gpool.example.com/login',
};

function serviceWith(repository: Partial<AuthRepository> = {}): AuthService {
  return new AuthService(configFrom(REDIRECTS), repository as AuthRepository);
}

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    displayName: 'Ada Lovelace',
    name: { givenName: 'Ada', familyName: 'Lovelace' },
    emails: [{ value: 'Ada@Example.com', verified: true }],
    photos: [{ value: 'https://example.com/ada.png' }],
    ...overrides,
  } as Profile;
}

describe('AuthService redirect handling', () => {
  it('sends a login with no override to the configured success URL', () => {
    expect(serviceWith().getSuccessRedirectUrl(null)).toBe(
      'https://gpool.example.com/auth/callback'
    );
  });

  it('honours a relative override', () => {
    expect(serviceWith().getSuccessRedirectUrl('/pools?tab=open')).toBe(
      'https://gpool.example.com/pools?tab=open'
    );
  });

  it('refuses an override pointing at another origin', () => {
    expect(serviceWith().getSuccessRedirectUrl('https://evil.example.net/steal')).toBe(
      'https://gpool.example.com/auth/callback'
    );
  });

  it('refuses a protocol-relative override', () => {
    expect(serviceWith().getSuccessRedirectUrl('//evil.example.net/steal')).toBe(
      'https://gpool.example.com/auth/callback'
    );
  });

  it('puts the error code on the failure redirect', () => {
    expect(serviceWith().getFailureRedirectUrl('missing_user')).toBe(
      'https://gpool.example.com/login?error=missing_user'
    );
  });

  it('refuses a cross-origin failure override too', () => {
    expect(serviceWith().getFailureRedirectUrl('missing_user', 'https://evil.example.net')).toBe(
      'https://gpool.example.com/login?error=missing_user'
    );
  });
});

describe('AuthService.validateGoogleProfile', () => {
  it('lowercases the email and reuses an existing user', async () => {
    const existing = {
      userId: 'user-1',
      email: 'ada@example.com',
      role: 'admin',
      name: 'Ada Lovelace',
      picture: 'https://example.com/ada.png',
      locale: 'en',
    };
    const service = serviceWith({
      getUserByEmail: vi.fn().mockResolvedValue(existing),
      createUser: vi.fn(),
    });

    await expect(service.validateGoogleProfile(profile())).resolves.toEqual({
      userId: 'user-1',
      email: 'ada@example.com',
      role: 'admin',
      name: 'Ada Lovelace',
      locale: 'en',
    });
  });

  it('creates a user on first login, defaulting the role rather than trusting Google', async () => {
    const createUser = vi.fn().mockImplementation(async (user) => ({ ...user }));
    const service = serviceWith({
      getUserByEmail: vi.fn().mockResolvedValue(null),
      createUser,
    });

    const user = await service.validateGoogleProfile(profile());

    expect(createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ada@example.com', role: 'user' })
    );
    expect(user.role).toBe('user');
  });

  it('rejects a Google account with no email', async () => {
    await expect(
      serviceWith().validateGoogleProfile(profile({ emails: undefined }))
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a Google account whose email is explicitly unverified', async () => {
    await expect(
      serviceWith().validateGoogleProfile(
        profile({ emails: [{ value: 'ada@example.com', verified: false }] } as Partial<Profile>)
      )
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
