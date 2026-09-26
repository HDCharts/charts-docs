import type { MetadataRoute } from 'next';
import { getPageSlugs, getMigrationReleases } from '@/lib/content';
import { getDevSlugs } from '@/lib/dev-docs';
import { getAllVersions, getDefaultVersionId } from '@/lib/versions';
import { getCanonicalUrl, siteUrl } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const versions = getAllVersions();
  const wikiUrls = versions.flatMap((version) =>
    getPageSlugs(version.id).map((slug) => {
      const path = `/${version.id}/wiki${slug ? `/${slug}` : ''}`;
      return { url: getCanonicalUrl(path) };
    }),
  );
  const migrationReleaseUrls = versions.flatMap((version) =>
    getMigrationReleases(version.id).map((release) => ({
      url: getCanonicalUrl(`/${version.id}/wiki/migration/${release.label}`),
    })),
  );
  const apiUrls = versions.map((version) => ({
    url: `${siteUrl}/${version.id}/api`,
  }));
  const screenshotUrl = {
    url: getCanonicalUrl(`/${getDefaultVersionId()}/wiki/screenshots`),
  };
  const workflowUrl = {
    url: getCanonicalUrl('/workflow'),
  };
  const devUrls = getDevSlugs().map((slug) => ({
    url: getCanonicalUrl(`/dev/${slug.join('/')}`),
  }));

  return [
    { url: `${siteUrl}/privacy-policy` },
    { url: `${siteUrl}/built-with` },
    workflowUrl,
    { url: getCanonicalUrl('/ci-stats') },
    ...wikiUrls,
    ...migrationReleaseUrls,
    ...apiUrls,
    screenshotUrl,
    ...devUrls,
  ];
}
