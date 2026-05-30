import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  metrics,
  voice,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import { fileURLToPath } from 'node:url';
import { LecaAgent, type AgentOptions } from './agent.js';
import { config } from './config.js';

export default defineAgent({
  // prewarm: runs once at process startup — loads Silero VAD model into RAM
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    await ctx.connect();

    const vad = ctx.proc.userData.vad as silero.VAD;

    const metadata = JSON.parse(ctx.job.metadata || '{}') as {
      sessionId?: string;
      scenarioId?: string | null;
    };

    const agentOptions: AgentOptions = {
      sessionId: metadata.sessionId ?? ctx.job.id,
      scenarioId: metadata.scenarioId ?? null,
    };

    const session = new voice.AgentSession({
      vad,
      stt: new openai.STT({
        model: 'whisper-1',
        baseURL: config.sttBaseUrl,
        apiKey: 'local',
        useRealtime: false,
      }),
      llm: new openai.LLM({
        model: config.llmModel,
        baseURL: config.llmBaseUrl,
        apiKey: config.llmApiKey,
      }),
      tts: new openai.TTS({
        model: 'kokoro',
        voice: 'af_heart' as Parameters<typeof openai.TTS>[0]['voice'],
        baseURL: config.ttsBaseUrl,
        apiKey: 'local',
      }),
    });

    session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      metrics.logMetrics(ev.metrics);
    });

    await session.start({
      agent: new LecaAgent(agentOptions),
      room: ctx.room,
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'leca-agent',
  }),
);
