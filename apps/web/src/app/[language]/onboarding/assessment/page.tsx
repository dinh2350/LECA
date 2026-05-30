import type { Metadata } from 'next';
import AssessmentPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Level Assessment',
};

export default function AssessmentPage() {
  return <AssessmentPageContent />;
}
