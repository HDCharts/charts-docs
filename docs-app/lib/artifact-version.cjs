const SNAPSHOT_VERSION = /^\d+\.\d+\.\d+-SNAPSHOT$/;
const SOURCE_SHA = /^[0-9a-f]{40}$/i;

/**
 * A release route is immutable and uses its own SemVer ID. Snapshot routes use
 * the version and source SHA recorded by the snapshot publication workflow.
 */
function resolveArtifactVersion(versionId, snapshotManifestText) {
  if (versionId !== 'snapshot') {
    return /^\d+\.\d+\.\d+$/.test(versionId) ? versionId : null;
  }

  try {
    const manifest = JSON.parse(snapshotManifestText);
    if (
      typeof manifest.charts_version === 'string' &&
      SNAPSHOT_VERSION.test(manifest.charts_version) &&
      typeof manifest.source_sha === 'string' &&
      SOURCE_SHA.test(manifest.source_sha) &&
      typeof manifest.docs_source_sha === 'string' &&
      SOURCE_SHA.test(manifest.docs_source_sha) &&
      manifest.docs_source_sha === manifest.source_sha
    ) {
      return manifest.charts_version;
    }
  } catch {
    // Preserve the template when publication metadata is missing or invalid.
  }

  return null;
}

/** Resolve only Kotlin fenced blocks, leaving other Markdown and code untouched. */
function resolveKotlinArtifactVersion(markdown, artifactVersion) {
  if (!artifactVersion) return markdown;

  const lines = markdown.split(/(?<=\n)/);
  let fence = null;
  let inKotlin = false;

  return lines.map((line) => {
    const value = line.replace(/\r?\n$/, '');
    if (!fence) {
      const opening = /^(\s*)(`{3,}|~{3,})(.*)$/.exec(value);
      if (opening) {
        fence = { marker: opening[2][0], length: opening[2].length };
        inKotlin = /^\s*kotlin(?:\s|$)/i.test(opening[3]);
      }
      return line;
    }

    const closing = new RegExp(`^\\s*${fence.marker}{${fence.length},}\\s*$`);
    if (closing.test(value)) {
      fence = null;
      inKotlin = false;
      return line;
    }
    return inKotlin ? line.replaceAll('{{artifactVersion}}', artifactVersion) : line;
  }).join('');
}

exports.resolveArtifactVersion = resolveArtifactVersion;
exports.resolveKotlinArtifactVersion = resolveKotlinArtifactVersion;
