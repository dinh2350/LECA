import type { Metadata } from 'next';
import SessionSummaryContent from './page-content';

export const metadata: Metadata = { title: 'Session Summary — LECA' };

export default function SessionSummaryPage() {
  return <SessionSummaryContent />;
}
