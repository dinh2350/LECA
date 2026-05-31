import { recordTurnsSchema, turnFeedbackSchema } from './turn.schema';

describe('turn schemas', () => {
  it('accepts a valid feedback object', () => {
    const ok = turnFeedbackSchema.safeParse({
      fluency: 80,
      naturalness: 75,
      vocabulary: 60,
      explanation: 'Good rhythm. Try "I would like" instead of "I want".',
    });
    expect(ok.success).toBe(true);
  });

  it('rejects out-of-range scores', () => {
    expect(turnFeedbackSchema.safeParse({ fluency: 120, naturalness: 1, vocabulary: 1, explanation: 'x' }).success).toBe(false);
  });

  it('requires at least one turn with a non-empty transcript', () => {
    expect(recordTurnsSchema.safeParse({ turns: [] }).success).toBe(false);
    expect(
      recordTurnsSchema.safeParse({ turns: [{ speaker: 'learner', transcript: 'hi', turnIndex: 0 }] }).success,
    ).toBe(true);
  });
});
