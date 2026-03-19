import { DatabaseModule } from '@database/database.module';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';

import { AuthGuard } from '@common/guards/auth.guard';
import {
  getCacheConfig,
  getJwtConfig,
  getLoggerConfig,
  getThrottlerConfig,
  validateEnv,
} from './config/index';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationOptions: { abortEarly: false },
      validate: validateEnv,
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot(getLoggerConfig()),
    PassportModule,
    JwtModule.registerAsync(getJwtConfig()),
    CacheModule.registerAsync(getCacheConfig()),
    ThrottlerModule.forRoot(getThrottlerConfig()),
    DatabaseModule,
    UserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
