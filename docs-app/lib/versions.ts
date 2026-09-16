import fs from 'fs';
import path from 'path';
import { VersionRegistry, DocVersion } from './types';

/**
 * Path to the version registry file
 */
const REGISTRY_PATH = path.join(process.cwd(), '..', 'registry', 'versions.json');

/**
 * Cache for the version registry
 */
let registryCache: VersionRegistry | null = null;

function isVisible(version: DocVersion): boolean {
  return version.visible !== false;
}

/**
 * Load the version registry from disk
 */
export function getVersionRegistry(): VersionRegistry {
  if (registryCache) {
    return registryCache;
  }
  
  try {
    const content = fs.readFileSync(/* turbopackIgnore: true */ REGISTRY_PATH, 'utf-8');
    registryCache = JSON.parse(content) as VersionRegistry;
    return registryCache;
  } catch (error) {
    console.error('Failed to load version registry:', error);
    // Return empty registry as fallback
    return { versions: [] };
  }
}

/**
 * Get all available versions
 */
export function getAllVersions(): DocVersion[] {
  return getVersionRegistry().versions;
}

/**
 * Get all visible versions (shown in UI controls)
 */
export function getVersions(): DocVersion[] {
  return getAllVersions().filter(isVisible);
}

/**
 * Get a specific version by ID (including hidden versions)
 */
export function getVersion(versionId: string): DocVersion | undefined {
  return getAllVersions().find(v => v.id === versionId);
}

/**
 * Get the current (default) version
 */
export function getCurrentVersion(): DocVersion | undefined {
  const versions = getVersions();
  return versions.find(v => v.id !== 'snapshot') ?? versions[0];
}

/**
 * Get the default version ID
 */
export function getDefaultVersionId(): string {
  const current = getCurrentVersion();
  return current?.id ?? getAllVersions()[0]?.id ?? 'snapshot';
}

/**
 * Parse a version id like "3.0.0" into [major, minor, patch].
 * Returns null for non-numeric ids such as "snapshot".
 */
export function parseVersion(versionId: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(versionId.trim());
  if (!match) {
    return null;
  }
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/**
 * Returns true when `versionId` is greater than or equal to `targetId`.
 * Non-numeric ids (e.g. "snapshot") are treated as less than any numeric target.
 */
export function isVersionAtLeast(versionId: string, targetId: string): boolean {
  const version = parseVersion(versionId);
  const target = parseVersion(targetId);
  if (!version || !target) {
    return false;
  }
  if (version[0] !== target[0]) {
    return version[0] > target[0];
  }
  if (version[1] !== target[1]) {
    return version[1] > target[1];
  }
  return version[2] >= target[2];
}

/**
 * Returns true when `versionId` uses the legacy wiki/examples markdown
 * format (heading → code → optional image, no inline images before code).
 * Snapshot always uses the modern layout, so it returns false.
 */
export function isLegacyExamplesVersion(versionId: string): boolean {
  if (versionId === 'snapshot') {
    return false;
  }
  return !isVersionAtLeast(versionId, '2.2.0');
}

/**
 * Clear the registry cache (useful for development)
 */
export function clearRegistryCache(): void {
  registryCache = null;
}
