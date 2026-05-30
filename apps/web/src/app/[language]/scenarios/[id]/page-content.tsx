'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import {
  useGetScenarioService,
  ScenarioDetail,
  ScenarioPhrase,
} from '@/services/api/services/scenarios';
import { Button } from '@/components/ui/button';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';

// ─── Difficulty colours ────────────────────────────────────────

const DIFFICULTY_COLOUR: Record<string, string> = {
  A1: 'bg-green-500/20 text-green-400 border-green-500/30',
  A2: 'bg-green-500/20 text-green-400 border-green-500/30',
  B1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  B2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  C1: 'bg-red-500/20 text-red-400 border-red-500/30',
  C2: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  B2: 'Upper-Intermediate',
  C1: 'Advanced',
  C2: 'Mastery',
};

const CATEGORY_ICON: Record<string, string> = {
  everyday: '🌍',
  work: '💼',
};

// ─── Phrase row ────────────────────────────────────────────────

function PhraseRow({ phrase }: { phrase: ScenarioPhrase }) {
  const diffClass = phrase.difficulty
    ? (DIFFICULTY_COLOUR[phrase.difficulty] ?? 'bg-white/10 text-white/60')
    : '';

  return (
    <div className="flex flex-col gap-1 border-b border-white/5 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-medium text-amber-300">
          &ldquo;{phrase.phrase}&rdquo;
        </span>
        {phrase.difficulty && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${diffClass}`}
          >
            {phrase.difficulty}
          </span>
        )}
      </div>
      <p className="text-sm text-white/50 italic leading-relaxed">
        e.g. &ldquo;{phrase.exampleSentence}&rdquo;
      </p>
    </div>
  );
}

// ─── Page content ──────────────────────────────────────────────

export default function ScenarioDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const language = useLanguage();
  const getScenario = useGetScenarioService();

  const id = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    getScenario(id).then(({ status, data }) => {
      if (status === HTTP_CODES_ENUM.OK && data) {
        setScenario(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !scenario) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-white/50">
        <p className="text-4xl">📭</p>
        <p className="text-lg">Scenario not found.</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/${language}/scenarios`)}
        >
          Back to library
        </Button>
      </div>
    );
  }

  const diffClass =
    DIFFICULTY_COLOUR[scenario.difficulty] ?? 'bg-white/10 text-white/60';

  return (
    <div className="min-h-screen px-4 py-16 md:px-8 max-w-5xl mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push(`/${language}/scenarios`)}
        className="mb-8 flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        ← Scenario library
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main column ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base">
              {CATEGORY_ICON[scenario.situationType] ?? '📝'}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${diffClass}`}
            >
              {scenario.difficulty} ·{' '}
              {DIFFICULTY_LABEL[scenario.difficulty] ?? ''}
            </span>
            {scenario.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/40"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            {scenario.title}
          </h1>

          {/* Description */}
          {scenario.description && (
            <p className="text-white/60 text-base leading-relaxed">
              {scenario.description}
            </p>
          )}

          {/* Scenario details */}
          <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div>
              <p className="text-xs font-mono text-white/30 mb-1 tracking-widest">
                AI ROLE
              </p>
              <p className="text-sm text-white/80">{scenario.aiRole}</p>
            </div>
            <div className="border-t border-white/5 pt-4">
              <p className="text-xs font-mono text-white/30 mb-1 tracking-widest">
                CONTEXT
              </p>
              <p className="text-sm text-white/70 leading-relaxed">
                {scenario.context}
              </p>
            </div>
            {scenario.openingLine && (
              <div className="border-t border-white/5 pt-4">
                <p className="text-xs font-mono text-white/30 mb-1 tracking-widest">
                  OPENING LINE
                </p>
                <p className="text-sm text-amber-300/80 italic">
                  &ldquo;{scenario.openingLine}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* Rating + author */}
          <div className="flex items-center gap-4 text-sm text-white/40">
            {scenario.ratingAvg !== null &&
              scenario.ratingAvg !== undefined && (
                <span>
                  ★ {scenario.ratingAvg.toFixed(1)} ({scenario.ratingCount}{' '}
                  ratings)
                </span>
              )}
            {scenario.useCount > 0 && (
              <span>{scenario.useCount.toLocaleString()} sessions</span>
            )}
            {scenario.authorName && <span>by {scenario.authorName}</span>}
          </div>

          {/* Start CTA */}
          <div className="flex gap-3 pt-2">
            <Button
              size="lg"
              className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8"
              onClick={() => {
                // TODO: wire to conversation start with scenarioId
              }}
            >
              Start conversation
            </Button>
          </div>
        </div>

        {/* ── Key phrases sidebar ── */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white">Key Phrases</h2>
              <span className="text-xs text-white/30 font-mono">
                {scenario.phrases.length} phrases
              </span>
            </div>

            {scenario.phrases.length === 0 ? (
              <p className="text-sm text-white/30 text-center py-4">
                No key phrases yet.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {scenario.phrases.map((phrase) => (
                  <PhraseRow key={phrase.id} phrase={phrase} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
