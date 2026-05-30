import express, { Request, Response } from 'express';
import { joinRoom, JoinOptions } from './agent';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT ?? 3001);

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.post('/join', (req: Request, res: Response) => {
  const body = req.body as Partial<JoinOptions>;
  const { sessionId, roomName, livekitUrl, token } = body;

  if (!sessionId || !roomName || !livekitUrl || !token) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  // Respond immediately; join room asynchronously
  res.status(202).json({ accepted: true, sessionId });

  joinRoom({ sessionId, roomName, livekitUrl, token }).catch((err: unknown) => {
    console.error(`[agent] Failed to join room for session ${sessionId}:`, err);
  });
});

app.listen(PORT, () => {
  console.log(`[agent] Listening on port ${PORT}`);
});
