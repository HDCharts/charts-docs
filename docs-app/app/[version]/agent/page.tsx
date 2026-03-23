import { Metadata } from 'next';
import { getAllVersions } from '@/lib/versions';
import { AgentPromptBuilder } from '@/components/AgentPromptBuilder';

interface AgentPromptPageProps {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: AgentPromptPageProps): Promise<Metadata> {
  const { version } = await params;
  return {
    title: `Agent Prompt Builder | Charts ${version}`,
    description: `Generate guided AI prompts for integrating Charts ${version}`,
  };
}

export default async function AgentPromptPage({ params }: AgentPromptPageProps) {
  const { version } = await params;
  return (
    <div className="docs-content">
      <AgentPromptBuilder versionId={version} />
    </div>
  );
}

export function generateStaticParams() {
  return getAllVersions().map((v) => ({ version: v.id }));
}
