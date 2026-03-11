# charts-docs

Documentation repository for Charts.

## Repo Layout

- `docs-app/` - Next.js docs website
- `content/` - versioned markdown content
- `registry/versions.json` - version registry used by the site
- `static/` - generated API/demo/playground assets (published on `docs-static` branch)

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
- `docs-static` contains published `static/` artifacts.
- When adding a new version, update `content/<version>/wiki` and `registry/versions.json`.
