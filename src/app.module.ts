import { DatabaseModule } from '@database/database.module';
import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { UserModule } from './modules/user/user.module';

function buildRedisUrl(config_service: ConfigService): string {
  const host = config_service.get<string>('REDIS_HOST');
  const port = config_service.get<string>('REDIS_PORT');
  const db = config_service.get<string>('REDIS_DB', '0');
  const password = config_service.get<string>('REDIS_PASSWORD');

  if (password) {
    return `redis://:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  }

  return `redis://${host}:${port}/${db}`;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      validationOptions: {
        abortEarly: false,
      },
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: '.env',
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
              },
            },
            {
              target: 'pino-roll',
              options: {
                file: './logs/app.log',
                frequency: 'hourly',
                dateFormat: 'yyyy-MM-dd-HH',
                mkdir: true,
              },
            },
          ],
        },
        // We can also redact parts of the body
        redact: [
          'req.headers',
          'res.headers',
          'req.body.password',
          'req.body.newPassword',
        ],
        customProps: (_req, res) => {
          const response = res as {
            locals?: {
              status?: string;
            };
          };

          return {
            error_code: response.locals?.status,
          };
        },
      },
    }),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET, // Use an environment variable for the secret
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config_service: ConfigService) => ({
        stores: [
          new KeyvRedis(buildRedisUrl(config_service), {
            namespace: 'cache',
          }),
        ],
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 30000,
          limit: 15,
        },
      ],
    }),
    DatabaseModule,
    UserModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
