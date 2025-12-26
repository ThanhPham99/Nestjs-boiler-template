import { DatabaseModule } from '@database/database.module';
import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

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
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
        // We can also redact parts of the body
        redact: [
          'req.headers',
          'res.headers',
          'req.body.password',
          'req.body.newPassword',
        ],
        customProps: (req: any, res: any) => ({
          errorCode: res.locals.status,
        }),
      },
    }),
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET, // Use an environment variable for the secret
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService], // Inject the ConfigService
      useFactory: async (configService: ConfigService) => {
        return {
          stores: [
            new KeyvRedis(
              `redis://:${configService.get<string>(
                'REDIS_PASSWORD',
              )}@${configService.get<string>(
                'REDIS_HOST',
              )}:${configService.get<string>(
                'REDIS_PORT',
              )}/${configService.get<string>('REDIS_DB')}`,
              {
                namespace: 'cache',
              },
            ),
          ],
        };
      },
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
