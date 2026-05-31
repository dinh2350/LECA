// apps/web/src/components/scenarios/ScenarioOverviewTab.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import useAuth from '@/services/auth/use-auth';
import {
  useRateScenarioService,
  type ScenarioDetail,
} from '@/services/api/services/scenarios';

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

function StarRatingWidget({
  scenarioId,
  ratingAvg,
  ratingCount,
}: {
  scenarioId: string;
  ratingAvg: number | null | undefined;
  ratingCount: number;
}) {
  const { user } = useAuth();
  const rateScenario = useRateScenarioService();
  const language = useLanguage();
  const router = useRouter();

  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [optimisticAvg, setOptimisticAvg] = useState(ratingAvg);
  const [optimisticCount, setOptimisticCount] = useState(ratingCount);

  async function handleRate(rating: number) {
    if (!user) {
      router.push(`/${language}/sign-in`);
      return;
    }
    setOptimisticAvg(rating);
    setOptimisticCount((c) => c + 1);
    setSubmitted(true);
    try {
      await rateScenario(scenarioId, rating);
    } catch {
      setOptimisticAvg(ratingAvg);
      setOptimisticCount(ratingCount);
      setSubmitted(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {submitted ? (
          <span className="text-xs text-green-400">Rating saved ✓</span>
        ) : (
          <>
            <div
              className="flex gap-0.5"
              onMouseLeave={() => setHovered(0)}
              aria-label="Rate this scenario"
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHovered(star)}
                  onClick={() => handleRate(star)}
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  className="text-xl leading-none transition-transform hover:scale-110"
                  style={{
                    color:
                      star <= (hovered || 0)
                        ? '#f59e0b'
                        : 'rgba(255,255,255,0.2)',
                  }}
                >
                  ★
                </button>
              ))}
            </div>
            {!user && (
              <span className="text-xs text-white/30">Sign in to rate</span>
            )}
          </>
        )}
      </div>
      {optimisticAvg !== null && optimisticAvg !== undefined && (
        <span className="text-xs text-white/40">
          ★ {optimisticAvg.toFixed(1)} ({optimisticCount} rating
          {optimisticCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}

interface ScenarioOverviewTabProps {
  scenario: ScenarioDetail;
  scenarioId: string;
}

export default function ScenarioOverviewTab({
  scenario,
  scenarioId,
}: ScenarioOverviewTabProps) {
  const diffClass =
    DIFFICULTY_COLOUR[scenario.difficulty] ?? 'bg-white/10 text-white/60';

  return (
    <div className="flex flex-col gap-6">
      {/* Meta badges */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base">
          {CATEGORY_ICON[scenario.situationType] ?? '📝'}
        </span>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${diffClass}`}
        >
          {scenario.difficulty} · {DIFFICULTY_LABEL[scenario.difficulty] ?? ''}
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

      {/* Rating */}
      <StarRatingWidget
        scenarioId={scenarioId}
        ratingAvg={scenario.ratingAvg}
        ratingCount={scenario.ratingCount}
      />

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-white/40">
        {scenario.useCount > 0 && (
          <span>{scenario.useCount.toLocaleString()} sessions</span>
        )}
        {scenario.authorName && <span>by {scenario.authorName}</span>}
      </div>
    </div>
  );
}
