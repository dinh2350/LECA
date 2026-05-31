import type { Metadata } from 'next';
import MinimalPairContent from './page-content';

export const metadata: Metadata = { title: 'Minimal Pair Drill — LECA' };

export default function MinimalPairPage() {
  return <MinimalPairContent />;
}
