# charts-docs

Documentation repository for HDCharts.

<img width="1675" height="776" alt="Screenshot 2026-09-27 at 18 15 04" src="https://github.com/user-attachments/assets/b4694d0b-024c-4369-ae0d-0ff77ae6215a" />


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

From the repo root:

```bash
npm install   # also installs docs-app dependencies
npm run dev
```

The root scripts forward to `docs-app/`, so `build`, `start`, and `lint` work the same way.
