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
      useFactory: (config_service: ConfigService) => ({
        driver: PostgreSqlDriver,
        host: config_service.getOrThrow<string>('DATABASE_HOST'),
        port: config_service.getOrThrow<number>('DATABASE_PORT'),
        user: config_service.getOrThrow<string>('DATABASE_USERNAME'),
        password: config_service.getOrThrow<string>('DATABASE_PASSWORD'),
        dbName: config_service.getOrThrow<string>('DATABASE_NAME'),
        schema: config_service.getOrThrow<string>('DATABASE_SCHEMA', 'public'),
        autoLoadEntities: true,
        debug: config_service.get<boolean>('DATABASE_DEBUG', false),
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
