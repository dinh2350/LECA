'use client';

import { useState, useEffect, useCallback } from 'react';
import withPageRequiredAuth from '@/services/auth/with-page-required-auth';
import { RoleEnum } from '@/services/api/types/role';
import {
  useListPendingReviewService,
  useReviewScenarioService,
  ScenarioListItem,
} from '@/services/api/services/scenarios';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import { Button } from '@/components/ui/button';

// ─── Review card ───────────────────────────────────────────────

type ReviewCardProps = {
  scenario: ScenarioListItem;
  onDecision: (
    id: string,
    decision: 'approved' | 'rejected',
    notes?: string,
  ) => void;
  disabled: boolean;
};

function ReviewCard({ scenario, onDecision, disabled }: ReviewCardProps) {
  const [notes, setNotes] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-white/30">
              {scenario.situationType}
            </span>
            <span className="text-xs text-white/30">·</span>
            <span className="text-xs font-mono text-white/30">
              {scenario.difficulty}
            </span>
            {scenario.authorName && (
              <>
                <span className="text-xs text-white/30">·</span>
                <span className="text-xs text-white/30">
                  by {scenario.authorName}
                </span>
              </>
            )}
          </div>
          <h3 className="text-base font-semibold text-white">
            {scenario.title}
          </h3>
          {scenario.description && (
            <p className="text-sm text-white/50 leading-relaxed line-clamp-2">
              {scenario.description}
            </p>
          )}
          {scenario.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {scenario.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          {expanded ? 'Less ▲' : 'Notes ▼'}
        </button>
      </div>

      {expanded && (
        <textarea
          placeholder="Optional review notes for the author…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-amber-500/40 resize-none"
        />
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={disabled}
          onClick={() =>
            onDecision(scenario.id, 'approved', notes || undefined)
          }
          className="bg-green-600 hover:bg-green-500 text-white font-medium"
        >
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled}
          onClick={() =>
            onDecision(scenario.id, 'rejected', notes || undefined)
          }
          className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500"
        >
          Reject
        </Button>
      </div>
    </div>
  );
}

// ─── Page content ──────────────────────────────────────────────

function ScenarioReviewPageContent() {
  const listPending = useListPendingReviewService();
  const reviewScenario = useReviewScenarioService();

  const [scenarios, setScenarios] = useState<ScenarioListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPending();
      if (res.status === HTTP_CODES_ENUM.OK && res.data) {
        setScenarios(res.data.data);
        setTotal(res.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [listPending]);

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDecision(
    id: string,
    decision: 'approved' | 'rejected',
    notes?: string,
  ) {
    setProcessing(id);
    try {
      await reviewScenario(id, decision, notes);
      setScenarios((prev) => prev.filter((s) => s.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Scenario Review</h1>
        <p className="text-sm text-white/40">
          {total} scenario{total !== 1 ? 's' : ''} awaiting review
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        </div>
      )}

      {!loading && scenarios.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="text-white/50">No scenarios pending review.</p>
        </div>
      )}

      {!loading && scenarios.length > 0 && (
        <div className="flex flex-col gap-4">
          {scenarios.map((scenario) => (
            <ReviewCard
              key={scenario.id}
              scenario={scenario}
              onDecision={handleDecision}
              disabled={processing === scenario.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default withPageRequiredAuth(ScenarioReviewPageContent, {
  roles: [RoleEnum.ADMIN],
});
