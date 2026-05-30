import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AgentDispatchClient, RoomServiceClient } from 'livekit-server-sdk';
import { AllConfigType } from '../config/config.type';

export const LIVEKIT_ROOM_SERVICE = 'LIVEKIT_ROOM_SERVICE';
export const LIVEKIT_DISPATCH_CLIENT = 'LIVEKIT_DISPATCH_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: LIVEKIT_ROOM_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => {
        return new RoomServiceClient(
          config.getOrThrow('livekit.url', { infer: true }),
          config.getOrThrow('livekit.apiKey', { infer: true }),
          config.getOrThrow('livekit.apiSecret', { infer: true }),
        );
      },
    },
    {
      provide: LIVEKIT_DISPATCH_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => {
        return new AgentDispatchClient(
          config.getOrThrow('livekit.url', { infer: true }),
          config.getOrThrow('livekit.apiKey', { infer: true }),
          config.getOrThrow('livekit.apiSecret', { infer: true }),
        );
      },
    },
  ],
  exports: [LIVEKIT_ROOM_SERVICE, LIVEKIT_DISPATCH_CLIENT],
})
export class LiveKitModule {}
