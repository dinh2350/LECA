'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';

interface PhraseDetailSheetProps {
  phrase: ScenarioPhrase | null;
  onClose: () => void;
}

export default function PhraseDetailSheet({
  phrase,
  onClose,
}: PhraseDetailSheetProps) {
  if (!phrase) return null;

  return (
    <Sheet
      open={!!phrase}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-6 pb-8"
        style={{ background: 'var(--s2, #1a1512)', border: 'none' }}
      >
        <SheetHeader className="mb-4">
          <SheetTitle className="font-display text-lg text-white text-left">
            {phrase.phrase}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div
            className="px-4 py-3 rounded-xl border"
            style={{
              background: 'var(--s3, #221e18)',
              borderColor: 'var(--leca-border)',
            }}
          >
            <p className="font-mono text-[10px] text-white/40 uppercase tracking-widest mb-1">
              Example
            </p>
            <p className="text-sm text-white/80 leading-relaxed italic">
              &quot;{phrase.exampleSentence}&quot;
            </p>
          </div>

          {phrase.audioUrl && (
            <button
              onClick={() => new Audio(phrase.audioUrl!).play()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm"
              style={{
                borderColor: 'rgba(240,98,42,0.3)',
                color: 'var(--amber)',
              }}
            >
              🔊 Hear pronunciation
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{ background: 'var(--amber, #F0622A)', color: '#0C0907' }}
          >
            Got it — back to phrases
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
