'use client';

import { useEffect, useState } from 'react';
import { DocVersion } from '@/lib/types';
import { getVersionApiIndexUrl, getVersionDemoUrl } from '@/lib/version-links';
import { formatPublishedAt } from '@/lib/format';

interface MetadataPanelProps {
  version: DocVersion;
}

interface PublicationMetadata {
  source_sha: string;
  charts_version: string;
  published_at: string;
}

const CHARTS_REPO_URL = 'https://github.com/HDCharts/charts';
const PLAYGROUND_REPO_URL = 'https://github.com/HDCharts/charts-playground';
const MAVEN_BASE_URL = 'https://central.sonatype.com/artifact/io.github.dautovicharis';
const MAVEN_SNAPSHOT_BASE_URL = 'https://central.sonatype.com/repository/maven-snapshots/io/github/dautovicharis';
const MAVEN_SNAPSHOT_CHARTS_METADATA_URL = `${MAVEN_SNAPSHOT_BASE_URL}/charts/maven-metadata.xml`;
const MAVEN_SNAPSHOT_BOM_METADATA_URL = `${MAVEN_SNAPSHOT_BASE_URL}/charts-bom/maven-metadata.xml`;
const ANDROID_RELEASE_APK_URL = '/static/android/release/hdcharts-release.apk';
const ANDROID_SNAPSHOT_APK_URL = '/static/android/snapshot/hdcharts-snapshot.apk';

export function MetadataPanel({ version }: MetadataPanelProps) {
  const [releaseMetadata, setReleaseMetadata] = useState<PublicationMetadata | null>(null);
  const [snapshotMetadata, setSnapshotMetadata] = useState<PublicationMetadata | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/static/_meta/charts-release-publish.json', { cache: 'no-store' }),
      fetch('/static/_meta/charts-snapshot-publish.json', { cache: 'no-store' }),
    ])
      .then(async ([releaseResponse, snapshotResponse]) => {
        const release = releaseResponse.ok ? await releaseResponse.json() as PublicationMetadata : null;
        const snapshot = snapshotResponse.ok ? await snapshotResponse.json() as PublicationMetadata : null;
        setReleaseMetadata(release);
        setSnapshotMetadata(snapshot);
      })
      .catch(() => {
        setReleaseMetadata(null);
        setSnapshotMetadata(null);
      });
  }, []);

  const currentMetadata = version.id === 'snapshot'
    ? snapshotMetadata
    : releaseMetadata?.charts_version === version.id ? releaseMetadata : null;
  const isSnapshot = version.id === 'snapshot';

  return (
    <div className="mx-auto max-w-[1000px] px-4 animate-fade-in">
      <h1>Metadata</h1>
      <p className="mb-8 max-w-[760px] text-[var(--text-secondary)]">
        Build, publication, and artifact information for the selected Charts version, the latest snapshot, and the web playground.
      </p>

      <div className="grid gap-5 lg:grid-cols-2">
        {isSnapshot ? (
          <SnapshotMetadataCard metadata={snapshotMetadata} version={version} />
        ) : (
          <ReleaseMetadataCard metadata={currentMetadata} version={version} playgroundMetadata={snapshotMetadata} />
        )}

      </div>
    </div>
  );
}

function ReleaseMetadataCard({
  metadata,
  version,
  playgroundMetadata,
}: {
  metadata: PublicationMetadata | null;
  version: DocVersion;
  playgroundMetadata: PublicationMetadata | null;
}) {
  return (
    <ChannelMetadataCard
      title={`Charts ${version.label}`}
      metadata={metadata}
      unavailableLabel="Publication metadata unavailable for this version."
      apiUrl={getVersionApiIndexUrl(version)}
      demoUrl={getVersionDemoUrl(version)}
      apkUrl={ANDROID_RELEASE_APK_URL}
      apkLabel="Download Android release APK"
      artifactVersion={metadata?.charts_version ?? version.id}
      isSnapshot={false}
      playgroundMetadata={playgroundMetadata}
    />
  );
}

function SnapshotMetadataCard({ metadata, version }: { metadata: PublicationMetadata | null; version: DocVersion }) {
  return (
    <ChannelMetadataCard
      title="Latest snapshot"
      metadata={metadata}
      unavailableLabel="Snapshot metadata unavailable."
      apiUrl="/static/api/snapshot/index.html"
      demoUrl="/demo/snapshot/"
      apkUrl={ANDROID_SNAPSHOT_APK_URL}
      apkLabel="Download Android snapshot APK"
      artifactVersion={metadata?.charts_version ?? version.id}
      isSnapshot
      playgroundMetadata={metadata}
    />
  );
}

function ChannelMetadataCard({
  title,
  metadata,
  unavailableLabel,
  apiUrl,
  demoUrl,
  apkUrl,
  apkLabel,
  artifactVersion,
  isSnapshot,
  playgroundMetadata,
}: {
  title: string;
  metadata: PublicationMetadata | null;
  unavailableLabel: string;
  apiUrl: string;
  demoUrl: string;
  apkUrl: string;
  apkLabel: string;
  artifactVersion: string;
  isSnapshot: boolean;
  playgroundMetadata: PublicationMetadata | null;
}) {
  return (
    <MetadataCard title={title} className="lg:col-span-2">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Publication</h3>
        <PublicationDetails metadata={metadata} unavailableLabel={unavailableLabel} />
        <MetadataLinks>
          <MetadataLink href={apiUrl}>API</MetadataLink>
          <MetadataLink href={demoUrl}>Demo</MetadataLink>
          {isSnapshot ? (
            <MetadataLink href={MAVEN_SNAPSHOT_CHARTS_METADATA_URL}>Metadata</MetadataLink>
          ) : (
            <MetadataLink href={CHARTS_REPO_URL}>Source</MetadataLink>
          )}
        </MetadataLinks>
        <ApkAction>
          <ApkDownloadLink href={apkUrl} label={apkLabel} />
        </ApkAction>
      </section>
      <AndroidArtifacts
        artifactVersion={artifactVersion}
        isSnapshot={isSnapshot}
        mavenArtifactBaseUrl={isSnapshot ? MAVEN_SNAPSHOT_BASE_URL : MAVEN_BASE_URL}
      />
      <PlaygroundDetails metadata={playgroundMetadata} />
    </MetadataCard>
  );
}

function PlaygroundDetails({ metadata }: { metadata: PublicationMetadata | null }) {
  return (
    <div className="mt-5 border-t border-[var(--border-color)] pt-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Playground</h3>
      <div className="space-y-2 text-sm">
        <MetadataRow label="App">Snapshot playground</MetadataRow>
        <MetadataRow label="Charts build">{metadata?.charts_version ?? 'Unavailable'}</MetadataRow>
        <MetadataRow label="Published">{formatPublishedAt(metadata?.published_at)}</MetadataRow>
        <MetadataLinks>
          <MetadataLink href="/playground/snapshot/">Playground</MetadataLink>
          <MetadataLink href={PLAYGROUND_REPO_URL}>Source</MetadataLink>
        </MetadataLinks>
      </div>
    </div>
  );
}

function MetadataCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 ${className}`}>
      <h2 className="mt-0 mb-4 text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </section>
  );
}

function PublicationDetails({ metadata, unavailableLabel }: { metadata: PublicationMetadata | null; unavailableLabel: string }) {
  if (!metadata) {
    return <p className="text-sm text-[var(--text-muted)]">{unavailableLabel}</p>;
  }

  return (
    <>
      <MetadataRow label="Charts version">{metadata.charts_version}</MetadataRow>
      <MetadataRow label="Published">{formatPublishedAt(metadata.published_at)}</MetadataRow>
      <MetadataRow label="Source">
        <a href={`${CHARTS_REPO_URL}/commit/${metadata.source_sha}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[var(--link-color)] hover:text-[var(--link-color-hover)]">
          {metadata.source_sha.slice(0, 12)}
        </a>
      </MetadataRow>
    </>
  );
}

function MetadataRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[130px_1fr] sm:items-baseline">
      <dt className="text-[var(--text-muted)]">{label}</dt>
      <dd className="break-words text-[var(--text-primary)]">{children}</dd>
    </div>
  );
}

function MetadataLinks({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--border-color)] pt-3">{children}</div>;
}

function AndroidArtifacts({
  artifactVersion,
  isSnapshot,
  mavenArtifactBaseUrl,
}: {
  artifactVersion: string;
  isSnapshot: boolean;
  mavenArtifactBaseUrl: string;
}) {
  return (
    <div className="mt-5 border-t border-[var(--border-color)] pt-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">Android and multiplatform artifacts</h3>
      <div className="space-y-2 text-sm">
        <MetadataRow label="Platforms">Android, iOS, Desktop, Web</MetadataRow>
        <MetadataRow label="Group">io.github.dautovicharis</MetadataRow>
        <MetadataRow label="Main artifact">
          <code>io.github.dautovicharis:charts:{artifactVersion}</code>
        </MetadataRow>
        <MetadataRow label="BOM artifact">
          <code>io.github.dautovicharis:charts-bom:{artifactVersion}</code>
        </MetadataRow>
        <MetadataLinks>
          <MetadataLink href={isSnapshot ? MAVEN_SNAPSHOT_CHARTS_METADATA_URL : `${mavenArtifactBaseUrl}/charts/overview`}>
            Metadata
          </MetadataLink>
          <MetadataLink href={isSnapshot ? MAVEN_SNAPSHOT_BOM_METADATA_URL : `${mavenArtifactBaseUrl}/charts-bom/overview`}>
            BOM metadata
          </MetadataLink>
        </MetadataLinks>
      </div>
    </div>
  );
}

function MetadataLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="text-[var(--link-color)] underline decoration-[0.08em] underline-offset-[0.12em] hover:text-[var(--link-color-hover)]">{children}</a>;
}

function ApkDownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 rounded-md border border-[var(--color-warning)] bg-[color-mix(in_oklch,var(--color-warning)_18%,var(--bg-secondary))] px-3 py-2 font-semibold text-[var(--text-primary)] no-underline transition-colors hover:bg-[color-mix(in_oklch,var(--color-warning)_28%,var(--bg-secondary))]"
    >
      <svg className="h-4 w-4 shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2v8m0 0 3-3m-3 3L5 7M3 13.5h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </a>
  );
}

function ApkAction({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 border-t border-[var(--border-color)] pt-4">{children}</div>;
}
