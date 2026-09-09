import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { Session, SessionData } from 'express-session';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './authenticated.guard';
import { GoogleAuthGuard } from './google-auth.guard';

type LocaleUpdateRequest = {
  locale?: string;
};

type OauthSession = Session &
  SessionData & {
    oauthSuccessRedirect?: string;
    oauthFailureRedirect?: string;
  };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  @Get('google')
  @ApiOperation({ summary: 'Start the Google OAuth flow' })
  @UseGuards(GoogleAuthGuard)
  async googleLogin(): Promise<void> {
    // The guard redirects to Google.
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Complete the Google OAuth flow and create the session' })
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    const user = req.user as AuthenticatedUser | undefined;
    const session = req.session as OauthSession | null;

    const successOverride = session?.oauthSuccessRedirect ?? null;
    const failureOverride = session?.oauthFailureRedirect ?? null;

    if (session) {
      delete session.oauthSuccessRedirect;
      delete session.oauthFailureRedirect;
    }

    if (!user) {
      res.redirect(this.authService.getFailureRedirectUrl('missing_user', failureOverride));
      return;
    }

    res.redirect(this.authService.getSuccessRedirectUrl(successOverride));
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthenticatedGuard)
  async getMe(@Req() req: Request) {
    return req.user;
  }

  @Patch('me/locale')
  @ApiOperation({ summary: 'Update current authenticated user locale' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Updates current user locale' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthenticatedGuard)
  async updateLocale(@Req() req: Request, @Body() body: LocaleUpdateRequest) {
    const user = req.user as AuthenticatedUser;
    return this.authService.updateLocale(user.userId, body.locale?.trim() ?? '');
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Destroy the current session' })
  @UseGuards(AuthenticatedGuard)
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const cookieName = this.configService.get<string>('SESSION_COOKIE_NAME', 'gpool.sid');

    await new Promise<void>((resolve, reject) =>
      req.logout((error) => (error ? reject(error) : resolve()))
    );

    await new Promise<void>((resolve, reject) =>
      req.session.destroy((error) => (error ? reject(error) : resolve()))
    );

    res.clearCookie(cookieName);
    res.status(204).send();
  }
}
