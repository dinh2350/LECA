import type { Metadata } from 'next';
import ScenariosPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Scenario Library — LECA',
  description:
    'Browse conversation scenarios for English practice. Job interviews, doctor visits, business meetings and more.',
};

export default function ScenariosPage() {
  return <ScenariosPageContent />;
}
