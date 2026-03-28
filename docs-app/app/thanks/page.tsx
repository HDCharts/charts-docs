import type { Metadata } from 'next';
import { ThanksContent } from './ThanksContent';

export const metadata: Metadata = {
  title: 'Thanks | Charts',
  description:
    'Third-party services, libraries, and tools used across the Charts project.',
};

export default function ThanksPage() {
  return (
    <div className="max-w-[900px] mx-auto px-4">
      <ThanksContent />
    </div>
  );
}
