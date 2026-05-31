import { postTurns } from './leca-api-client';

jest.mock('@livekit/agents', () => ({
  log: () => ({
    warn: jest.fn(),
    info: jest.fn(),
  }),
}));

describe('postTurns', () => {
  const turns = [{ speaker: 'learner' as const, transcript: 'hi', turnIndex: 0 }];

  it('POSTs to the turns endpoint with the agent key header', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    await postTurns(fetchMock as any, { apiUrl: 'http://api', agentApiKey: 'k' }, 's1', turns);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api/v1/conversation-sessions/s1/turns',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-leca-agent-key': 'k', 'content-type': 'application/json' }),
        body: JSON.stringify({ turns }),
      }),
    );
  });

  it('does not throw when the API errors (non-blocking)', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(postTurns(fetchMock as any, { apiUrl: 'http://api', agentApiKey: 'k' }, 's1', turns)).resolves.toBeUndefined();
  });
});

