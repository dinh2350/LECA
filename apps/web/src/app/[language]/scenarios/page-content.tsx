'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from '@/components/link';
import useLanguage from '@/services/i18n/use-language';
import {
  useListScenariosService,
  ScenarioListItem,
} from '@/services/api/services/scenarios';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// ─── Difficulty badge colours ──────────────────────────────────

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
  B2: 'Upper-Int.',
  C1: 'Advanced',
  C2: 'Mastery',
};

const CATEGORY_ICON: Record<string, string> = {
  everyday: '🌍',
  work: '💼',
};

const CATEGORY_LABEL: Record<string, string> = {
  everyday: 'Everyday',
  work: 'Professional',
};

// ─── Star rating ───────────────────────────────────────────────

function StarRating({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null;
  const filled = Math.round(value);
  return (
    <span
      className="flex gap-0.5 text-xs"
      aria-label={`${value.toFixed(1)} stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            color: i <= filled ? 'var(--amber)' : undefined,
            opacity: i <= filled ? 1 : 0.3,
          }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

// ─── Scenario card ─────────────────────────────────────────────

function ScenarioCard({
  scenario,
  language,
}: {
  scenario: ScenarioListItem;
  language: string;
}) {
  const diffClass =
    DIFFICULTY_COLOUR[scenario.difficulty] ?? 'bg-white/10 text-white/60';

  return (
    <Link
      href={`/${language}/scenarios/${scenario.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-all hover:border-white/20 hover:bg-white/[0.06] hover:-translate-y-0.5"
    >
      {/* Category icon + label */}
      <div className="flex items-center gap-2 text-xs text-white/50">
        <span>{CATEGORY_ICON[scenario.situationType] ?? '📝'}</span>
        <span>
          {CATEGORY_LABEL[scenario.situationType] ?? scenario.situationType}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-white leading-snug group-hover:text-amber-300 transition-colors line-clamp-2">
        {scenario.title}
      </h3>

      {/* Description */}
      {scenario.description && (
        <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
          {scenario.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${diffClass}`}
        >
          {scenario.difficulty} · {DIFFICULTY_LABEL[scenario.difficulty] ?? ''}
        </span>
        <div className="flex items-center gap-2">
          <StarRating value={scenario.ratingAvg} />
          {scenario.authorName && (
            <span className="text-[11px] text-white/30">
              by {scenario.authorName}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Page content ──────────────────────────────────────────────

const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function ScenariosPageContent() {
  const language = useLanguage();
  const listScenarios = useListScenariosService();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'everyday' | 'work' | ''>('');
  const [difficulty, setDifficulty] = useState('');
  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  const fetchScenarios = useCallback(
    async (q: string, cat: string, diff: string) => {
      setLoading(true);
      try {
        const res = await listScenarios({
          q: q || undefined,
          category: (cat as 'everyday' | 'work') || undefined,
          difficulty: diff || undefined,
          limit: 50,
        });
        if (res.status === HTTP_CODES_ENUM.OK) {
          setScenarios(res.data?.data ?? []);
          setTotal(res.data?.total ?? 0);
        }
      } catch {
        // Network error — leave existing scenarios in place
      } finally {
        setLoading(false);
      }
    },
    [listScenarios],
  );

  // Single effect: immediate on initial load, debounced for filter changes
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchScenarios(search, category, difficulty);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchScenarios(search, category, difficulty);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, difficulty]);

  // Group by category
  const grouped: Record<string, ScenarioListItem[]> = {};
  for (const s of scenarios) {
    const key = s.situationType;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }

  const isFiltered = search || category || difficulty;

  return (
    <div className="min-h-screen px-4 py-16 md:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-mono tracking-widest text-amber-400/70 mb-3">
          {'// SCENARIO LIBRARY'}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Choose your{' '}
          <span style={{ color: 'var(--amber)' }}>conversation.</span>
        </h1>
        <p className="text-white/60 text-lg max-w-xl">
          {total} scenarios covering everyday and professional English contexts.
          Pick one and start practising.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
            🔍
          </span>
          <Input
            placeholder="Search scenarios…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            data-testid="scenario-search"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2">
          {(['', 'everyday', 'work'] as const).map((cat) => (
            <Button
              key={cat || 'all'}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
              className={
                category === cat
                  ? 'bg-amber-500 text-black border-transparent'
                  : 'border-white/10 text-white/60 hover:text-white'
              }
            >
              {cat === ''
                ? 'All'
                : cat === 'everyday'
                  ? '🌍 Everyday'
                  : '💼 Work'}
            </Button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex gap-1.5 flex-wrap">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(difficulty === d ? '' : d)}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
                difficulty === d
                  ? (DIFFICULTY_COLOUR[d] ?? '')
                  : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        </div>
      )}

      {/* Empty state */}
      {!loading && scenarios.length === 0 && (
        <div className="text-center py-20 text-white/40">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">No scenarios found.</p>
          {isFiltered && (
            <button
              onClick={() => {
                setSearch('');
                setCategory('');
                setDifficulty('');
              }}
              className="mt-3 text-sm text-amber-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Grouped grid (when no search/filter) or flat grid */}
      {!loading &&
        scenarios.length > 0 &&
        (isFiltered ? (
          <div>
            <p className="text-sm text-white/40 mb-6">
              {total} result{total !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {scenarios.map((s) => (
                <ScenarioCard key={s.id} scenario={s} language={language} />
              ))}
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([cat, items]) => (
            <div key={cat} className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">{CATEGORY_ICON[cat] ?? '📝'}</span>
                <h2 className="text-lg font-semibold text-white">
                  {CATEGORY_LABEL[cat] ?? cat}
                </h2>
                <span className="ml-1 text-xs text-white/30 font-mono">
                  {items.length} scenarios
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((s) => (
                  <ScenarioCard key={s.id} scenario={s} language={language} />
                ))}
              </div>
            </div>
          ))
        ))}
    </div>
  );
}
