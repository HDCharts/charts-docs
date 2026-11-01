const RELEASE_TAG = /^\d+\.\d+\.\d+$/;
const SOURCE_REVISION = /^(?:main|\d+\.\d+\.\d+|[0-9a-f]{40})$/i;
const SOURCE_PATH = /^sample\/[A-Za-z0-9._/-]+\.kt$/;
const SNIPPET_ID = /^[a-z0-9-]+$/;

export function resolveWikiSourceRevision(versionId, releaseVersions = []) {
  if (versionId === 'snapshot') return 'main';
  return RELEASE_TAG.test(versionId) && releaseVersions.includes(versionId) ? versionId : null;
}

export function buildWikiSourceUrl(source, revision) {
  if (typeof revision !== 'string' || !SOURCE_REVISION.test(revision)) return null;
  if (!source || typeof source.sourcePath !== 'string' || !SOURCE_PATH.test(source.sourcePath)) return null;
  if (source.sourcePath.split('/').some((segment) => segment === '.' || segment === '..')) return null;
  if (source.sourcePath.endsWith('.gradle.kts')) return null;
  if (typeof source.snippetId !== 'string' || !SNIPPET_ID.test(source.snippetId)) return null;

  const encodedPath = source.sourcePath.split('/').map(encodeURIComponent).join('/');
  const markerText = encodeURIComponent(`BEGIN WIKI EXAMPLE: ${source.snippetId}`);
  return `https://github.com/HDCharts/charts/blob/${revision}/${encodedPath}#:~:text=${markerText}`;
}
