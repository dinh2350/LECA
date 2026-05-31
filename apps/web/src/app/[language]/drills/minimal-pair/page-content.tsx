'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import {
  useGetPhonemeErrorsService,
  type PhonemeErrors,
} from '@/services/api/services/session-summaries';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

type WordAttempt = { word: string; score: number };

function scoreColor(score: number) {
  return score >= 80 ? '#3CB887' : score < 60 ? '#E85050' : '#F0622A';
}

function MinimalPairContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const language = useLanguage();
  const getPhonemeErrors = useGetPhonemeErrorsService();

  const sessionId = searchParams.get('sessionId');
  const [data, setData] = useState<PhonemeErrors | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [attempts, setAttempts] = useState<WordAttempt[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      const r = mediaRecorderRef.current;
      if (r && r.state !== 'inactive') {
        r.stop();
        r.stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    getPhonemeErrors(sessionId)
      .then(({ status, data: d }) => {
        if (status === HTTP_CODES_ENUM.OK && d) setData(d);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentPair = data?.wordPairs[currentIndex];
  const isComplete = data ? currentIndex >= data.wordPairs.length : false;

  const handlePointerDown = async () => {
    if (isRecording || !currentPair) return;
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(250);
      setIsRecording(true);
    } catch {
      /* mic denied — skip silently */
    }
  };

  const handlePointerUp = () => {
    if (!isRecording || !currentPair) return;
    setIsRecording(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    }
    // Optimistic mock score until backend phoneme scoring pipeline is wired
    const mockScore = Math.floor(Math.random() * 40) + 55;
    setAttempts((prev) => [
      ...prev,
      { word: currentPair.targetWord, score: mockScore },
    ]);
    advanceTimerRef.current = setTimeout(
      () => setCurrentIndex((i) => i + 1),
      600,
    );
  };

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div className="h-8 w-8 rounded-full border-2 border-t-amber-500 border-amber-500/20 animate-spin" />
      </div>
    );
  }

  if (!data || !data.topPhoneme) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
        style={{ background: 'var(--bg)' }}
      >
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-display text-lg font-bold text-white">
          No phoneme errors found
        </p>
        <p className="text-white/40 text-sm mt-1 mb-6">
          Your pronunciation looks great!
        </p>
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="px-6 py-3 rounded-2xl text-sm font-bold"
          style={{ background: 'var(--amber)', color: '#0C0907' }}
        >
          Back to scenarios
        </button>
      </div>
    );
  }

  if (isComplete) {
    const correct = attempts.filter((a) => a.score >= 80).length;
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
        style={{ background: 'var(--bg)' }}
      >
        <p className="text-3xl mb-2">🏆</p>
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          Drill complete!
        </h1>
        <p className="font-mono text-[11px] text-white/40 mb-6">
          {correct} of {attempts.length} correct
        </p>
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="w-full max-w-xs py-4 rounded-2xl text-base font-bold"
          style={{ background: 'var(--amber)', color: '#0C0907' }}
        >
          Back to scenarios
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{ background: 'var(--bg)' }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pt-12 pb-4 gap-3">
        <button
          onClick={() => router.back()}
          className="text-xl text-white/60"
          aria-label="Go back"
        >
          ←
        </button>
        <div>
          <div className="font-mono text-[10px] text-white/40 uppercase">
            Minimal pair drill
          </div>
          <div className="font-display text-lg font-bold text-white">
            {data.topPhoneme} Sound
          </div>
        </div>
        <div className="ml-auto font-mono text-[11px] text-white/40">
          {currentIndex + 1} / {data.wordPairs.length}
        </div>
      </div>

      {/* Word pair cards */}
      <div className="flex-1 px-5 overflow-y-auto">
        {currentPair && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              {
                word: currentPair.targetWord,
                ipa: currentPair.targetIpa,
                isTarget: true,
              },
              {
                word: currentPair.foilWord,
                ipa: currentPair.foilIpa,
                isTarget: false,
              },
            ].map(({ word, ipa, isTarget }) => (
              <div
                key={word}
                className="flex flex-col items-center py-6 rounded-2xl border"
                style={{
                  background: isTarget ? 'rgba(240,98,42,0.08)' : 'var(--s2)',
                  borderColor: isTarget
                    ? 'rgba(240,98,42,0.4)'
                    : 'var(--leca-border)',
                }}
              >
                <div className="font-display text-3xl font-black text-white">
                  {word}
                </div>
                <div className="font-mono text-[11px] text-white/40 mt-1">
                  {ipa}
                </div>
                {isTarget && (
                  <div
                    className="mt-2 px-2 py-0.5 rounded-full font-mono text-[9px]"
                    style={{
                      background: 'rgba(240,98,42,0.15)',
                      color: 'var(--amber)',
                    }}
                  >
                    Say this one
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent attempts */}
        <div className="space-y-2 mb-6">
          {attempts.slice(-3).map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2 rounded-xl border"
              style={{
                background: 'var(--s2)',
                borderColor: 'var(--leca-border)',
              }}
            >
              <span className="font-mono text-sm text-white">{a.word}</span>
              <span
                className="font-display text-sm font-bold"
                style={{ color: scoreColor(a.score) }}
              >
                {a.score} {a.score >= 80 ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PTT button */}
      <div className="flex flex-col items-center gap-3 pb-10 px-5">
        <p className="font-mono text-[10px] text-white/40">
          {isRecording
            ? 'Recording… release to submit'
            : 'Hold to say the highlighted word'}
        </p>
        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          aria-label={isRecording ? 'Recording' : 'Hold to speak'}
          className="w-20 h-20 rounded-full text-3xl flex items-center justify-center select-none touch-none transition-transform"
          style={{
            background: isRecording ? '#E85050' : 'var(--amber)',
            transform: isRecording ? 'scale(0.95)' : 'scale(1)',
            minWidth: '80px',
            minHeight: '80px',
          }}
        >
          🎤
        </button>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(MinimalPairContent);
