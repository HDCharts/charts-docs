# charts-docs

Documentation repository for Charts.

## Repo Layout

- `docs-app/` - Next.js docs website
- `content/` - versioned markdown content
- `registry/versions.json` - version registry used by the site
- static assets for API/demo/playground are served from object storage/CDN via `DOCS_STATIC_BASE_URL`

## Local Development

```bash
cd docs-app
npm ci
npm run dev
```

## Build

```bash
cd docs-app
npm run build
npm run start
```
