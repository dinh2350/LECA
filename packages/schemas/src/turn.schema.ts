import { z } from 'zod';

export const turnFeedbackSchema = z.object({
  fluency: z.number().int().min(0).max(100),
  naturalness: z.number().int().min(0).max(100),
  vocabulary: z.number().int().min(0).max(100),
  explanation: z.string().min(1).max(500),
});
export type TurnFeedback = z.infer<typeof turnFeedbackSchema>;

export const recordTurnSchema = z.object({
  speaker: z.enum(['learner', 'agent']),
  transcript: z.string().min(1),
  turnIndex: z.number().int().min(0),
  durationMs: z.number().int().min(0).optional(),
  feedback: turnFeedbackSchema.nullish(),
});
export type RecordTurnInput = z.infer<typeof recordTurnSchema>;

export const recordTurnsSchema = z.object({
  turns: z.array(recordTurnSchema).min(1).max(2),
});
export type RecordTurnsInput = z.infer<typeof recordTurnsSchema>;
