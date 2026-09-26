import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { filenameToTitle } from './content';
import { DocPage, PageFrontmatter } from './types';

/**
 * Unversioned developer docs synced from HDCharts/charts docs/wiki/dev.
 */
const DEV_BASE = path.join(process.cwd(), '..', 'content', 'dev');
const DEV_PATH = '/dev';
// Page names that can be a route; anything else is never listed or served.
const PAGE_NAME = /^[a-z0-9-]+$/;

export interface DevNavItem {
  title: string;
  path: string;
}

export interface DevNavSection {
  title: string;
  path: string;
  pages: DevNavItem[];
}

interface DevPageFile {
  name: string;
  frontmatter: PageFrontmatter;
  content: string;
}

function readPageFile(filePath: string): DevPageFile {
  const { data, content } = matter(fs.readFileSync(/* turbopackIgnore: true */ filePath, 'utf-8'));
  return { name: path.basename(filePath, '.md'), frontmatter: data as PageFrontmatter, content };
}

function titleFor(page: DevPageFile): string {
  return page.frontmatter.title ?? filenameToTitle(page.name);
}

function pagePath(section: string, name: string): string {
  return name === 'index' ? `${DEV_PATH}/${section}` : `${DEV_PATH}/${section}/${name}`;
}

// Sections are subfolders with an index.md; pages sort by `order` frontmatter, then name.
function getSections(): string[] {
  if (!fs.existsSync(/* turbopackIgnore: true */ DEV_BASE)) {
    return [];
  }

  return fs
    .readdirSync(/* turbopackIgnore: true */ DEV_BASE, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(DEV_BASE, entry.name, 'index.md')))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function getSectionPages(section: string): DevPageFile[] {
  const sectionPath = path.join(DEV_BASE, section);
  return fs
    .readdirSync(/* turbopackIgnore: true */ sectionPath)
    .filter((file) => file.endsWith('.md') && PAGE_NAME.test(path.basename(file, '.md')))
    .map((file) => readPageFile(path.join(sectionPath, file)))
    .sort((a, b) =>
      (a.frontmatter.order ?? Number.MAX_SAFE_INTEGER) - (b.frontmatter.order ?? Number.MAX_SAFE_INTEGER)
      || a.name.localeCompare(b.name));
}

export function getDevNavigation(): DevNavSection[] {
  return getSections().map((section) => {
    const pages = getSectionPages(section);
    const index = pages.find((page) => page.name === 'index');
    return {
      title: index ? titleFor(index) : section,
      path: pagePath(section, 'index'),
      pages: pages.map((page) => ({
        title: page.name === 'index' ? 'Overview' : titleFor(page),
        path: pagePath(section, page.name),
      })),
    };
  });
}

export function getDevSlugs(): string[][] {
  return getSections().flatMap((section) =>
    getSectionPages(section).map((page) => (page.name === 'index' ? [section] : [section, page.name])));
}

/**
 * Load a dev page; `page.md` links to pages in the same section become site routes.
 */
export function getDevPage(slug: string[]): DocPage | null {
  const [section, name = 'index'] = slug;
  if (slug.length > 2 || !getSections().includes(section) || !PAGE_NAME.test(name)) {
    return null;
  }

  const filePath = path.join(DEV_BASE, section, `${name}.md`);
  if (!fs.existsSync(/* turbopackIgnore: true */ filePath)) {
    return null;
  }

  const page = readPageFile(filePath);
  const content = page.content.replace(
    /\]\(([^)\s]+?)\.md(#[^)]*)?\)/g,
    (link: string, target: string, hash = '') => {
      if (/^https?:/.test(target)) {
        return link;
      }
      // Only existing pages in the same section have a site route, so fail the build on anything else.
      if (!PAGE_NAME.test(target) || !fs.existsSync(/* turbopackIgnore: true */ path.join(DEV_BASE, section, `${target}.md`))) {
        throw new Error(`Broken dev docs link "${target}.md" in content/dev/${section}/${name}.md`);
      }
      return `](${pagePath(section, target)}${hash})`;
    },
  );

  return {
    slug: slug.join('/'),
    title: titleFor(page),
    content,
    frontmatter: page.frontmatter,
  };
}
