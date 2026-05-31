'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useVoiceAssistant,
  useTranscriptions,
  useLocalParticipant,
  useRoomContext,
} from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import useLanguage from '@/services/i18n/use-language';
import {
  useCreateSessionService,
  useEndSessionService,
  type CreateSessionResponse,
} from '@/services/api/services/conversation-sessions';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

// ─── Constants ────────────────────────────────────────────────

const FB_TOGGLE_KEY = 'leca:feedbackOverlay';
const PTT_MAX_DURATION_MS = 60_000;

const WAVE_BARS = [
  { height: 7, delay: 0, duration: 0.3 },
  { height: 14, delay: 0.05, duration: 0.35 },
  { height: 22, delay: 0.1, duration: 0.4 },
  { height: 16, delay: 0.15, duration: 0.38 },
  { height: 20, delay: 0.2, duration: 0.45 },
  { height: 18, delay: 0.25, duration: 0.42 },
  { height: 12, delay: 0.3, duration: 0.36 },
  { height: 8, delay: 0.35, duration: 0.32 },
];

const AGENT_STATE_LABEL: Record<string, string> = {
  connecting: 'Connecting…',
  initializing: 'Starting up…',
  idle: 'Ready',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
  disconnected: 'Disconnected',
};

// ─── Waveform ─────────────────────────────────────────────────

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center gap-[2px] h-[22px]">
      {WAVE_BARS.map((bar, i) => (
        <div
          key={i}
          className="w-[2px] rounded-[1px] bg-amber-500"
          style={{
            height: `${bar.height}px`,
            opacity: active ? undefined : 0.18,
            animation: active
              ? `leca-wv ${bar.duration}s ease-in-out ${bar.delay}s infinite`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ─── PTT button ───────────────────────────────────────────────

interface PttButtonProps {
  onStart: () => void;
  onStop: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

function PttButton({ onStart, onStop, isRecording, disabled }: PttButtonProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      onStart();
      timeoutRef.current = setTimeout(onStop, PTT_MAX_DURATION_MS);
    },
    [disabled, onStart, onStop],
  );

  const handlePointerUp = useCallback(() => {
    clearTimeout(timeoutRef.current);
    onStop();
  }, [onStop]);

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      disabled={disabled}
      aria-label={
        isRecording ? 'Recording — release to submit' : 'Hold to speak'
      }
      className={[
        'relative w-20 h-20 rounded-full border-none cursor-pointer',
        'flex items-center justify-center text-3xl',
        'select-none touch-none transition-transform duration-100',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        isRecording ? 'scale-95' : '',
      ].join(' ')}
      style={{
        background: isRecording
          ? 'var(--red, #E85050)'
          : 'var(--amber, #F0622A)',
        boxShadow: isRecording
          ? '0 0 0 0 rgba(232,80,80,0.5), 0 8px 36px rgba(232,80,80,0.42), inset 0 1px 0 rgba(255,200,180,0.2)'
          : '0 0 0 0 rgba(240,98,42,0.5), 0 8px 36px rgba(240,98,42,0.42), inset 0 1px 0 rgba(255,200,180,0.2)',
      }}
    >
      🎤
      {/* Pulse ring — only when idle */}
      {!isRecording && !disabled && (
        <span
          className="absolute rounded-full border-2 pointer-events-none"
          style={{
            inset: '-10px',
            borderColor: 'rgba(240,98,42,0.3)',
            animation: 'leca-pring 2.2s ease-in-out infinite',
          }}
        />
      )}
    </button>
  );
}

// ─── Message bubble ────────────────────────────────────────────

interface TranscriptEntry {
  id: string;
  text: string;
  isAgent: boolean;
  final: boolean;
}

function MessageBubble({
  entry,
  showFeedback,
}: {
  entry: TranscriptEntry;
  showFeedback: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 ${entry.isAgent ? 'items-start' : 'items-end'}`}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-white/40">
        {entry.isAgent ? 'AI Tutor' : 'You'}
      </span>

      <div
        className={[
          'max-w-[82%] px-4 py-3 text-sm leading-relaxed',
          entry.isAgent
            ? 'bg-[var(--s2)] border border-[var(--leca-border)] text-white/90'
            : 'font-display font-semibold text-[#0C0907] text-[13.5px]',
          entry.isAgent
            ? 'rounded-[4px_14px_14px_14px]'
            : 'rounded-[14px_4px_14px_14px]',
          !entry.final ? 'opacity-45 italic' : '',
        ].join(' ')}
        style={
          entry.isAgent ? undefined : { background: 'var(--amber, #F0622A)' }
        }
      >
        {entry.text || (entry.isAgent ? '…' : 'Speaking…')}
      </div>

      {/* Feedback chip — user turns only, when toggle is on */}
      {!entry.isAgent && entry.final && showFeedback && (
        <div
          className="inline-flex items-center gap-1.5 mt-1 px-3 py-[3px] rounded-full border cursor-pointer font-mono text-[10px] text-green-400"
          style={{
            background: 'var(--s3)',
            borderColor: 'var(--leca-border)',
          }}
        >
          ✦ Feedback · Tap to expand
        </div>
      )}
    </div>
  );
}

// ─── Message scroll area ───────────────────────────────────────

function MessageList({
  entries,
  showFeedback,
  agentState,
}: {
  entries: TranscriptEntry[];
  showFeedback: boolean;
  agentState: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  const isWaiting = agentState === 'thinking' || agentState === 'speaking';

  return (
    <div
      className="flex-1 overflow-y-auto px-5 py-2 flex flex-col gap-4"
      style={{ overscrollBehavior: 'contain' }}
    >
      {entries.length === 0 && !isWaiting && (
        <div className="flex-1 flex items-center justify-center text-center px-8">
          <p className="font-mono text-[11px] text-white/30 leading-relaxed">
            Hold the button below to speak.
            <br />
            LECA will respond after you release.
          </p>
        </div>
      )}

      {entries.map((entry) => (
        <MessageBubble
          key={entry.id}
          entry={entry}
          showFeedback={showFeedback}
        />
      ))}

      {/* Waiting indicator shown while agent is thinking/speaking */}
      {isWaiting && entries.length === 0 && (
        <div className="flex flex-col gap-1 items-start">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-white/40">
            AI Tutor
          </span>
          <div className="max-w-[82%] px-4 py-3 text-sm leading-relaxed rounded-[4px_14px_14px_14px] bg-[var(--s2)] border border-[var(--leca-border)] text-white/40 italic">
            {AGENT_STATE_LABEL[agentState] ?? agentState}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

// ─── Text input fallback ───────────────────────────────────────

function TextFallback() {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Text pathway: renders the UI per FR-CONV-11; actual send via LiveKit data
    // messages will be wired when the agent supports text input.
    setValue('');
  }

  return (
    <div className="px-5 pb-6 flex flex-col gap-2">
      <p className="font-mono text-[10px] text-amber-400/70 text-center">
        Microphone unavailable · Type your message
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type your response…"
          autoFocus
          className={[
            'flex-1 bg-white/[0.05] border border-white/10 rounded-full',
            'px-4 py-2.5 text-sm text-white placeholder:text-white/30',
            'outline-none focus:border-amber-500/50 transition-colors',
          ].join(' ')}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="px-4 py-2.5 bg-amber-500 text-[#0C0907] text-sm font-bold rounded-full disabled:opacity-40 transition-opacity"
        >
          Send
        </button>
      </form>
    </div>
  );
}

// ─── Elapsed timer ────────────────────────────────────────────

function useElapsedTimer() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1_000);
    return () => clearInterval(id);
  }, []);
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ─── Voice room inner content ──────────────────────────────────

function VoiceRoomContent({
  scenarioTitle,
  onEnd,
}: {
  scenarioTitle: string;
  onEnd: () => void;
}) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const { state: agentState } = useVoiceAssistant();
  const transcriptions = useTranscriptions();
  const elapsed = useElapsedTimer();

  const [isRecording, setIsRecording] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const [connected, setConnected] = useState(
    room.state === ConnectionState.Connected,
  );
  const [showFeedback, setShowFeedback] = useState(() => {
    if (typeof window === 'undefined') return true;
    const stored = localStorage.getItem(FB_TOGGLE_KEY);
    return stored === null ? true : stored === 'true';
  });

  // Track room connection
  useEffect(() => {
    if (room.state === ConnectionState.Connected) {
      setConnected(true);
      return;
    }
    const onConnected = () => setConnected(true);
    room.on('connected', onConnected);
    return () => void room.off('connected', onConnected);
  }, [room]);

  // Map LiveKit transcriptions to our format
  const entries: TranscriptEntry[] = transcriptions.map((t) => ({
    id: t.id,
    text: t.text,
    isAgent: t.participant?.identity === 'leca-agent',
    final: t.final,
  }));

  const turnCount = entries.filter((e) => !e.isAgent && e.final).length;

  const handleStart = useCallback(async () => {
    if (micDenied || isRecording || !connected) return;
    try {
      await localParticipant.setMicrophoneEnabled(true);
      setIsRecording(true);
    } catch (err: unknown) {
      const name = err instanceof Error ? err.name : '';
      if (
        name === 'NotAllowedError' ||
        name === 'PermissionDeniedError' ||
        name === 'SecurityError'
      ) {
        setMicDenied(true);
      }
    }
  }, [localParticipant, micDenied, isRecording, connected]);

  const handleStop = useCallback(async () => {
    if (!isRecording) return;
    setIsRecording(false);
    try {
      await localParticipant.setMicrophoneEnabled(false);
    } catch {
      // ignore — room may be disconnecting
    }
  }, [localParticipant, isRecording]);

  const handleFeedbackToggle = useCallback(() => {
    setShowFeedback((prev) => {
      const next = !prev;
      localStorage.setItem(FB_TOGGLE_KEY, String(next));
      return next;
    });
  }, []);

  const handleBack = useCallback(async () => {
    await handleStop();
    onEnd();
  }, [handleStop, onEnd]);

  const stateLabel = AGENT_STATE_LABEL[agentState] ?? agentState;
  const pttDisabled = !connected || micDenied;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--bg, #0C0907)' }}
    >
      {/* ── Status bar ── */}
      <div className="flex justify-between px-5 pt-3 font-mono text-[11px] text-white flex-shrink-0">
        <span>
          {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })}
        </span>
        <span className="text-red-400">🔴 Live</span>
      </div>

      {/* ── Header ── */}
      <div className="flex items-center px-5 py-3.5 gap-3 flex-shrink-0">
        <button
          onClick={handleBack}
          aria-label="Back"
          className="text-xl text-white/60 hover:text-white/90 transition-colors leading-none"
        >
          ←
        </button>

        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-bold text-white truncate">
            {scenarioTitle}
          </p>
          <p className="font-mono text-[10px] text-white/40 mt-0.5">
            {stateLabel} · Turn {turnCount}
          </p>
        </div>

        <div
          className="font-mono text-[13px] text-amber-400 px-2.5 py-1 rounded-full border flex-shrink-0"
          style={{
            background: 'var(--amber-s, rgba(240,98,42,0.12))',
            borderColor: 'rgba(240,98,42,0.25)',
          }}
        >
          {elapsed}
        </div>
      </div>

      {/* ── Messages ── */}
      <MessageList
        entries={entries}
        showFeedback={showFeedback}
        agentState={agentState}
      />

      {/* ── Bottom area ── */}
      {micDenied ? (
        <TextFallback />
      ) : (
        <div className="flex flex-col items-center gap-2.5 px-5 py-3.5 pb-6 flex-shrink-0">
          {/* Waveform */}
          <WaveformBars active={isRecording} />

          {/* PTT button */}
          <PttButton
            onStart={handleStart}
            onStop={handleStop}
            isRecording={isRecording}
            disabled={pttDisabled}
          />

          {/* Hint */}
          <p className="font-mono text-[10px] text-white/40">
            {!connected
              ? 'Connecting…'
              : isRecording
                ? 'Release to submit'
                : 'Hold to speak · Release to submit'}
          </p>

          {/* Feedback toggle */}
          <div className="flex items-center gap-2">
            <button
              role="switch"
              aria-checked={showFeedback}
              onClick={handleFeedbackToggle}
              className="relative flex-shrink-0 rounded-full transition-colors"
              style={{
                width: 34,
                height: 18,
                background: showFeedback
                  ? 'var(--amber, #F0622A)'
                  : 'rgba(255,255,255,0.2)',
                boxShadow: showFeedback
                  ? '0 1px 8px rgba(240,98,42,0.32)'
                  : 'none',
              }}
            >
              <span
                className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full transition-all duration-150"
                style={{ [showFeedback ? 'right' : 'left']: 2 }}
              />
            </button>
            <span className="font-mono text-[10px] text-white/40">
              Show feedback after each turn
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page content (session bootstrap) ─────────────────────────

export default function ConversationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const language = useLanguage();
  const createSession = useCreateSessionService();
  const endSession = useEndSessionService();

  const scenarioId = searchParams.get('scenarioId') ?? undefined;
  const scenarioTitle = searchParams.get('title') ?? 'Free Conversation';

  const [session, setSession] = useState<CreateSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Prevent double-end when onDisconnected and back button fire together
  const endedRef = useRef(false);

  useEffect(() => {
    createSession(scenarioId)
      .then(({ status, data }) => {
        if (status === HTTP_CODES_ENUM.CREATED && data) {
          setSession(data);
        } else {
          setError('Could not start session. Please try again.');
        }
      })
      .catch(() => {
        setError('Could not start session. Please try again.');
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnd = useCallback(async () => {
    if (endedRef.current) return;
    endedRef.current = true;
    if (session) {
      await endSession(session.sessionId).catch(() => {});
    }
    router.push(`/${language}/scenarios`);
  }, [session, endSession, router, language]);

  // ── Loading state ──
  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'var(--bg, #0C0907)' }}
      >
        <div className="h-8 w-8 rounded-full border-2 border-t-amber-500 border-amber-500/20 animate-spin" />
      </div>
    );
  }

  // ── Error state ──
  if (error || !session) {
    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"
        style={{ background: 'var(--bg, #0C0907)' }}
      >
        <p className="text-white/50 text-base">
          {error ?? 'Something went wrong.'}
        </p>
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="px-6 py-2 rounded-full border border-white/20 text-sm text-white/60 hover:border-white/40 hover:text-white/80 transition-colors"
        >
          Back to scenarios
        </button>
      </div>
    );
  }

  // ── Conversation view ──
  return (
    <>
      {/* Scoped keyframes injected once */}
      <style>{`
        @keyframes leca-wv {
          0%, 100% { transform: scaleY(0.18); opacity: 0.22; }
          50%       { transform: scaleY(1);    opacity: 0.9;  }
        }
        @keyframes leca-pring {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%      { transform: scale(1.12); opacity: 0.1; }
        }
      `}</style>

      {/* Full-screen overlay (covers app bar) */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'var(--bg, #0C0907)' }}
      >
        <LiveKitRoom
          serverUrl={session.livekitUrl}
          token={session.livekitToken}
          connect={true}
          audio={false}
          video={false}
          onDisconnected={handleEnd}
          options={{
            audioCaptureDefaults: {
              sampleRate: 16_000,
              channelCount: 1,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          }}
          style={{ height: '100%' }}
        >
          <RoomAudioRenderer />
          <VoiceRoomContent scenarioTitle={scenarioTitle} onEnd={handleEnd} />
        </LiveKitRoom>
      </div>
    </>
  );
}
