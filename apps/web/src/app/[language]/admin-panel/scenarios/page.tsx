import type { Metadata } from 'next';
import ScenarioReviewPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Scenario Review — Admin',
  description: 'Review and approve user-submitted scenarios.',
};

export default function ScenarioReviewPage() {
  return <ScenarioReviewPageContent />;
}
