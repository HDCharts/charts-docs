import { Metadata } from 'next';
import { getAllVersions } from '@/lib/versions';
import { getChartPages, getPage, resolveArtifactVersion } from '@/lib/content';
import { extractChartDependency } from '@/lib/agent-prompt.mjs';
import { AgentPromptBuilder } from '@/components/AgentPromptBuilder';
import { getCanonicalUrl } from '@/lib/seo';

interface AgentPromptPageProps {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: AgentPromptPageProps): Promise<Metadata> {
  const { version } = await params;
  return {
    title: `Agent Prompt Builder | HDCharts ${version}`,
    description: `Generate guided AI prompts for integrating HDCharts ${version}`,
    alternates: {
      canonical: getCanonicalUrl(`/${version}/agent`),
    },
  };
}

export default async function AgentPromptPage({ params }: AgentPromptPageProps) {
  const { version } = await params;
  const chartPages = getChartPages(version).map((page) => ({
    ...page,
    // Chart modules come from each version's canonical Setup line, not a
    // maintained chart-to-artifact registry.
    dependency: extractChartDependency(getPage(version, page.slug)?.content ?? ''),
  }));

  return (
    <div className="mx-auto max-w-[900px] px-4">
      <AgentPromptBuilder
        versionId={version}
        artifactVersion={resolveArtifactVersion(version)}
        chartPages={chartPages}
      />
    </div>
  );
}

export function generateStaticParams() {
  return getAllVersions().map((v) => ({ version: v.id }));
}
