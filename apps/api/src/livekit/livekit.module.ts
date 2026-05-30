import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoomServiceClient } from 'livekit-server-sdk';
import { AllConfigType } from '../config/config.type';

export const LIVEKIT_ROOM_SERVICE = 'LIVEKIT_ROOM_SERVICE';

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
  ],
  exports: [LIVEKIT_ROOM_SERVICE],
})
export class LiveKitModule {}
