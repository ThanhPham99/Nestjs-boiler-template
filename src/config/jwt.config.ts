import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export function getJwtConfig(): JwtModuleAsyncOptions {
  return {
    global: true,
    inject: [ConfigService],
    useFactory: (config_service: ConfigService) => ({
      secret: config_service.getOrThrow<string>('JWT_SECRET'),
    }),
  };
}
