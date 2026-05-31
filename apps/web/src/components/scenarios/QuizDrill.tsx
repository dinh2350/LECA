'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';

interface QuizDrillProps {
  phrases: ScenarioPhrase[];
  currentIndex: number;
  onCorrect: () => void;
  onWrong: () => void;
}

function buildOptions(
  phrases: ScenarioPhrase[],
  currentIndex: number,
): ScenarioPhrase[] {
  const correct = phrases[currentIndex];
  const distractors = [...phrases.filter((_, i) => i !== currentIndex)]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return [...distractors, correct].sort(() => Math.random() - 0.5);
}

export default function QuizDrill({
  phrases,
  currentIndex,
  onCorrect,
  onWrong,
}: QuizDrillProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const correctPhrase = phrases[currentIndex];

  const options = useMemo(
    () => buildOptions(phrases, currentIndex),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentIndex],
  );

  useEffect(() => {
    setSelected(null);
  }, [currentIndex]);

  function handleSelect(phraseId: string) {
    if (selected !== null) return;
    setSelected(phraseId);
    const isCorrect = phraseId === correctPhrase.id;
    setTimeout(() => {
      if (isCorrect) onCorrect();
      else onWrong();
    }, 1000);
  }

  const sentenceDisplay = correctPhrase.exampleSentence.replace(
    new RegExp(
      correctPhrase.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    ),
    '_____',
  );

  return (
    <div className="flex flex-col gap-6">
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

      {/* Question */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-mono text-white/30 mb-3 tracking-widest">
          FILL IN THE BLANK
        </p>
        <p className="text-base text-white/80 italic leading-relaxed">
          &ldquo;{sentenceDisplay}&rdquo;
        </p>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isCorrect = option.id === correctPhrase.id;
          const isSelected = option.id === selected;
          let classes =
            'w-full rounded-xl border px-4 py-3 text-sm text-left transition-colors disabled:cursor-default ';

          if (selected === null) {
            classes +=
              'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06]';
          } else if (isCorrect) {
            classes += 'border-green-500/40 bg-green-500/15 text-green-400';
          } else if (isSelected) {
            classes += 'border-red-500/40 bg-red-500/15 text-red-400';
          } else {
            classes += 'border-white/5 bg-white/[0.01] text-white/30';
          }

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              disabled={selected !== null}
              className={classes}
            >
              {option.phrase}
            </button>
          );
        })}
      </div>
    </div>
  );
}
