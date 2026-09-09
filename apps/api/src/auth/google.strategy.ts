import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Profile, Strategy } from 'passport-google-oauth20';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly isConfigured: boolean;
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly authService: AuthService
  ) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Unset in every environment but CI, where they point at the mock
    // OpenID Connect provider the browser suite signs in against. Left
    // undefined, passport-google-oauth20 uses Google's own endpoints, so
    // production configuration and the production image are unchanged.
    const authorizationURL = configService.get<string>('GOOGLE_AUTHORIZATION_URL');
    const tokenURL = configService.get<string>('GOOGLE_TOKEN_URL');
    const userProfileURL = configService.get<string>('GOOGLE_USERINFO_URL');

    super({
      clientID,
      clientSecret,
      callbackURL,
      ...(authorizationURL ? { authorizationURL } : null),
      ...(tokenURL ? { tokenURL } : null),
      ...(userProfileURL ? { userProfileURL } : null),
      scope: ['profile', 'email'],
      passReqToCallback: true,
      state: true,
    });

    this.isConfigured = Boolean(clientID && clientSecret);
  }

  authenticate(req: Request, options?: Record<string, unknown>): void {
    if (!this.isConfigured) {
      this.fail('Google OAuth is not configured', 500);
      return;
    }

    super.authenticate(req, options);
  }

  async validate(
    request: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: Profile
  ): Promise<AuthenticatedUser> {
    if (!this.isConfigured) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    const user = await this.authService.validateGoogleProfile(profile);

    await new Promise<void>((resolve, reject) =>
      request.logIn(user, { session: true, keepSessionInfo: true }, (error) => {
        if (error) {
          this.logger.error('request.logIn failed', error);
          reject(error);
        } else {
          resolve();
        }
      })
    );

    return user;
  }
}
