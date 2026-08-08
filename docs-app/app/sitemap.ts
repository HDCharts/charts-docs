import type { MetadataRoute } from 'next';
import { getPageSlugs } from '@/lib/content';
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
  const apiUrls = versions.map((version) => ({
    url: `${siteUrl}/${version.id}/api`,
  }));
  const screenshotUrl = {
    url: getCanonicalUrl(`/${getDefaultVersionId()}/wiki/screenshots`),
  };

  return [
    { url: `${siteUrl}/privacy-policy` },
    ...wikiUrls,
    ...apiUrls,
    screenshotUrl,
  ];
}
