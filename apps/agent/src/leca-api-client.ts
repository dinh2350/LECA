import { log } from '@livekit/agents';
import type { RecordTurnInput } from '@n2base/schemas';

export interface ApiClientConfig {
  apiUrl: string;
  agentApiKey: string;
}

export async function postTurns(
  fetchImpl: typeof fetch,
  cfg: ApiClientConfig,
  sessionId: string,
  turns: RecordTurnInput[],
): Promise<void> {
  try {
    const res = await fetchImpl(`${cfg.apiUrl}/v1/conversation-sessions/${sessionId}/turns`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-leca-agent-key': cfg.agentApiKey },
      body: JSON.stringify({ turns }),
    });
    if (!res.ok) log().warn({ sessionId, status: res.status }, 'postTurns failed');
  } catch (err) {
    log().warn({ sessionId, err: String(err) }, 'postTurns threw');
  }
}
