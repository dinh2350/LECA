import { registerAs } from '@nestjs/config';

export default registerAs('livekit', () => ({
  apiKey: process.env.LIVEKIT_API_KEY ?? '',
  apiSecret: process.env.LIVEKIT_API_SECRET ?? '',
  url: process.env.LIVEKIT_HOST ?? 'ws://livekit:7880',
  agentUrl: process.env.AGENT_URL ?? 'http://agent:3001',
}));
