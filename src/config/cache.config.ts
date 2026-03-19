import KeyvRedis from '@keyv/redis';
import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

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

export function getCacheConfig(): CacheModuleAsyncOptions {
  return {
    isGlobal: true,
    inject: [ConfigService],
    useFactory: (config_service: ConfigService) => ({
      stores: [
        new KeyvRedis(buildRedisUrl(config_service), {
          namespace: 'cache',
        }),
      ],
    }),
  };
}
