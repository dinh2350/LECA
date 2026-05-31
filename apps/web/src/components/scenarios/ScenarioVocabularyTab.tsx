'use client';

import { useState } from 'react';
import type { ScenarioPhrase } from '@/services/api/services/scenarios';
import PhraseCard from './PhraseCard';

interface ScenarioVocabularyTabProps {
  phrases: ScenarioPhrase[];
}

export default function ScenarioVocabularyTab({
  phrases,
}: ScenarioVocabularyTabProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (phrases.length === 0) {
    return (
      <p className="text-sm text-white/30 text-center py-8">
        No key phrases yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-white/30 font-mono mb-2 tracking-widest">
        {phrases.length} PHRASES
      </p>
      {phrases.map((phrase) => (
        <PhraseCard
          key={phrase.id}
          phrase={phrase}
          isOpen={openId === phrase.id}
          onToggle={() => setOpenId(openId === phrase.id ? null : phrase.id)}
        />
      ))}
    </div>
  );
}
