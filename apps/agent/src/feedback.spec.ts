import { parseFeedback, generateFeedback } from './feedback';

describe('parseFeedback', () => {
  it('parses fenced JSON', () => {
    const fb = parseFeedback('```json\n{"fluency":80,"naturalness":70,"vocabulary":60,"explanation":"Nice."}\n```');
    expect(fb).toEqual({ fluency: 80, naturalness: 70, vocabulary: 60, explanation: 'Nice.' });
  });
  it('throws on invalid JSON', () => {
    expect(() => parseFeedback('not json')).toThrow();
  });
});

describe('generateFeedback', () => {
  it('returns parsed feedback from the chat fn', async () => {
    const chat = jest.fn().mockResolvedValue('{"fluency":90,"naturalness":85,"vocabulary":80,"explanation":"Great."}');
    await expect(generateFeedback(chat, 'I goed to school')).resolves.toEqual(
      { fluency: 90, naturalness: 85, vocabulary: 80, explanation: 'Great.' },
    );
  });
  it('returns null when the model output is unusable (non-blocking)', async () => {
    const chat = jest.fn().mockResolvedValue('garbage');
    await expect(generateFeedback(chat, 'hello')).resolves.toBeNull();
  });
});
