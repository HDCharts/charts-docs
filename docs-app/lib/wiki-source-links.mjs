const FULL_COMMIT_SHA = /^[0-9a-f]{40}$/i;
const RELEASE_TAG = /^\d+\.\d+\.\d+$/;
const SNAPSHOT_VERSION = /^\d+\.\d+\.\d+-SNAPSHOT$/;
const SOURCE_PATH = /^sample\/[A-Za-z0-9._/-]+\.kt$/;
const SNIPPET_ID = /^[a-z0-9-]+$/;

export function resolveWikiSourceRevision(versionId, snapshotManifest, releaseManifest, releaseVersions = []) {
  if (versionId === 'snapshot') {
    return SNAPSHOT_VERSION.test(snapshotManifest?.charts_version ?? '')
      && snapshotManifest?.wiki_charts_version === snapshotManifest.charts_version
      && FULL_COMMIT_SHA.test(snapshotManifest?.wiki_source_sha ?? '')
      ? snapshotManifest.wiki_source_sha.toLowerCase()
      : null;
  }

  if (!RELEASE_TAG.test(versionId) || !releaseVersions.includes(versionId)) return null;

  if (releaseManifest?.charts_version === versionId && FULL_COMMIT_SHA.test(releaseManifest?.source_sha ?? '')) {
    return releaseManifest.source_sha.toLowerCase();
  }

  // Release automation creates and pushes a tag whose name is the release version.
  return versionId;
}

export function buildWikiSourceUrl(source, revision) {
  if (typeof revision !== 'string' || (!FULL_COMMIT_SHA.test(revision) && !RELEASE_TAG.test(revision))) return null;
  if (!source || typeof source.sourcePath !== 'string' || !SOURCE_PATH.test(source.sourcePath)) return null;
  if (source.sourcePath.split('/').some((segment) => segment === '.' || segment === '..')) return null;
  if (source.sourcePath.endsWith('.gradle.kts')) return null;
  if (typeof source.snippetId !== 'string' || !SNIPPET_ID.test(source.snippetId)) return null;

  const encodedPath = source.sourcePath.split('/').map(encodeURIComponent).join('/');
  const markerText = encodeURIComponent(`BEGIN WIKI EXAMPLE: ${source.snippetId}`);
  return `https://github.com/HDCharts/charts/blob/${revision}/${encodedPath}#:~:text=${markerText}`;
}
