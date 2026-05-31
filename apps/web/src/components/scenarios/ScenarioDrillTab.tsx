'use client';

import { useState, useMemo } from 'react';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';
import FlashcardDrill from './FlashcardDrill';
import QuizDrill from './QuizDrill';

interface ScenarioDrillTabProps {
  phrases: ScenarioPhrase[];
  onComplete: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function ScenarioDrillTab({
  phrases,
  onComplete,
}: ScenarioDrillTabProps) {
  const [mode, setMode] = useState<'flashcard' | 'quiz'>('flashcard');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shuffledPhrases = useMemo(() => shuffle(phrases), []);
  const canQuiz = phrases.length >= 4;
  const modes: Array<'flashcard' | 'quiz'> = canQuiz
    ? ['flashcard', 'quiz']
    : ['flashcard'];

  function advance(knew: boolean) {
    if (knew) setScore((s) => s + 1);
    if (currentIndex + 1 >= shuffledPhrases.length) {
      setIsComplete(true);
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  function switchMode(next: 'flashcard' | 'quiz') {
    setMode(next);
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
  }

  function restart() {
    setCurrentIndex(0);
    setScore(0);
    setIsComplete(false);
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center gap-6 py-8 text-center">
        <p className="text-4xl">🎉</p>
        <h3 className="text-xl font-semibold text-white">Drill complete!</h3>
        <p className="text-white/50">
          You knew {score} of {shuffledPhrases.length} phrase
          {shuffledPhrases.length !== 1 ? 's' : ''}.
        </p>
        <button
          type="button"
          onClick={restart}
          className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-white/60 hover:text-white/80 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 self-start rounded-lg bg-white/[0.04] p-1 border border-white/10">
        {modes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              mode === m
                ? 'bg-amber-500 text-black'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {mode === 'flashcard' ? (
        <FlashcardDrill
          phrases={shuffledPhrases}
          currentIndex={currentIndex}
          onKnew={() => advance(true)}
          onDidntKnow={() => advance(false)}
        />
      ) : (
        <QuizDrill
          phrases={shuffledPhrases}
          currentIndex={currentIndex}
          onCorrect={() => advance(true)}
          onWrong={() => advance(false)}
        />
      )}
    </div>
  );
}
