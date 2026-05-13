import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SessionUserGuard } from '../common/auth/session-user.guard';

type GoogleTransferRequest = {
  accessToken?: string;
  locale?: string;
};

type LocaleUpdateRequest = {
  locale?: string;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google/transfer')
  @ApiOperation({ summary: 'Create signed transfer payload from a Google access token' })
  @ApiResponse({ status: 200, description: 'Returns transfer payload and signature' })
  @ApiResponse({ status: 401, description: 'Invalid Google access token' })
  async googleTransfer(@Body() body: GoogleTransferRequest) {
    return this.authService.createGoogleTransferFromAccessToken(
      body.accessToken?.trim() ?? '',
      body.locale,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Returns current user information' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(SessionUserGuard)
  async getMe(@Req() req: Request) {
    return req.user;
  }

  @Patch('me/locale')
  @ApiOperation({ summary: 'Update current authenticated user locale' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Updates current user locale' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(SessionUserGuard)
  async updateLocale(@Req() req: Request, @Body() body: LocaleUpdateRequest) {
    return this.authService.updateLocale((req.user as any).userId, body.locale?.trim() ?? '');
  }
}
