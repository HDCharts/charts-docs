import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Breadcrumbs, MarkdownRenderer, OnThisPage } from '@/components';
import { getPageHeadings } from '@/lib/content';
import { getDevNavigation, getDevPage, getDevSlugs } from '@/lib/dev-docs';
import { getCanonicalUrl } from '@/lib/seo';

export const dynamicParams = false;

interface DevPageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: DevPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getDevPage(slug);

  if (!page) {
    return { title: 'Page Not Found' };
  }

  return {
    title: `${page.title} | HDCharts Dev Docs`,
    description: page.frontmatter.description || `${page.title} - HDCharts developer documentation`,
    alternates: {
      canonical: getCanonicalUrl(`/dev/${slug.join('/')}`),
    },
  };
}

export default async function DevPage({ params }: DevPageProps) {
  const { slug } = await params;
  const page = getDevPage(slug);

  if (!page) {
    notFound();
  }

  const section = getDevNavigation().find((item) => item.path === `/dev/${slug[0]}`);
  const crumbs = slug.length > 1 && section
    ? [{ label: 'Dev', href: '/dev' }, { label: section.title, href: section.path }, { label: page.title }]
    : [{ label: 'Dev', href: '/dev' }, { label: page.title }];

  return (
    <div className="flex min-w-0 gap-8">
      <article className="min-w-0 max-w-[860px] flex-1 animate-fade-in">
        <Breadcrumbs items={crumbs} />
        <MarkdownRenderer content={page.content} />
      </article>
      <OnThisPage headings={getPageHeadings(page.content)} />
    </div>
  );
}

export function generateStaticParams() {
  return getDevSlugs().map((slug) => ({ slug }));
}
