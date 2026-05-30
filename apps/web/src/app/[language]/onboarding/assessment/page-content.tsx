'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { useTranslation } from '@/services/i18n/client';
import useLanguage from '@/services/i18n/use-language';
import { useRouter } from 'next/navigation';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import {
  useStartAssessmentService,
  useAnswerAssessmentService,
  useCompleteAssessmentService,
  StartAssessmentResponse,
  CompleteAssessmentResponse,
} from '@/services/api/services/assessments';

const SESSION_KEY = 'leca:assessment:checked';

type Stage =
  | { kind: 'loading' }
  | { kind: 'prompt'; session: StartAssessmentResponse; promptIndex: number; promptText: string }
  | { kind: 'recording'; session: StartAssessmentResponse; promptIndex: number; promptText: string }
  | { kind: 'submitting'; session: StartAssessmentResponse }
  | { kind: 'result'; result: CompleteAssessmentResponse };

function AssessmentPageContent() {
  const { t } = useTranslation('assessment');
  const language = useLanguage();
  const router = useRouter();

  const startAssessment = useStartAssessmentService();
  const answerAssessment = useAnswerAssessmentService();
  const completeAssessment = useCompleteAssessmentService();

  const [stage, setStage] = useState<Stage>({ kind: 'loading' });
  const [transcript, setTranscript] = useState('');
  const [micError, setMicError] = useState(false);
  const [totalPrompts, setTotalPrompts] = useState(5);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Start assessment on mount
  useEffect(() => {
    startAssessment().then(({ status, data }) => {
      if (status !== HTTP_CODES_ENUM.CREATED) return;
      setTotalPrompts(data.totalPrompts);
      setStage({
        kind: 'prompt',
        session: data,
        promptIndex: data.promptIndex,
        promptText: data.promptText,
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = useCallback(async () => {
    if (stage.kind !== 'prompt') return;
    setTranscript('');
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(250);
      setStage({ ...stage, kind: 'recording' });
    } catch {
      setMicError(true);
    }
  }, [stage]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
  }, []);

  const submitAnswer = useCallback(
    async (audio?: Blob) => {
      if (stage.kind !== 'recording' && stage.kind !== 'prompt') return;
      const session = stage.session;
      setStage({ kind: 'submitting', session });

      const { status, data } = await answerAssessment({
        id: session.id,
        audio,
        transcript: transcript || undefined,
      });

      if (status !== HTTP_CODES_ENUM.OK) {
        setStage({ kind: 'prompt', session, promptIndex: stage.promptIndex, promptText: stage.promptText });
        return;
      }

      if (data.isComplete) {
        // All prompts answered — finalise
        const { status: cs, data: cd } = await completeAssessment(session.id);
        if (cs === HTTP_CODES_ENUM.OK) {
          sessionStorage.setItem(SESSION_KEY, 'done');
          setStage({ kind: 'result', result: cd });
        }
      } else {
        setStage({
          kind: 'prompt',
          session,
          promptIndex: data.nextPromptIndex!,
          promptText: data.nextPromptText!,
        });
        setTranscript('');
      }
    },
    [stage, transcript, answerAssessment, completeAssessment],
  );

  const handleStopAndSubmit = useCallback(async () => {
    if (stage.kind !== 'recording') return;
    stopRecording();
    await new Promise<void>((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder) { resolve(); return; }
      recorder.onstop = () => resolve();
    });
    const audioBlob =
      chunksRef.current.length > 0
        ? new Blob(chunksRef.current, { type: 'audio/webm' })
        : undefined;
    await submitAnswer(audioBlob);
  }, [stage, stopRecording, submitAnswer]);

  const handleTextSubmit = useCallback(async () => {
    await submitAnswer(undefined);
  }, [submitAnswer]);

  const handleContinue = useCallback(() => {
    router.push(`/${language}`);
  }, [language, router]);

  // ─── Render ─────────────────────────────────────────────────

  if (stage.kind === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--color-muted)]">Starting assessment…</p>
      </div>
    );
  }

  if (stage.kind === 'result') {
    const { levelLabel, score } = stage.result;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="text-3xl font-bold text-[var(--color-foreground)]">
          Assessment Complete!
        </h1>
        <p className="text-xl text-[var(--color-muted)]">
          Your English level: <span className="font-semibold text-[var(--color-accent)]">{levelLabel}</span>
        </p>
        <p className="text-sm text-[var(--color-muted)]">Fluency score: {score}/100</p>
        <button
          onClick={handleContinue}
          className="mt-4 rounded-lg bg-[var(--color-accent)] px-8 py-3 font-semibold text-white hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Continue to LECA
        </button>
      </div>
    );
  }

  const { promptIndex, promptText } = stage as Extract<Stage, { kind: 'prompt' | 'recording' | 'submitting' }> & { promptIndex?: number; promptText?: string };
  const isRecording = stage.kind === 'recording';
  const isSubmitting = stage.kind === 'submitting';
  const progress = ((promptIndex ?? 0) / totalPrompts) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      {/* Progress */}
      <div className="w-full max-w-lg">
        <div className="flex justify-between text-sm text-[var(--color-muted)] mb-1">
          <span>Prompt {(promptIndex ?? 0) + 1} of {totalPrompts}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--color-border)]">
          <div
            className="h-2 rounded-full bg-[var(--color-accent)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Prompt */}
      <div className="w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <p className="text-lg font-medium text-[var(--color-foreground)]">{promptText}</p>
      </div>

      {/* Input area */}
      <div className="flex w-full max-w-lg flex-col gap-4">
        {micError ? (
          /* Text fallback when mic is denied */
          <>
            <p className="text-sm text-[var(--color-muted)]">
              Microphone access denied. Type your answer below instead.
            </p>
            <textarea
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              rows={4}
              placeholder="Type your answer…"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={isSubmitting}
            />
            <button
              onClick={handleTextSubmit}
              disabled={isSubmitting || !transcript.trim()}
              className="rounded-lg bg-[var(--color-accent)] px-6 py-2 font-semibold text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Submitting…' : 'Submit Answer'}
            </button>
          </>
        ) : (
          /* Mic recording UI */
          <div className="flex flex-col items-center gap-4">
            {!isRecording && !isSubmitting && (
              <button
                onClick={startRecording}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                title="Start recording"
              >
                {/* Mic icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                  <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
                  <path d="M19 10a1 1 0 0 1 2 0 9 9 0 0 1-18 0 1 1 0 1 1 2 0 7 7 0 0 0 14 0z" />
                  <path d="M11 21h2v2h-2z" />
                </svg>
              </button>
            )}

            {isRecording && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500 text-white animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                    <circle cx="12" cy="12" r="8" />
                  </svg>
                </div>
                <p className="text-sm text-[var(--color-muted)]">Recording… speak clearly</p>
                <button
                  onClick={handleStopAndSubmit}
                  className="rounded-lg border border-[var(--color-border)] px-6 py-2 font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-surface)] transition-colors"
                >
                  Stop & Submit
                </button>
              </>
            )}

            {isSubmitting && (
              <p className="text-sm text-[var(--color-muted)]">Analysing your answer…</p>
            )}

            {/* Optional text transcript alongside recording */}
            {!isSubmitting && (
              <textarea
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                rows={2}
                placeholder="Or type your answer here (optional)"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default withPageRequiredAuth(AssessmentPageContent);
