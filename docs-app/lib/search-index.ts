import { getMigrationReleasePage, getMigrationReleases, getPage, getPageSlugs } from './content';
import { indexPage } from './search-index-parser';
import type { SearchEntry } from './search';

/** Uses the same page loaders and resolved content as the rendered wiki. */
export function buildSearchIndex(versionId: string): SearchEntry[] {
  const entries = getPageSlugs(versionId).flatMap((slug) => {
    const page = getPage(versionId, slug);
    if (!page) return [];
    const url = '/' + versionId + '/wiki' + (slug ? '/' + slug : '');
    return indexPage(page, url);
  });

  for (const release of getMigrationReleases(versionId)) {
    const page = getMigrationReleasePage(versionId, release.label);
    if (page) {
      entries.push(...indexPage(page, '/' + versionId + '/wiki/migration/' + release.label));
    }
  }
  return entries;
}
