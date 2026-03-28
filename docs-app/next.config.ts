import type { NextConfig } from "next";
import { getDefaultVersionId } from "./lib/versions";

const defaultDocsVersion = getDefaultVersionId();
const docsStaticBaseUrl = "https://d31fy84ku2wzt.cloudfront.net";

const nextConfig: NextConfig = {
  // Enable trailing slashes for clean URLs
  trailingSlash: false,
  // Allow explicit trailing-slash URLs where static index files rely on relative assets.
  skipTrailingSlashRedirect: true,

  // CI materializes large docs payloads under public/. They must remain static assets,
  // but should not be traced into serverless functions.
  outputFileTracingExcludes: {
    '*': [
      './public/content/**/*',
    ],
  },
  
  // Image optimization is disabled because static assets are served from CloudFront CDN
  // (see docsStaticBaseUrl). Next.js built-in image optimization requires a Node.js
  // server at request time, which is unavailable in this static/CDN deployment model.
  // To re-enable: remove this flag and configure an image CDN loader (Cloudinary,
  // imgix, or Vercel), then migrate <img> to next/image throughout the codebase.
  images: {
    unoptimized: true,
  },
  
  // Turbopack configuration (Next.js 16+ uses Turbopack by default)
  turbopack: {},

  // Snapshot artifacts change frequently and keep stable filenames.
  // Disable browser caching to avoid stale playground bundles after regeneration.
  async headers() {
    return [
      {
        source: "/playground/snapshot/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
      {
        source: "/static/playground/snapshot/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },

  async rewrites() {
    const staticOrigin = `${docsStaticBaseUrl}/static`;
    const routes = [
      {
        source: "/static/:path*",
        destination: `${staticOrigin}/:path*`,
      },
      {
        source: "/demo/:version/",
        destination: `${staticOrigin}/demo/:version/index.html`,
      },
      {
        source: "/demo/:version/:path*",
        destination: `${staticOrigin}/demo/:version/:path*`,
      },
      {
        source: "/playground/:version/",
        destination: `${staticOrigin}/playground/:version/index.html`,
      },
      {
        source: "/playground/:version/:path*",
        destination: `${staticOrigin}/playground/:version/:path*`,
      },
    ];

    return routes;
  },
  
  // Redirects for convenience
  async redirects() {
    return [
      {
        source: "/demo",
        destination: `/demo/${defaultDocsVersion}/`,
        permanent: false,
      },
      {
        source: "/playground",
        destination: "/playground/snapshot/",
        permanent: false,
      },
      {
        source: "/demo/:version/index.html",
        destination: "/demo/:version/",
        permanent: true,
      },
      {
        source: "/playground/:version/index.html",
        destination: "/playground/:version/",
        permanent: true,
      },
      // Redirect /docs to current version
      {
        source: '/docs',
        destination: `/${defaultDocsVersion}/wiki`,
        permanent: false,
      },
      // Redirect /wiki to current version wiki
      {
        source: '/wiki',
        destination: `/${defaultDocsVersion}/wiki`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
