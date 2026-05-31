import { turnFeedbackSchema, type TurnFeedback } from '@n2base/schemas';

export type ChatFn = (prompt: string) => Promise<string>;

export function buildFeedbackPrompt(userText: string): string {
  return [
    'You are an English tutor. Rate the learner utterance below.',
    'Respond with ONLY a compact JSON object, no prose, with integer keys',
    'fluency, naturalness, vocabulary (0-100) and a short "explanation" (<=2 sentences,',
    'mention one concrete improvement).',
    `Learner said: "${userText}"`,
  ].join(' ');
}

export function parseFeedback(raw: string): TurnFeedback {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = (fenced ? fenced[1] : raw).trim();
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model output');
  const parsed = JSON.parse(body.slice(start, end + 1)) as unknown;
  return turnFeedbackSchema.parse(parsed);
}

export async function generateFeedback(chat: ChatFn, userText: string): Promise<TurnFeedback | null> {
  try {
    return parseFeedback(await chat(buildFeedbackPrompt(userText)));
  } catch {
    return null;
  }
}
