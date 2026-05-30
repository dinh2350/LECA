import { getJobContext, log, voice } from '@livekit/agents';

export interface AgentOptions {
  sessionId: string;
  scenarioId: string | null;
}

export class LecaAgent extends voice.Agent {
  private readonly sessionId: string;
  private readonly scenarioId: string | null;

  constructor({ sessionId, scenarioId }: AgentOptions) {
    const instructions = [
      'You are LECA, a friendly English conversation tutor.',
      'Help the user practice their spoken English naturally.',
      'Gently correct grammar mistakes by incorporating the correct form in your reply.',
      'Keep responses concise — 1–3 sentences maximum.',
      scenarioId ? `The conversation scenario context ID is: ${scenarioId}.` : null,
    ]
      .filter(Boolean)
      .join(' ');

    super({ instructions });
    this.sessionId = sessionId;
    this.scenarioId = scenarioId;
  }

  override async onEnter(): Promise<void> {
    const logger = log();
    const ctx = getJobContext();
    const room = ctx.room;

    this.session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (!ev.isFinal || !ev.transcript.trim()) return;
      logger.info({ sessionId: this.sessionId, transcript: ev.transcript }, 'User said');
    });

    this.session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if (ev.item.role !== 'assistant' || ev.item.interrupted) return;
      const text = ev.item.textContent;
      if (!text?.trim()) return;
      logger.info({ sessionId: this.sessionId, text }, 'Agent replied');
    });

    logger.info({ sessionId: this.sessionId, scenarioId: this.scenarioId }, 'Session started');
    void room; // room available via ctx if needed
    this.session.say("Hello! I'm LECA, your English practice partner. What would you like to talk about today?");
  }

  override async onExit(): Promise<void> {
    log().info({ sessionId: this.sessionId }, 'Session ended');
  }
}
