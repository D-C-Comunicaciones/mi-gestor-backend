import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';
import { envs } from '@config/envs';
import { REDIS_CLIENT } from './client';

@Global()
@Module({
  providers: [
    {
      provide:  REDIS_CLIENT,
      useFactory: () => {
        return new Redis({
          host: envs.redis.host,
          port: envs.redis.port,
          username: envs.redis.username,
          password: envs.redis.password,
        });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
