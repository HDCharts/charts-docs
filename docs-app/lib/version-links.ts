import { DocVersion } from './types';

function appendPath(base: string, suffix: string): string {
  const normalizedBase = base.replace(/\/+$/, '');
  const normalizedSuffix = suffix.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedSuffix}`;
}

function normalizeInternalOrAbsoluteUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function getVersionApiIndexUrl(version: DocVersion): string {
  const apiBase = version.apiBase.trim() || `/static/api/${version.id}`;
  return appendPath(apiBase, 'index.html');
}

export function getVersionDemoUrl(version: DocVersion): string {
  const configuredUrl = normalizeInternalOrAbsoluteUrl(version.demoBase ?? '');
  const demoBase = configuredUrl || `/demo/${version.id}/`;
  return demoBase.endsWith('/') ? demoBase : `${demoBase}/`;
}
