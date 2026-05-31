'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import {
  useGetSessionSummaryService,
  type SessionSummary,
} from '@/services/api/services/session-summaries';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

const COMPETENCY_CONFIG = [
  { key: 'fluencyScore', label: 'Fluency', icon: '🗣️' },
  { key: 'pronunciationScore', label: 'Pron.', icon: '🔊' },
  { key: 'vocabularyScore', label: 'Vocab', icon: '📖' },
] as const;

function scoreColor(score: number | null) {
  if (score === null) return 'rgba(255,255,255,0.3)';
  if (score >= 80) return '#3CB887';
  if (score >= 60) return '#F0622A';
  return '#E85050';
}

function formatDuration(seconds: number | null) {
  if (!seconds) return '0m';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function SessionSummaryContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const language = useLanguage();
  const getSummary = useGetSessionSummaryService();
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSummary(params.id)
      .then(({ status, data }) => {
        if (status === HTTP_CODES_ENUM.OK && data) setSummary(data);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (!summary) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-8 text-center"
        style={{ background: 'var(--bg)' }}
      >
        <p className="text-white/50 mb-4">Summary not found.</p>
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="text-amber-400 text-sm underline"
        >
          Back to scenarios
        </button>
      </div>
    );
  }

  const overallScore = summary.pronunciationScore ?? 0;

  return (
    <div
      className="min-h-screen max-w-sm mx-auto px-5 pb-24"
      style={{ background: 'var(--bg)' }}
    >
      {/* Hero */}
      <div className="flex flex-col items-center pt-10 pb-6">
        <div className="text-4xl mb-2">🎯</div>
        <h1 className="font-display text-2xl font-bold text-white">
          Session Complete
        </h1>
        {summary.scenarioTitle && (
          <p className="font-mono text-[11px] text-white/40 mt-1">
            &ldquo;{summary.scenarioTitle}&rdquo;
          </p>
        )}

        {/* Score ring */}
        <div
          className="mt-4 w-20 h-20 rounded-full flex flex-col items-center justify-center border-4"
          style={{ borderColor: scoreColor(overallScore) }}
        >
          <span
            className="font-display text-2xl font-black"
            style={{ color: scoreColor(overallScore) }}
          >
            {Math.round(overallScore)}
          </span>
          <span className="font-mono text-[8px] text-white/40">
            pron. score
          </span>
        </div>

        {/* 4 competency scores */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          {COMPETENCY_CONFIG.map(({ key, label, icon }) => {
            const val = summary[key];
            return (
              <div
                key={key}
                className="flex flex-col items-center py-3 rounded-xl border"
                style={{
                  background: 'var(--s2)',
                  borderColor: 'var(--leca-border)',
                }}
              >
                <span className="text-sm">{icon}</span>
                <span
                  className="font-display text-lg font-black mt-0.5"
                  style={{ color: scoreColor(val) }}
                >
                  {val !== null ? Math.round(val) : '—'}
                </span>
                <span className="font-mono text-[8px] text-white/40 uppercase">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { label: 'Duration', value: formatDuration(summary.durationSeconds) },
          { label: 'Turns', value: String(summary.turnCount) },
          {
            label: 'Speaking',
            value: formatDuration(Math.floor(summary.speakingMs / 1000)),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center py-3 rounded-xl border"
            style={{
              background: 'var(--s2)',
              borderColor: 'var(--leca-border)',
            }}
          >
            <span className="font-display text-xl font-bold text-white">
              {value}
            </span>
            <span className="font-mono text-[9px] text-white/40 uppercase mt-0.5">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Vocabulary this session */}
      {(summary.phrasesUsed.length > 0 || summary.phrasesMissed.length > 0) && (
        <section className="mb-6">
          <h2 className="font-mono text-[11px] text-white/40 uppercase tracking-widest mb-3">
            Vocabulary this session
          </h2>

          {summary.phrasesUsed.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {summary.phrasesUsed.map((p) => (
                <span
                  key={p}
                  className="px-3 py-1 rounded-full text-xs font-mono"
                  style={{
                    background: 'rgba(60,184,135,0.12)',
                    color: '#3CB887',
                    border: '1px solid rgba(60,184,135,0.25)',
                  }}
                >
                  ✓ {p}
                </span>
              ))}
            </div>
          )}

          {summary.phrasesMissed.length > 0 && (
            <div
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: 'var(--leca-border)' }}
            >
              <div
                className="px-4 py-2 font-mono text-[10px] text-white/40 border-b"
                style={{
                  background: 'var(--s2)',
                  borderColor: 'var(--leca-border)',
                }}
              >
                💡 Could have used
              </div>
              {summary.phrasesMissed.map((p) => (
                <div
                  key={p.phrase}
                  className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                  style={{ borderColor: 'var(--leca-border)' }}
                >
                  <div className="flex-1">
                    <div className="text-sm text-white font-semibold">
                      &ldquo;{p.phrase}&rdquo;
                    </div>
                    <div className="font-mono text-[10px] text-white/40 mt-0.5">
                      {p.exampleSentence}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Action buttons */}
      <div className="space-y-3">
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="w-full py-4 rounded-2xl text-base font-bold"
          style={{ background: 'var(--amber, #F0622A)', color: '#0C0907' }}
        >
          Practice this again
        </button>
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="w-full py-4 rounded-2xl border text-sm text-white/60"
          style={{ borderColor: 'var(--leca-border)' }}
        >
          Choose new scenario
        </button>
        {summary.phonemeErrorCount >= 3 && summary.topPhonemeError && (
          <button
            onClick={() =>
              router.push(
                `/${language}/drills/minimal-pair?sessionId=${params.id}`,
              )
            }
            className="w-full py-4 rounded-2xl border text-sm font-mono"
            style={{
              borderColor: 'rgba(240,98,42,0.3)',
              color: 'var(--amber)',
            }}
          >
            🔊 Review weak sounds ({summary.topPhonemeError})
          </button>
        )}
        <button
          disabled
          title="Coming soon"
          className="w-full py-2 text-center font-mono text-[11px] text-white/20 cursor-not-allowed"
        >
          📤 Share my progress report (coming soon)
        </button>
      </div>
    </div>
  );
}

export default withPageRequiredAuth(SessionSummaryContent);
