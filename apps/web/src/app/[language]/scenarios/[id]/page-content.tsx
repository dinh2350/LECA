'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import useLanguage from '@/services/i18n/use-language';
import {
  useGetScenarioService,
  type ScenarioDetail,
} from '@/services/api/services/scenarios';
import { Button } from '@/components/ui/button';
import HTTP_CODES_ENUM from '@/services/api/types/http-codes';
import ScenarioOverviewTab from '@/components/scenarios/ScenarioOverviewTab';
import ScenarioVocabularyTab from '@/components/scenarios/ScenarioVocabularyTab';
import ScenarioDrillTab from '@/components/scenarios/ScenarioDrillTab';

type Tab = 'overview' | 'vocabulary' | 'drill';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'vocabulary', label: 'Vocabulary' },
  { id: 'drill', label: 'Drill' },
];

export default function ScenarioDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useLanguage();
  const getScenario = useGetScenarioService();

  const id = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');
  const tabParam = searchParams.get('tab');
  const activeTab: Tab =
    tabParam === 'vocabulary' || tabParam === 'drill' ? tabParam : 'overview';

  const [scenario, setScenario] = useState<ScenarioDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [drillComplete, setDrillComplete] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getScenario(id).then(({ status, data }) => {
      if (cancelled) return;
      if (status === HTTP_CODES_ENUM.OK && data) {
        setScenario(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps -- getScenario identity changes with language but route changes on language switch, so no double-fetch

  function setTab(tab: Tab) {
    const next = new URLSearchParams(searchParams.toString());
    if (tab === 'overview') {
      next.delete('tab');
    } else {
      next.set('tab', tab);
    }
    const qs = next.toString();
    router.push(qs ? `?${qs}` : `/${language}/scenarios/${id}`, {
      scroll: false,
    });
  }

  function startConversation() {
    if (!scenario) return;
    router.push(
      `/${language}/conversation?scenarioId=${id}&title=${encodeURIComponent(scenario.title)}`,
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (notFound || !scenario) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-white/50">
        <p className="text-4xl">📭</p>
        <p className="text-lg">Scenario not found.</p>
        <Button
          variant="outline"
          onClick={() => router.push(`/${language}/scenarios`)}
        >
          Back to library
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="px-4 pt-16 pb-4 max-w-2xl mx-auto">
        <button
          onClick={() => router.push(`/${language}/scenarios`)}
          className="mb-6 flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Scenario library
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {scenario.title}
        </h1>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/95 backdrop-blur border-b border-white/5">
        <div className="flex max-w-2xl mx-auto px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-6 max-w-2xl mx-auto">
        {activeTab === 'overview' && (
          <ScenarioOverviewTab scenario={scenario} />
        )}
        {activeTab === 'vocabulary' && (
          <ScenarioVocabularyTab phrases={scenario.phrases} />
        )}
        {activeTab === 'drill' && (
          <ScenarioDrillTab
            phrases={scenario.phrases}
            onComplete={() => setDrillComplete(true)}
          />
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-4 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent">
        <div className="max-w-2xl mx-auto">
          <Button
            size="lg"
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold"
            onClick={startConversation}
          >
            {drillComplete
              ? '✓ Ready to practice! Start Conversation'
              : '▶ Start Conversation'}
          </Button>
        </div>
      </div>
    </div>
  );
}
