import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MemoryCacheAdapter, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      driver: PostgreSqlDriver,
      useFactory: (configService: ConfigService) => ({
        driver: PostgreSqlDriver,
        host: configService.getOrThrow<string>('DATABASE_HOST'),
        port: configService.getOrThrow<number>('DATABASE_PORT'),
        user: configService.getOrThrow<string>('DATABASE_USERNAME'),
        password: configService.getOrThrow<string>('DATABASE_PASSWORD'),
        dbName: configService.getOrThrow<string>('DATABASE_NAME'),
        schema: configService.getOrThrow<string>('DATABASE_SCHEMA', 'public'),
        autoLoadEntities: true,
        debug: configService.get<boolean>('DATABASE_DEBUG', false),
        discovery: { warnWhenNoEntities: false },
        resultCache: {
          adapter: MemoryCacheAdapter,
          expiration: 1000,
          global: true,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
