import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

type RequestWithAuthContext = Request & {
  is_authorized: boolean;
  token?: string;
  user_data?: unknown;
};

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  constructor(
    private readonly reflector: Reflector,
    private readonly config_service: ConfigService,
    private readonly jwt_service: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const is_public = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<RequestWithAuthContext>();
    request.is_authorized = false;

    const token = this.extractTokenFromHeader(request);
    if (token) {
      try {
        request.token = token;
        const user_data = this.jwt_service.verify(token, {
          secret: this.config_service.get('JWT_SECRET'),
        });
        request.user_data = user_data;
        request.is_authorized = true;
      } catch {
        this.logger.warn('Invalid authorization token');
      }
    }

    return is_public || request.is_authorized;
  }

  private extractTokenFromHeader(
    request: RequestWithAuthContext,
  ): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
