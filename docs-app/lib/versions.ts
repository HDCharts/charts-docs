import fs from 'fs';
import path from 'path';
import { VersionRegistry, DocVersion, MavenArtifacts } from './types';

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
  return getVersion(getDefaultVersionId());
}

/**
 * Get the default version ID
 */
export function getDefaultVersionId(): string {
  return pickDefaultVersionId(getAllVersions());
}

/**
 * First visible release, else first visible version, else first version.
 */
export function pickDefaultVersionId(versions: DocVersion[]): string {
  const visible = versions.filter(isVisible);
  return visible.find((v) => v.id !== 'snapshot')?.id ?? visible[0]?.id ?? versions[0]?.id ?? 'snapshot';
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

// Snapshot docs describe the upcoming 3.0.0 release.
function isThreeOrLater(versionId: string): boolean {
  return versionId === 'snapshot' || isVersionAtLeast(versionId, '3.0.0');
}

/**
 * Maven coordinates moved to io.github.hdcharts in 3.0.0; older releases keep the old group.
 */
export function getMavenArtifacts(versionId: string): MavenArtifacts {
  return isThreeOrLater(versionId)
    ? { group: 'io.github.hdcharts', bomArtifact: 'bom' }
    : { group: 'io.github.dautovicharis', bomArtifact: 'charts-bom' };
}

/**
 * Snapshot and 3.0.0+ docs ship wider GIFs than older releases.
 */
export function hasLargeGifs(versionId: string): boolean {
  return isThreeOrLater(versionId);
}
