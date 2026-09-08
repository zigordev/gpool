import { ExecutionContext, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import type { Session, SessionData } from 'express-session';

type OauthSession = Session &
  SessionData & {
    oauthSuccessRedirect?: string;
    oauthFailureRedirect?: string;
  };

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.hasOAuthCredentials()) {
      const response = context.switchToHttp().getResponse<Response | undefined>();

      if (response) {
        response.status(503).json({
          status: 503,
          code: 'AUTH.GOOGLE_UNAVAILABLE',
          message: 'Google OAuth is not configured',
        });
        return false;
      }

      throw new ServiceUnavailableException({
        code: 'AUTH.GOOGLE_UNAVAILABLE',
        message: 'Google OAuth is not configured',
      });
    }

    return (await super.canActivate(context)) as boolean;
  }

  override getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { session?: OauthSession }>();
    const options = (super.getAuthenticateOptions(context) as Record<string, unknown>) ?? {};

    const redirectUri = this.extractStringParam(request.query?.redirect_uri);
    const failureRedirect = this.extractStringParam(request.query?.failure_redirect);
    const callbackURL = this.configService.get<string>('GOOGLE_CALLBACK_URL') ?? undefined;

    if (redirectUri && request.session) {
      request.session.oauthSuccessRedirect = redirectUri;
    }

    if (failureRedirect && request.session) {
      request.session.oauthFailureRedirect = failureRedirect;
    }

    return {
      ...options,
      session: true,
      ...(callbackURL ? { callbackURL } : null),
    };
  }

  override handleRequest<TUser = unknown>(error: unknown, user: TUser | false | null): TUser {
    if (error) {
      throw error;
    }

    return (user || undefined) as TUser;
  }

  private hasOAuthCredentials(): boolean {
    return Boolean(
      this.configService.get<string>('GOOGLE_CLIENT_ID') &&
        this.configService.get<string>('GOOGLE_CLIENT_SECRET')
    );
  }

  private extractStringParam(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }
}
