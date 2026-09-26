import { notFound, redirect } from 'next/navigation';
import { getDevNavigation } from '@/lib/dev-docs';

export default function DevIndexPage() {
  const firstSection = getDevNavigation()[0];
  if (!firstSection) {
    notFound();
  }
  redirect(firstSection.path);
}
