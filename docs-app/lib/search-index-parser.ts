import { slugifyHeading } from './anchors';
import type { SearchEntry } from './search';

interface SearchablePage {
  title: string;
  content: string;
}

function plainText(markdown: string): string {
  return markdown
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\x60*_#>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Split the resolved page into search entries, including nested capability headings. */
export function indexPage(page: SearchablePage, url: string): SearchEntry[] {
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

    const heading = !fence && !marker ? line.match(/^#{2,3}\s+(.+)$/) : null;
    if (heading) {
      // Match the text used by the Markdown renderer when it assigns heading ids.
      const title = plainText(heading[1].trim().replace(/\s+#+\s*$/, ''));
      current = { title, lines: [] };
      sections.push(current);
    } else {
      (current?.lines ?? intro).push(line);
    }
  }

  return [
    { title: page.title, url, text: plainText(intro.join('\n')) },
    ...sections.filter(({ title }) => slugifyHeading(title)).map(({ title, lines }) => ({
      title: page.title,
      section: title,
      url: url + '#' + slugifyHeading(title),
      text: plainText(lines.join('\n')),
    })),
  ];
}
