'use client';

import { useId, useState } from 'react';
import {
  buildChartInstallationSnippet,
  isSnapshotChartDependency,
  SNAPSHOT_REPOSITORY_SNIPPET,
} from '@/lib/chart-installation.mjs';
import { CodeBlockContainer } from './shared-markdown';

interface ChartDependency {
  groupId: string;
  artifactId: string;
  version: string;
}

type Target = 'commonMain' | 'androidOnly' | 'androidMain' | 'iosMain' | 'wasmJsMain';
type Scope = 'module' | 'umbrella';

const TARGETS: { id: Target; label: string }[] = [
  { id: 'commonMain', label: 'Kotlin Multiplatform · shared (commonMain)' },
  { id: 'androidOnly', label: 'Android-only · Jetpack Compose' },
  { id: 'androidMain', label: 'Kotlin Multiplatform · Android (androidMain)' },
  { id: 'iosMain', label: 'Kotlin Multiplatform · iOS (iosMain)' },
  { id: 'wasmJsMain', label: 'Kotlin Multiplatform · Web/Wasm (wasmJsMain)' },
];

function targetNote(target: Target): string {
  switch (target) {
    case 'androidOnly':
      return 'Add this to the Android application module’s build.gradle.kts.';
    case 'iosMain':
      return 'For Compose Multiplatform on iOS, not SwiftUI. Ensure iosMain is defined (typically through the default target hierarchy).';
    case 'wasmJsMain':
      return 'For Compose Multiplatform on Wasm. Ensure the project has a wasmJs target and wasmJsMain source set.';
    case 'androidMain':
      return 'For an Android target within a Kotlin Multiplatform module, not an Android-only module.';
    default:
      return 'Shared by all configured Kotlin Multiplatform targets. Add to the module’s existing Kotlin source-set configuration.';
  }
}

function Snippet({ code }: { code: string }) {
  return (
    <CodeBlockContainer code={code} language="kotlin" className="mb-0">
      <pre className="m-0 whitespace-pre font-mono text-sm text-[var(--text-primary)]">
        <code>{code}</code>
      </pre>
    </CodeBlockContainer>
  );
}

export function ChartDependencyInstaller({
  dependency,
  versionId,
}: {
  dependency: ChartDependency;
  versionId: string;
}) {
  const selectorId = useId();
  const [target, setTarget] = useState<Target>('commonMain');
  const [scope, setScope] = useState<Scope>('module');
  const snippet = buildChartInstallationSnippet(dependency, {
    target,
    umbrella: scope === 'umbrella',
  });
  const snapshot = isSnapshotChartDependency(dependency);
  const scopeButtonClass = (selected: boolean) =>
    'min-h-11 rounded-md border px-3 py-2 text-sm transition-colors ' +
    (selected
      ? 'border-[var(--color-primary)] bg-[var(--surface-tint)] font-semibold text-[var(--text-primary)]'
      : 'border-[var(--border-color)] bg-[var(--surface-overlay)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]');

  return (
    <section
      aria-label="Install this chart"
      className="my-6 min-w-0 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4"
    >
      <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">Add this chart to your project</h3>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Choose the target and dependency scope to generate a Gradle Kotlin DSL snippet.
      </p>

      <div className="mb-4 flex flex-col gap-2">
        <label htmlFor={selectorId} className="text-sm font-semibold text-[var(--text-secondary)]">
          Project configuration
        </label>
        <select
          id={selectorId}
          value={target}
          onChange={(event) => setTarget(event.target.value as Target)}
          className="min-h-11 w-full max-w-full rounded-md border border-[var(--border-color)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring-soft)]"
        >
          {TARGETS.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-[var(--text-secondary)]">Dependency</span>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Dependency scope">
          <button
            type="button"
            className={scopeButtonClass(scope === 'module')}
            aria-pressed={scope === 'module'}
            onClick={() => setScope('module')}
          >
            Only this module
          </button>
          <button
            type="button"
            className={scopeButtonClass(scope === 'umbrella')}
            aria-pressed={scope === 'umbrella'}
            onClick={() => setScope('umbrella')}
          >
            All charts (umbrella)
          </button>
        </div>
      </div>

      <p className="mb-2 text-sm text-[var(--text-secondary)]">{targetNote(target)}</p>
      <Snippet code={snippet} />

      <p className="mt-3 text-xs text-[var(--text-muted)]">
        {scope === 'module'
          ? 'Uses the ' + dependency.artifactId + ' artifact, without pulling in every chart module.'
          : 'The charts umbrella includes the complete HDCharts module collection.'}
      </p>

      {snapshot ? (
        <details className="mt-4 rounded-md border border-[var(--border-color)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--text-primary)]">
            Required for snapshot builds: Maven repository
          </summary>
          <p className="mb-3 mt-3 text-sm text-[var(--text-secondary)]">
            Merge this repository into the existing repositories in settings.gradle.kts. Do not replace your other repositories.
          </p>
          <Snippet code={SNAPSHOT_REPOSITORY_SNIPPET} />
        </details>
      ) : (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Requires Maven Central in your Gradle dependency repositories.
        </p>
      )}

      <p className="mb-0 mt-4 text-sm text-[var(--text-secondary)]">
        For repository configuration and additional setup, see the{' '}
        <a
          href={'/' + encodeURIComponent(versionId) + '/wiki/getting-started'}
          className="text-[var(--link-color)] underline underline-offset-2 hover:text-[var(--link-color-hover)]"
        >
          manual setup guide
        </a>.
      </p>
    </section>
  );
}
