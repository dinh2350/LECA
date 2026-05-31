'use client';

import { useState, useEffect } from 'react';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';

interface FlashcardDrillProps {
  phrases: ScenarioPhrase[];
  currentIndex: number;
  onKnew: () => void;
  onDidntKnow: () => void;
}

export default function FlashcardDrill({
  phrases,
  currentIndex,
  onKnew,
  onDidntKnow,
}: FlashcardDrillProps) {
  const [flipped, setFlipped] = useState(false);
  const phrase = phrases[currentIndex];

  useEffect(() => {
    setFlipped(false);
  }, [currentIndex]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress bar */}
      <div className="w-full flex items-center gap-3">
        <div className="flex-1 bg-white/10 rounded-full h-1.5">
          <div
            className="bg-amber-400 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / phrases.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-white/30 font-mono shrink-0">
          {currentIndex + 1}/{phrases.length}
        </span>
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full min-h-[180px] rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/[0.05] transition-colors text-center"
        aria-label={flipped ? 'Tap to see phrase' : 'Tap to flip'}
      >
        {!flipped ? (
          <>
            <span className="font-mono text-xl font-semibold text-amber-300">
              &ldquo;{phrase.phrase}&rdquo;
            </span>
            <span className="text-xs text-white/30">tap to flip</span>
          </>
        ) : (
          <>
            <p className="text-sm text-white/70 italic leading-relaxed">
              &ldquo;{phrase.exampleSentence}&rdquo;
            </p>
            {phrase.translation && (
              <p className="text-sm text-amber-400/60 mt-1">
                {phrase.translation}
              </p>
            )}
          </>
        )}
      </button>

      {/* Actions */}
      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={onDidntKnow}
          className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
        >
          ✗ Didn&apos;t know
        </button>
        <button
          type="button"
          onClick={onKnew}
          className="flex-1 rounded-xl border border-green-500/30 bg-green-500/10 py-3 text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors"
        >
          ✓ Got it
        </button>
      </div>
    </div>
  );
}
