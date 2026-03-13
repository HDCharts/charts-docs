#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

snapshot_dir="${repo_root}/content/snapshot"
snapshot_changes_dir="${snapshot_dir}/changes"

if [[ ! -d "${snapshot_dir}" ]]; then
  echo "Missing snapshot directory: ${snapshot_dir}" >&2
  exit 1
fi

# Start a fresh snapshot changelog cycle after promotion.
if [[ -d "${snapshot_changes_dir}" ]]; then
  find "${snapshot_changes_dir}" -type f \( -name "*.md" -o -name "*.mdx" \) -delete
fi

cat > "${snapshot_dir}/breaking-changes.md" <<'EOF'
# Breaking Changes

No call-site updates required.
EOF

echo "Reset snapshot changes and breaking-changes baseline."
