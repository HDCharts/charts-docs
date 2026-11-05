import { slugifyHeading } from './anchors';
import { getMigrationReleasePage, getMigrationReleases, getPage, getPageSlugs } from './content';
import type { DocPage } from './types';
import type { SearchEntry } from './search';

function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\x60*_#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function indexPage(page: DocPage, url: string): SearchEntry[] {
  const intro: string[] = [];
  const sections: { title: string; lines: string[] }[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let fence: string | null = null;

  for (const line of page.content.split(/\r?\n/)) {
    const marker = line.match(/^ {0,3}(\x60{3,}|~{3,})/)?.[1];
    if (marker) {
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) fence = null;
    }

    const heading = !fence && !marker ? line.match(/^##\s+(.+)$/) : null;
    if (heading) {
      current = { title: heading[1].trim().replace(/\s+#+\s*$/, ''), lines: [] };
      sections.push(current);
    } else {
      (current?.lines ?? intro).push(line);
    }
  }

  return [
    { title: page.title, url, text: plainText(intro.join('\n')) },
    ...sections.map(({ title, lines }) => ({
      title: page.title,
      section: title,
      url: url + '#' + slugifyHeading(title),
      text: plainText(lines.join('\n')),
    })),
  ];
}

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
