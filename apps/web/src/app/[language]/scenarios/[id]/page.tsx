import { Suspense } from 'react';
import type { Metadata } from 'next';
import ScenarioDetailPageContent from './page-content';

type Props = {
  params: Promise<{ language: string; id: string }>;
};

export async function generateMetadata(_props: Props): Promise<Metadata> {
  return { title: 'Scenario Detail — LECA' };
}

export default function ScenarioDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
        </div>
      }
    >
      <ScenarioDetailPageContent />
    </Suspense>
  );
}
