'use client';

import { useRef } from 'react';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';

const DIFFICULTY_COLOUR: Record<string, string> = {
  A1: 'bg-green-500/20 text-green-400 border-green-500/30',
  A2: 'bg-green-500/20 text-green-400 border-green-500/30',
  B1: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  B2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  C1: 'bg-red-500/20 text-red-400 border-red-500/30',
  C2: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface PhraseCardProps {
  phrase: ScenarioPhrase;
  isOpen: boolean;
  onToggle: () => void;
}

export default function PhraseCard({
  phrase,
  isOpen,
  onToggle,
}: PhraseCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const diffClass = phrase.difficulty
    ? (DIFFICULTY_COLOUR[phrase.difficulty] ?? 'bg-white/10 text-white/60')
    : '';

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-colors"
      >
        <span className="font-mono text-sm font-medium text-amber-300">
          &ldquo;{phrase.phrase}&rdquo;
        </span>
        <span className="text-white/30 text-xs ml-2 shrink-0">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 flex flex-col gap-2 border-t border-white/5">
          {phrase.translation && (
            <p className="text-sm text-amber-400/70 mt-2">
              {phrase.translation}
            </p>
          )}
          <p className="text-sm text-white/50 italic leading-relaxed">
            &ldquo;{phrase.exampleSentence}&rdquo;
          </p>
          <div className="flex items-center gap-2 mt-1">
            {phrase.audioUrl && (
              <>
                <audio ref={audioRef} src={phrase.audioUrl} />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    audioRef.current?.play();
                  }}
                  className="text-white/40 hover:text-white/70 transition-colors text-sm"
                  aria-label="Play pronunciation"
                >
                  🔊
                </button>
              </>
            )}
            {phrase.difficulty && (
              <span
                className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${diffClass}`}
              >
                {phrase.difficulty}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
