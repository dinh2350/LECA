import { getJobContext, log, voice } from '@livekit/agents';
import type { RecordTurnInput, TurnFeedback } from '@n2base/schemas';
import { generateFeedback, type ChatFn } from './feedback.js';
import { postTurns } from './leca-api-client.js';
import { config } from './config.js';

export interface AgentOptions {
  sessionId: string;
  scenarioId: string | null;
  chat: ChatFn;
}

export class LecaAgent extends voice.Agent {
  private readonly sessionId: string;
  private readonly scenarioId: string | null;
  private readonly chat: ChatFn;
  private turnIndex = 0;
  private pendingUser: { text: string } | null = null;

  constructor({ sessionId, scenarioId, chat }: AgentOptions) {
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
    this.chat = chat;
  }

  override async onEnter(): Promise<void> {
    const logger = log();
    const ctx = getJobContext();
    const room = ctx.room;

    this.session.on(voice.AgentSessionEventTypes.UserInputTranscribed, (ev) => {
      if (!ev.isFinal || !ev.transcript.trim()) return;
      this.pendingUser = { text: ev.transcript.trim() };
    });

    this.session.on(voice.AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if (ev.item.role !== 'assistant' || ev.item.interrupted) return;
      const agentText = ev.item.textContent?.trim();
      const user = this.pendingUser;
      this.pendingUser = null;
      if (!agentText || !user) return;
      void this.persistExchange(room, user.text, agentText);
    });

    logger.info({ sessionId: this.sessionId, scenarioId: this.scenarioId }, 'Session started');
    this.session.say("Hello! I'm LECA, your English practice partner. What would you like to talk about today?");
  }

  override async onExit(): Promise<void> {
    log().info({ sessionId: this.sessionId }, 'Session ended');
  }

  private async persistExchange(
    room: ReturnType<typeof getJobContext>['room'],
    userText: string,
    agentText: string,
  ): Promise<void> {
    const learnerIndex = this.turnIndex++;
    const agentIndex = this.turnIndex++;

    const feedback: TurnFeedback | null = await generateFeedback(this.chat, userText);

    if (feedback) {
      try {
        const payload = new TextEncoder().encode(JSON.stringify({ type: 'feedback', turnIndex: learnerIndex, feedback }));
        await room.localParticipant?.publishData(payload, { reliable: true });
      } catch (err) {
        log().warn({ err: String(err) }, 'publishData(feedback) failed');
      }
    }

    const turns: RecordTurnInput[] = [
      { speaker: 'learner', transcript: userText, turnIndex: learnerIndex, feedback: feedback ?? undefined },
      { speaker: 'agent', transcript: agentText, turnIndex: agentIndex },
    ];
    await postTurns(fetch, { apiUrl: config.apiUrl, agentApiKey: config.agentApiKey }, this.sessionId, turns);
  }
}
