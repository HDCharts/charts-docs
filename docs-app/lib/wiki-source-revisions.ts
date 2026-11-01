import snapshotManifest from '../public/snapshot-manifest.json';
import releaseManifest from '../public/release-manifest.json';
import { getAllVersions } from './versions';
import { resolveWikiSourceRevision } from './wiki-source-links.mjs';

export function getWikiSourceRevision(versionId: string): string | null {
  const releaseVersions = getAllVersions()
    .map((version) => version.id)
    .filter((version) => version !== 'snapshot');

  return resolveWikiSourceRevision(versionId, snapshotManifest, releaseManifest, releaseVersions);
}
