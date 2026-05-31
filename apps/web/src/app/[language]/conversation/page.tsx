import type { Metadata } from 'next';
import ConversationPageContent from './page-content';

export const metadata: Metadata = {
  title: 'Conversation — LECA',
};

export default function ConversationPage() {
  return <ConversationPageContent />;
}
