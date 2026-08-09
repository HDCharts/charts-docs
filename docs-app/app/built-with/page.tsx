import type { Metadata } from 'next';
import { ThanksContent } from '../thanks/ThanksContent';

export const metadata: Metadata = {
  title: 'Built with | HDCharts',
  description:
    'Third-party services, libraries, and tools used across the Charts project.',
  alternates: {
    canonical: '/built-with',
  },
};

export default function BuiltWithPage() {
  return (
    <div className="built-with-page max-w-[900px] mx-auto px-4 pt-12 sm:pt-16">
      <ThanksContent />
    </div>
  );
}
