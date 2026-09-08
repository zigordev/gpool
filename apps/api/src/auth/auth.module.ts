import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedGuard } from './authenticated.guard';
import { GoogleAuthGuard } from './google-auth.guard';
import { GoogleStrategy } from './google.strategy';
import { AuthRepository } from './database/auth.repository';
import { SessionSerializer } from './session.serializer';

@Module({
  imports: [ConfigModule, PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    GoogleStrategy,
    SessionSerializer,
    AuthenticatedGuard,
    GoogleAuthGuard,
  ],
  exports: [AuthService, AuthenticatedGuard],
})
export class AuthModule {}
