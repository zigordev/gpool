import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import type { AuthenticatedUser } from '../common/auth/authenticated-user';
import { AuthService } from './auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private readonly authService: AuthService) {
    super();
  }

  serializeUser(
    user: AuthenticatedUser,
    done: (error: Error | null, userId: string) => void
  ): void {
    done(null, user.userId);
  }

  async deserializeUser(
    userId: string,
    done: (error: Error | null, user: AuthenticatedUser | null) => void
  ): Promise<void> {
    try {
      done(null, await this.authService.getAuthenticatedUser(userId));
    } catch (error) {
      done(error as Error, null);
    }
  }
}
