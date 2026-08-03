import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { DocPage, DocVersion, NavItem, PageFrontmatter } from './types';
import { createHeadingSlugger } from './anchors';
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

interface MigrationRelease {
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
function getMigrationReleases(versionId: string): MigrationRelease[] {
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

function demoteMigrationHeadings(markdown: string): string {
  return markdown.replace(/^(#{2,5})\s+/gm, (_, hashes: string) => `${hashes}# `);
}

function renderCumulativeMigrationMarkdown(versionId: string): string {
  const migrationReleases = getMigrationReleases(versionId);
  if (migrationReleases.length === 0) {
    return 'No breaking changes have been recorded for this release or earlier supported releases.';
  }

  const lines: string[] = [];
  for (const migrationRelease of [...migrationReleases].reverse()) {
    lines.push(`## ${migrationRelease.label}`, '');
    lines.push(
      migrationRelease.previousLabel
        ? `> **Upgrade note:** If upgrading from ${migrationRelease.previousLabel} or earlier, read these migration notes.`
        : '> **Upgrade note:** If upgrading from an earlier release, read these migration notes.',
      '',
      demoteMigrationHeadings(migrationRelease.markdown),
      '',
    );
  }

  return lines.join('\n').trimEnd();
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
function filenameToTitle(filename: string): string {
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

      const aRank = orderRank[aSlug] ?? Number.MAX_SAFE_INTEGER;
      const bRank = orderRank[bSlug] ?? Number.MAX_SAFE_INTEGER;

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
  const navigationFiles = [...files];
  if (!hasMigrationFile && migrationReleases.length > 0) {
    navigationFiles.push('migration.md');
  }

  const navigation = navigationFiles.map((file) => {
    const slug = file.replace(/\.mdx?$/, '');
    const filePath = path.join(wikiPath, file);
    const pagePath = `/${versionId}/wiki/${slug === 'index' ? '' : slug}`;

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

    if (slug === 'migration') {
      const baseMigrationMarkdown = markdownContent || getDefaultMigrationPageMarkdown();
      const cumulativeMigrationMarkdown = renderCumulativeMigrationMarkdown(versionId);
      const markdownWithBreakingChanges = `${baseMigrationMarkdown.trimEnd()}\n\n${cumulativeMigrationMarkdown}\n`;
      const children = extractMigrationChildren(markdownWithBreakingChanges, pagePath);
      if (children.length > 0) {
        navItem.children = children;
      }
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
  const isSnapshotVersion = pagePath.startsWith('/snapshot/');

  const displayTitle = (title: string) =>
    isSnapshotVersion ? title.replace(/\s+Chart$/, '') : title;

  for (const rawLine of content.split('\n')) {
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
      children.push({ title: displayTitle(title), slug: anchor, path: `${pagePath}#${anchor}` });
      continue;
    }

    if (!hasEndedPrimaryGroup && level === 3) {
      children.push({ title: displayTitle(title), slug: anchor, path: `${pagePath}#${anchor}` });
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

function extractMigrationChildren(content: string, pagePath: string): NavItem[] {
  const children: NavItem[] = [];
  const makeSlug = createHeadingSlugger();

  for (const rawLine of content.split('\n')) {
    const match = rawLine.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      continue;
    }

    const level = match[1].length;
    const title = match[2].trim().replace(/\s+#+\s*$/, '');
    const anchor = makeSlug(title);

    if (level !== 2) {
      continue;
    }

    if (/^overview$/i.test(title)) {
      continue;
    }

    children.push({ title, slug: anchor, path: `${pagePath}#${anchor}` });
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
  const pageFiles = [...files];
  if (!hasMigrationFile && getMigrationReleases(versionId).length > 0) {
    pageFiles.push('migration.md');
  }
  
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
      const cumulativeMigrationMarkdown = renderCumulativeMigrationMarkdown(versionId);
      if (getMigrationReleases(versionId).length === 0) {
        return null;
      }
      const pageContent = `${getDefaultMigrationPageMarkdown().trimEnd()}\n\n${cumulativeMigrationMarkdown}\n`;
      return {
        slug,
        title: 'Migration',
        content: pageContent,
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

    if (slug === 'migration') {
      pageContent = `${pageContent.trimEnd()}\n\n${renderCumulativeMigrationMarkdown(versionId)}\n`;
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

/**
 * Get all pages for a version
 */
export function getAllPages(versionId: string): DocPage[] {
  const slugs = getPageSlugs(versionId);
  const pages: DocPage[] = [];
  
  for (const slug of slugs) {
    const page = getPage(versionId, slug);
    if (page) {
      pages.push(page);
    }
  }
  
  return pages;
}
