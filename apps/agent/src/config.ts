export const config = {
  livekitUrl: process.env.LIVEKIT_URL ?? 'ws://localhost:7880',
  livekitApiKey: process.env.LIVEKIT_API_KEY ?? 'devkey',
  livekitApiSecret: process.env.LIVEKIT_API_SECRET ?? 'devsecret',
  sttBaseUrl: process.env.STT_BASE_URL ?? 'http://localhost:8000/v1',
  ttsBaseUrl: process.env.TTS_BASE_URL ?? 'http://localhost:9001/v1',
  llmBaseUrl: process.env.LLM_BASE_URL ?? 'http://localhost:11434/v1',
  llmModel: process.env.LLM_MODEL ?? 'llama3.2:3b',
  llmApiKey: process.env.LLM_API_KEY ?? 'local',
};
