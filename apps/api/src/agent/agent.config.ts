import { registerAs } from '@nestjs/config';

export default registerAs('agent', () => ({
  apiKey: process.env.LECA_AGENT_API_KEY ?? 'devagentkey',
}));
