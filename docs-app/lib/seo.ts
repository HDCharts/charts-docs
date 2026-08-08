export const siteUrl = 'https://charts.hdcode.dev';

export function getCanonicalUrl(pathname: string): string {
  return new URL(pathname, siteUrl).toString();
}
