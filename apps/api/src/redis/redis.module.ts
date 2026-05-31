import {
  Global,
  Module,
  OnModuleDestroy,
  Inject,
  Logger,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import redisConfig from './redis.config';
import { AllConfigType } from '../config/config.type';

@Global()
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AllConfigType>) => {
        const url = configService.getOrThrow('redis.url', { infer: true });
        const client = new Redis(url);
        client.on('error', (err) => {
          Logger.error('[RedisModule] connection error', err, 'RedisModule');
        });
        client.on('connect', () => {
          Logger.log('Redis connected', 'RedisModule');
        });
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
