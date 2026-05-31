'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import PhraseDetailSheet from './phrase-detail-sheet';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';

interface KeyPhrasesPanelProps {
  open: boolean;
  scenarioTitle: string;
  phrases: ScenarioPhrase[];
  onStart: () => void;
}

export default function KeyPhrasesPanel({
  open,
  scenarioTitle,
  phrases,
  onStart,
}: KeyPhrasesPanelProps) {
  const [selectedPhrase, setSelectedPhrase] = useState<ScenarioPhrase | null>(
    null,
  );

  return (
    <>
      <Sheet open={open}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-0 pb-0 max-h-[85vh] flex flex-col"
          style={{ background: 'var(--s2, #1a1512)', border: 'none' }}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <div className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">
              {phrases.length} key phrases · {scenarioTitle}
            </div>
            <SheetTitle className="font-display text-xl text-white text-left">
              Review before you start
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-2">
            {phrases.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPhrase(p)}
                className="w-full text-left px-4 py-3 rounded-xl border transition-colors"
                style={{
                  background: 'var(--s3)',
                  borderColor: 'var(--leca-border)',
                }}
              >
                <div className="text-sm font-semibold text-white">
                  {p.phrase}
                </div>
                <div className="font-mono text-[10px] text-white/40 mt-0.5 truncate">
                  {p.exampleSentence}
                </div>
              </button>
            ))}
          </div>

          <div
            className="px-6 pb-8 pt-4 border-t"
            style={{ borderColor: 'var(--leca-border)' }}
          >
            <button
              onClick={onStart}
              className="w-full py-4 rounded-2xl text-base font-bold"
              style={{ background: 'var(--amber, #F0622A)', color: '#0C0907' }}
            >
              Start Conversation →
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <PhraseDetailSheet
        phrase={selectedPhrase}
        onClose={() => setSelectedPhrase(null)}
      />
    </>
  );
}
