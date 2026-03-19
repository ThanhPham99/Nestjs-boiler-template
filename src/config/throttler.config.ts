import { ThrottlerModuleOptions } from '@nestjs/throttler';

export function getThrottlerConfig(): ThrottlerModuleOptions {
  return {
    throttlers: [
      {
        ttl: 30000,
        limit: 15,
      },
    ],
  };
}
