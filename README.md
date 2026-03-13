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

## Notes

- `main` contains docs source and app code.
- Set `DOCS_STATIC_BASE_URL` for local/dev/CI since `/static/*` is always served from CDN.
- When adding a new version, update `content/<version>/wiki` and `registry/versions.json`.
