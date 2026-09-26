import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { DocPage, DocVersion, NavItem, PageFrontmatter } from './types';
import { createHeadingSlugger, slugifyHeading } from './anchors';
import { getAllVersions, getVersion } from './versions';

/**
 * Base path to wiki content
 */
const CONTENT_BASE = path.join(process.cwd(), '..', 'content');
const RELEASE_NOTES_BASE = path.join(process.cwd(), '..', 'release-notes');
const CURRENT_RELEASE_NOTES_VERSION_PATH = path.join(RELEASE_NOTES_BASE, 'current-version.txt');
const CHANGESETS_DIR_NAME = 'changes';
const MIGRATIONS_DIR_NAME = 'migrations';

function pathExists(filePath: string): boolean {
  return fs.existsSync(/* turbopackIgnore: true */ filePath);
}

function readDirectory(directoryPath: string): string[] {
  return fs.readdirSync(/* turbopackIgnore: true */ directoryPath);
}

function readTextFile(filePath: string): string {
  return fs.readFileSync(/* turbopackIgnore: true */ filePath, 'utf-8');
}

/**
 * Get the wiki content directory for a version
 */
function getWikiPath(versionId: string): string {
  return path.join(CONTENT_BASE, versionId, 'wiki');
}

function getVersionedReleaseNotesPath(versionId: string): string | null {
  const releaseNotesVersion = getReleaseNotesVersion(versionId);
  if (!releaseNotesVersion) {
    return null;
  }

  const releaseNotesPath = path.join(RELEASE_NOTES_BASE, releaseNotesVersion);
  return pathExists(releaseNotesPath) ? releaseNotesPath : null;
}

function getReleaseNotesVersion(versionId: string): string | null {
  if (versionId !== 'snapshot') {
    return versionId;
  }

  try {
    const releaseNotesVersion = readTextFile(CURRENT_RELEASE_NOTES_VERSION_PATH).trim();
    if (
      !/^\d+\.\d+\.\d+$/.test(releaseNotesVersion) ||
      getVersion(releaseNotesVersion)
    ) {
      return null;
    }
    return releaseNotesVersion;
  } catch {
    return null;
  }
}

function getChangesetsPath(versionId: string): string | null {
  const versionedReleaseNotesPath = getVersionedReleaseNotesPath(versionId);
  return versionedReleaseNotesPath
    ? path.join(versionedReleaseNotesPath, CHANGESETS_DIR_NAME)
    : null;
}

interface VersionChangeset {
  fileName: string;
  type: string;
  module: string;
  pr: string;
  releaseNote: string;
}

function normalizeChangesetValue(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  let normalized = trimmed;
  if (normalized.startsWith('`') && normalized.endsWith('`') && normalized.length >= 2) {
    normalized = normalized.slice(1, -1);
  }
  if (normalized.startsWith('<') && normalized.endsWith('>') && normalized.length >= 2) {
    normalized = '';
  }
  return normalized.trim();
}

function parseChangesetFile(filePath: string): VersionChangeset | null {
  try {
    const content = readTextFile(filePath);
    const record: Record<string, string> = {};

    for (const line of content.split('\n')) {
      const match = line.match(/^-+\s*([a-zA-Z_]+):\s*(.*)$/);
      if (!match) {
        continue;
      }
      record[match[1]] = normalizeChangesetValue(match[2]);
    }

    const fileName = path.basename(filePath);
    const releaseNote = record.release_note || '';
    if (!releaseNote) {
      return null;
    }

    return {
      fileName,
      type: (record.type || 'other').toLowerCase(),
      module: record.module || 'unknown',
      pr: record.pr || '',
      releaseNote,
    };
  } catch {
    return null;
  }
}

function getVersionChangesets(versionId: string): VersionChangeset[] {
  const changesetsPath = getChangesetsPath(versionId);
  if (!changesetsPath || !pathExists(changesetsPath)) {
    return [];
  }

  return readDirectory(changesetsPath)
    .filter((file) => /\.mdx?$/.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => parseChangesetFile(path.join(changesetsPath, file)))
    .filter((item): item is VersionChangeset => item !== null);
}

function typeHeading(type: string): string {
  switch (type) {
    case 'feature':
      return 'Features';
    case 'fix':
      return 'Fixes';
    case 'refactor':
      return 'Refactors';
    case 'docs':
      return 'Documentation';
    case 'chore':
      return 'Chores';
    default:
      return 'Other';
  }
}

function renderChangesetsMarkdown(changesets: VersionChangeset[]): string {
  if (changesets.length === 0) {
    return '';
  }

  const typeOrder = ['feature', 'fix', 'refactor', 'docs', 'chore', 'other'];
  const grouped = new Map<string, VersionChangeset[]>();

  for (const changeset of changesets) {
    const key = typeOrder.includes(changeset.type) ? changeset.type : 'other';
    const entries = grouped.get(key) ?? [];
    entries.push(changeset);
    grouped.set(key, entries);
  }

  const lines: string[] = [];

  for (const type of typeOrder) {
    const entries = grouped.get(type);
    if (!entries || entries.length === 0) {
      continue;
    }

    lines.push(`#### ${typeHeading(type)}`);
    lines.push('');

    for (const entry of entries) {
      const details: string[] = [];
      if (entry.module && entry.module !== 'unknown') {
        details.push(entry.module);
      }
      const detailSuffix = details.length > 0 ? ` (${details.join(' · ')})` : '';
      lines.push(`- ${entry.releaseNote}${detailSuffix}`);
    }

    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function getVersionBreakingChangesMarkdown(versionId: string): string {
  const versionedReleaseNotesPath = getVersionedReleaseNotesPath(versionId);
  if (!versionedReleaseNotesPath) {
    return '';
  }

  const migrationsPath = path.join(versionedReleaseNotesPath, MIGRATIONS_DIR_NAME);
  if (!pathExists(migrationsPath)) {
    return '';
  }

  return readDirectory(migrationsPath)
    .filter((file) => /\.mdx?$/.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => readTextFile(path.join(migrationsPath, file)).trim())
    .filter(Boolean)
    .join('\n\n');
}

export interface MigrationRelease {
  label: string;
  previousLabel?: string;
  markdown: string;
}

function getStableVersions(): DocVersion[] {
  return getAllVersions().filter((version) =>
    version.id !== 'snapshot' && /^\d+\.\d+\.\d+$/.test(version.id),
  );
}

/**
 * Get migration-bearing releases up to the selected documentation version.
 * The registry is ordered newest first, so the next stable entry is the
 * previous release used in the generated guidance text.
 */
export function getMigrationReleases(versionId: string): MigrationRelease[] {
  const stableVersions = getStableVersions();
  const currentSnapshotVersion = getReleaseNotesVersion(versionId);
  let targetVersions = stableVersions;

  if (versionId !== 'snapshot') {
    const targetIndex = stableVersions.findIndex((version) => version.id === versionId);
    if (targetIndex < 0) {
      return [];
    }
    targetVersions = stableVersions.slice(targetIndex);
  } else if (currentSnapshotVersion) {
    targetVersions = [
      {
        id: currentSnapshotVersion,
        label: currentSnapshotVersion,
        wikiRoot: '',
        apiBase: '',
      },
      ...stableVersions,
    ];
  }

  return targetVersions.flatMap((version, index) => {
    const markdown = getVersionBreakingChangesMarkdown(version.id);
    const guideCount = countMigrationGuides(markdown);
    if (guideCount === 0) {
      return [];
    }

    return [{
      label: version.label,
      previousLabel: targetVersions[index + 1]?.label,
      markdown,
    }];
  });
}

function demoteAllHeadings(markdown: string): string {
  return markdown.replace(/^(#{1,5})\s+/gm, (_, hashes: string) => `${hashes}# `);
}

/**
 * Standalone page for one release's migration notes, so each release gets
 * its own URL instead of every release being concatenated onto one page.
 */
export function getMigrationReleasePage(versionId: string, releaseLabel: string): DocPage | null {
  const release = getMigrationReleases(versionId).find((item) => item.label === releaseLabel);
  if (!release) {
    return null;
  }

  const upgradeNote = release.previousLabel
    ? `> **Upgrade note:** If upgrading from ${release.previousLabel} or earlier, read these migration notes.`
    : '> **Upgrade note:** If upgrading from an earlier release, read these migration notes.';

  const content = [
    `# ${release.label} Migration`,
    '',
    upgradeNote,
    '',
    demoteAllHeadings(release.markdown),
    '',
  ].join('\n').trimEnd() + '\n';

  return {
    slug: `migration/${release.label}`,
    title: `${release.label} Migration`,
    content,
    frontmatter: {},
  };
}

function getDefaultMigrationPageMarkdown(): string {
  return `# Migration Guide

Migration notes are grouped by release. If you are upgrading, read every section newer than your current version.`;
}

function countMigrationGuides(markdown: string): number {
  if (!markdown.trim()) {
    return 0;
  }

  return markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^##\s+/.test(line))
    .map((line) => line.replace(/^##\s+/, '').trim().toLowerCase())
    .filter((title) => title !== 'overview' && title !== 'breaking changes / migration')
    .length;
}

function injectIntoSection(
  content: string,
  generatedMarkdown: string,
  sectionPattern: RegExp,
  appendIfMissing: boolean,
): string {
  if (!generatedMarkdown.trim()) {
    return content;
  }

  const lines = content.split('\n');
  const sectionIndex = lines.findIndex((line) => sectionPattern.test(line.trim()));

  if (sectionIndex < 0) {
    if (!appendIfMissing) {
      return content;
    }
    return `${content.trimEnd()}\n\n${generatedMarkdown}\n`;
  }

  let insertAt = sectionIndex + 1;
  while (insertAt < lines.length && lines[insertAt].trim() === '') {
    insertAt += 1;
  }

  const before = lines.slice(0, insertAt);
  const after = lines.slice(insertAt);

  return [...before, '', generatedMarkdown, '', ...after].join('\n').trimEnd() + '\n';
}

function injectIntoWhatsNewSection(content: string, generatedMarkdown: string): string {
  return injectIntoSection(content, generatedMarkdown, /^##\s+What's New in\b/i, true);
}

function removeSection(content: string, sectionPattern: RegExp): string {
  const lines = content.split('\n');
  const sectionIndex = lines.findIndex((line) => sectionPattern.test(line.trim()));
  if (sectionIndex < 0) {
    return content;
  }

  let removeEnd = sectionIndex + 1;
  while (removeEnd < lines.length) {
    const trimmed = lines[removeEnd].trim();
    if (/^##\s+/.test(trimmed)) {
      break;
    }
    removeEnd += 1;
  }

  const updated = [...lines.slice(0, sectionIndex), ...lines.slice(removeEnd)].join('\n');
  return `${updated.trimEnd()}\n`;
}

/**
 * Convert a filename to a human-readable title
 */
export function filenameToTitle(filename: string): string {
  // Remove .md extension
  const name = filename.replace(/\.mdx?$/, '');
  
  // Handle index files
  if (name === 'index') {
    return 'Overview';
  }
  
  // Convert kebab-case to Title Case
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get all markdown files in a directory
 */
function getMarkdownFiles(dir: string): string[] {
  if (!pathExists(dir)) {
    return [];
  }
  
  const orderRank: Record<string, number> = {
    index: 0,
    'getting-started': 1,
  };

  // Chart-type pages (any `*-chart` slug) are grouped together, ahead of
  // other guides like Customization — same convention getChartPages() uses,
  // so this stays correct as pages are added without needing a name list.
  function rankFor(slug: string): number {
    if (slug in orderRank) {
      return orderRank[slug];
    }
    return slug.endsWith('-chart') ? 2 : 3;
  }

  return readDirectory(dir)
    .filter(file => /\.mdx?$/.test(file))
    .sort((a, b) => {
      const aSlug = a.replace(/\.mdx?$/, '');
      const bSlug = b.replace(/\.mdx?$/, '');

      // Keep migration page last in the docs menu when present.
      if (aSlug === 'migration' && bSlug !== 'migration') {
        return 1;
      }
      if (bSlug === 'migration' && aSlug !== 'migration') {
        return -1;
      }

      const aRank = rankFor(aSlug);
      const bRank = rankFor(bSlug);

      if (aRank !== bRank) {
        return aRank - bRank;
      }

      return a.localeCompare(b);
    });
}

/**
 * Build navigation items from the wiki directory structure
 */
export function getNavigation(versionId: string): NavItem[] {
  const wikiPath = getWikiPath(versionId);
  const files = getMarkdownFiles(wikiPath);
  const migrationReleases = getMigrationReleases(versionId);
  const hasMigrationFile = files.some((file) => /^migration\.mdx?$/.test(file));
  const navigationFiles = hasMigrationFile ? files : [...files, 'migration.md'];

  const navigation = navigationFiles.map((file) => {
    const slug = file.replace(/\.mdx?$/, '');
    const filePath = path.join(wikiPath, file);
    const pagePath = slug === 'index' ? `/${versionId}/wiki` : `/${versionId}/wiki/${slug}`;

    // Read frontmatter to get custom title if available
    let title = filenameToTitle(file);
    let markdownContent = '';
    try {
      const fileContent = readTextFile(filePath);
      const { data, content } = matter(fileContent);
      if (data.title) {
        title = data.title;
      }
      markdownContent = content;
    } catch {
      // Use default title
    }

    const navItem: NavItem = {
      title,
      slug: slug === 'index' ? '' : slug,
      path: pagePath,
      badgeCount:
        slug === 'migration' && migrationReleases.length > 0
          ? migrationReleases.length
          : undefined,
    };

    if (slug === 'examples' && markdownContent) {
      const children = extractExamplesChildren(markdownContent, pagePath);
      if (children.length > 0) {
        navItem.children = children;
      }
    }

    if (slug === 'getting-started') {
      navItem.children = [
        {
          title: 'Manual',
          slug: 'manual',
          path: pagePath,
        },
        {
          title: 'Agent',
          slug: 'agent',
          path: `/${versionId}/agent`,
        },
      ];
    }

    if (slug === 'migration' && migrationReleases.length > 0) {
      navItem.children = migrationReleases.map((release) => ({
        title: release.label,
        slug: release.label,
        path: `/${versionId}/wiki/migration/${release.label}`,
      }));
    }

    return navItem;
  });

  navigation.push({
    title: 'Screenshots',
    slug: 'screenshots',
    path: `/${versionId}/wiki/screenshots`,
  });

  return navigation;
}

// Lines outside code fences; per CommonMark a fence closes only on the same char, at least as long.
function linesOutsideCodeFences(content: string): string[] {
  const lines: string[] = [];
  let openFence: string | null = null;

  for (const line of content.split('\n')) {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
    if (openFence === null) {
      if (fence) {
        openFence = fence;
      } else {
        lines.push(line);
      }
    } else if (fence && fence[0] === openFence[0] && fence.length >= openFence.length
      && line.trim() === fence) {
      openFence = null;
    }
  }

  return lines;
}

export interface PageHeading {
  title: string;
  anchor: string;
}

/**
 * H2 headings in a page's own markdown body, for an "on this page" list.
 * Anchors are generated the same way (plain slugifyHeading, no dedup) that
 * the markdown renderer generates heading ids, so links here always match.
 *
 * Limited to H2 rather than H2/H3: migration release pages concatenate every
 * migration doc for that release, each demoted by one level, so H3 there is
 * "Before"/"After" repeated per doc — same anchor, no way to tell them apart
 * without slug-level dedup. H2 (each doc's own, unique, title) stays safe,
 * and no current page uses H3 for anything else.
 */
export function getPageHeadings(content: string): PageHeading[] {
  const headings: PageHeading[] = [];

  for (const rawLine of linesOutsideCodeFences(content)) {
    const match = rawLine.match(/^##\s+(.+)$/);
    if (!match) {
      continue;
    }

    const title = match[1].trim().replace(/\s+#+\s*$/, '');
    headings.push({ title, anchor: slugifyHeading(title) });
  }

  return headings;
}

/**
 * Chart-type doc pages for a version, derived from whichever `*-chart` wiki
 * pages exist for it — no separate list to keep in sync as pages are added,
 * renamed, or removed. Falls back to a single "Examples" entry for older
 * versions that predate dedicated per-chart pages.
 */
export function getChartPages(versionId: string): { slug: string; title: string }[] {
  const navigation = getNavigation(versionId);
  const chartPages = navigation
    .filter((item) => item.slug.endsWith('-chart'))
    .map((item) => ({ slug: item.slug, title: item.title }));

  if (chartPages.length > 0) {
    return chartPages;
  }

  const examplesPage = navigation.find((item) => item.slug === 'examples');
  return examplesPage ? [{ slug: examplesPage.slug, title: examplesPage.title }] : [];
}

/**
 * Build Examples submenu from headings:
 * - include the first contiguous group of level-3 headings
 * - include the first level-2 heading that appears after that group
 */
function extractExamplesChildren(content: string, pagePath: string): NavItem[] {
  const children: NavItem[] = [];
  const makeSlug = createHeadingSlugger();
  let hasStartedPrimaryGroup = false;
  let hasEndedPrimaryGroup = false;

  for (const rawLine of linesOutsideCodeFences(content)) {
    const match = rawLine.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const title = match[2].trim().replace(/\s+#+\s*$/, '');
    const anchor = makeSlug(title);

    if (!hasStartedPrimaryGroup) {
      if (level !== 3) {
        continue;
      }
      hasStartedPrimaryGroup = true;
      children.push({ title, slug: anchor, path: `${pagePath}#${anchor}` });
      continue;
    }

    if (!hasEndedPrimaryGroup && level === 3) {
      children.push({ title, slug: anchor, path: `${pagePath}#${anchor}` });
      continue;
    }

    if (!hasEndedPrimaryGroup && level <= 2) {
      hasEndedPrimaryGroup = true;
      if (level === 2) {
        children.push({ title, slug: anchor, path: `${pagePath}#${anchor}` });
      }
      break;
    }
  }

  return children;
}

/**
 * Get all page slugs for a version (for static generation)
 */
export function getPageSlugs(versionId: string): string[] {
  const wikiPath = getWikiPath(versionId);
  const files = getMarkdownFiles(wikiPath);
  const hasMigrationFile = files.some((file) => /^migration\.mdx?$/.test(file));
  const pageFiles = hasMigrationFile ? files : [...files, 'migration.md'];
  
  return pageFiles
    .map(file => file.replace(/\.mdx?$/, ''))
    .map((slug) => (slug === 'index' ? '' : slug));
}

/**
 * Load a specific wiki page
 */
export function getPage(versionId: string, slug: string): DocPage | null {
  const wikiPath = getWikiPath(versionId);
  const filename = slug === '' ? 'index.md' : `${slug}.md`;
  const filePath = path.join(wikiPath, filename);
  
  // Try .md first, then .mdx
  let actualPath = filePath;
  if (!pathExists(actualPath)) {
    actualPath = filePath.replace(/\.md$/, '.mdx');
  }
  
  if (!pathExists(actualPath)) {
    if (slug === 'migration') {
      return {
        slug,
        title: 'Migration',
        content: getDefaultMigrationPageMarkdown(),
        frontmatter: {},
      };
    }
    return null;
  }
  
  try {
    const fileContent = readTextFile(actualPath);
    const { data, content } = matter(fileContent);
    
    const frontmatter = data as PageFrontmatter;
    // Resolve simple version placeholders used by docs markdown links/headings.
    const versionLabel = getVersion(versionId)?.label ?? versionId;
    let pageContent = content
      .replace(/\{\{version\}\}/g, versionId)
      .replace(/\{\{versionLabel\}\}/g, versionLabel);

    if (slug === '') {
      const changesetsMarkdown = renderChangesetsMarkdown(getVersionChangesets(versionId));
      if (changesetsMarkdown) {
        pageContent = injectIntoWhatsNewSection(pageContent, changesetsMarkdown);
      }
    }

    if (slug === '') {
      const breakingChangesMarkdown = getVersionBreakingChangesMarkdown(versionId);
      const migrationGuideCount = countMigrationGuides(breakingChangesMarkdown);
      if (migrationGuideCount === 0) {
        pageContent = removeSection(pageContent, /^##\s+Breaking Changes \/ Migration\b/i);
      }
    }

    return {
      slug,
      title: frontmatter.title ?? filenameToTitle(filename),
      content: pageContent,
      frontmatter,
    };
  } catch (error) {
    console.error(`Failed to load page ${slug}:`, error);
    return null;
  }
}
