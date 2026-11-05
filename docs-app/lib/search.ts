export interface SearchEntry {
  title: string;
  section?: string;
  url: string;
  text: string;
}

export interface SearchIndex {
  version: string;
  entries: SearchEntry[];
}

/** Rank matching documentation sections, returning at most one result per page. */
export function searchDocumentation(entries: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const ranked = entries.flatMap((entry) => {
    const title = entry.title.toLowerCase();
    const section = (entry.section ?? '').toLowerCase();
    const body = entry.text.toLowerCase();

    if (!terms.every((term) => title.includes(term) || section.includes(term) || body.includes(term))) {
      return [];
    }

    const score = terms.reduce((total, term) => total +
      (section.includes(term) ? 20 : 0) +
      (title.includes(term) ? 10 : 0) +
      (body.includes(term) ? 1 : 0), 0);

    return [{ entry, score }];
  }).sort((a, b) => b.score - a.score);

  const pages = new Set<string>();
  const results: SearchEntry[] = [];
  for (const { entry } of ranked) {
    const pageUrl = entry.url.split('#')[0];
    if (pages.has(pageUrl)) continue;
    pages.add(pageUrl);
    results.push(entry);
    if (results.length === limit) break;
  }
  return results;
}

export function searchSnippet(text: string, query: string): string {
  if (!text) return '';
  const term = query.trim().toLowerCase().split(/\s+/)[0];
  const match = term ? text.toLowerCase().indexOf(term) : -1;
  const start = Math.max(0, (match < 0 ? 0 : match) - 45);
  const end = Math.min(text.length, start + 155);
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}
