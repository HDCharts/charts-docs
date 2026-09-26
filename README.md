# charts-docs

Documentation repository for HDCharts.

<img width="1000" alt="Screenshot 2026-08-09 at 08 14 23" src="https://github.com/user-attachments/assets/4b6f197f-8284-489b-b6a8-b05a79e6c369" />

## Repo Layout

- `docs-app/` - Next.js docs website
- `content/` - versioned markdown content
  - `content/snapshot/wiki/` (except `assets/`) is synced automatically from
    [`HDCharts/charts` `docs/wiki/`](https://github.com/HDCharts/charts/tree/main/docs/wiki)
    by CI (`sync-wiki-docs.sh`) — edit it there, not here; changes here are overwritten on
    the next sync
  - `content/dev/` is synced the same way from `docs/wiki/dev/`: unversioned developer docs
    served under `/dev`, never copied into a release
- `registry/versions.json` - version registry used by the site
- static assets for API/demo/playground are served from object storage/CDN

## Local Development

```bash
cd docs-app
npm run dev
```
