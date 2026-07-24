# Release notes

This directory mirrors versioned release-note fragments from
`HDCharts/charts/release-notes/`.

```text
release-notes/
├── current-version.txt
└── <version>/
    ├── changes/
    └── migrations/
```

The synchronization workflow owns version directories and
`current-version.txt`; do not edit them directly in charts-docs.

Snapshot pages use `current-version.txt` while its version is not yet present
in the released-version registry. Released pages read their matching version
directory directly. This keeps release notes immutable and removes the need to
copy or reset snapshot note files during promotion.
