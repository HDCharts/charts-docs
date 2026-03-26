import type { Metadata } from 'next';
import { ThanksContent } from './ThanksContent';

export const metadata: Metadata = {
  title: 'Thanks | Charts',
  description:
    'Third-party services, libraries, and tools used across the Charts project.',
};

export default function ThanksPage() {
  return (
    <main className="docs-content docs-content--page">
      <ThanksContent />
    </main>
  );
}
