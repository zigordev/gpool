import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.isAuthenticated?.() ?? false) {
      return true;
    }

    throw new UnauthorizedException({
      code: 'AUTH.NOT_AUTHENTICATED',
      message: 'User session required',
    });
  }
}
