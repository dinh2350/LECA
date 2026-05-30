import type { Metadata } from 'next';
import ScenarioDetailPageContent from './page-content';

type Props = {
  params: Promise<{ language: string; id: string }>;
};

export async function generateMetadata(_props: Props): Promise<Metadata> {
  return { title: 'Scenario Detail — LECA' };
}

export default function ScenarioDetailPage() {
  return <ScenarioDetailPageContent />;
}
