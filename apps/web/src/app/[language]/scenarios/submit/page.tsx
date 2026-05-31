import type { Metadata } from 'next';
import ScenarioSubmitPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Submit a Scenario — LECA',
  description: 'Contribute a new conversation scenario to the LECA library.',
};

export default function ScenarioSubmitPage() {
  return <ScenarioSubmitPageContent />;
}
