import { Room, RoomEvent, TrackKind, AudioStream } from '@livekit/rtc-node';

export interface JoinOptions {
  sessionId: string;
  roomName: string;
  livekitUrl: string;
  token: string;
}

async function drainAudioStream(
  stream: AudioStream,
  sessionId: string,
  participantIdentity: string,
): Promise<void> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value: frame } = await reader.read();
      if (done) break;
      console.log(
        `[agent][${sessionId}] Audio chunk: ${frame.data.length} samples from ${participantIdentity}`,
      );
    }
  } finally {
    reader.releaseLock();
  }
}

export async function joinRoom(opts: JoinOptions): Promise<void> {
  const room = new Room();

  room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
    if (track.kind !== TrackKind.KIND_AUDIO) return;

    console.log(
      `[agent][${opts.sessionId}] Audio track subscribed from ${participant.identity}`,
    );

    const stream = new AudioStream(track);
    drainAudioStream(stream, opts.sessionId, participant.identity).catch(
      (err: unknown) => {
        console.error(
          `[agent][${opts.sessionId}] AudioStream error:`,
          String(err),
        );
      },
    );
  });

  room.on(RoomEvent.Disconnected, (reason) => {
    console.log(`[agent][${opts.sessionId}] Disconnected: ${String(reason)}`);
  });

  room.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log(
      `[agent][${opts.sessionId}] Participant connected: ${participant.identity}`,
    );
  });

  room.on(RoomEvent.ParticipantDisconnected, (participant) => {
    console.log(
      `[agent][${opts.sessionId}] Participant disconnected: ${participant.identity}`,
    );
  });

  await room.connect(opts.livekitUrl, opts.token, {
    autoSubscribe: true,
    dynacast: false,
  });

  console.log(
    `[agent][${opts.sessionId}] Connected to room ${opts.roomName}`,
  );
}
