#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

content_dir="${repo_root}/content"
docs_public_dir="${repo_root}/docs-app/public"
public_content_path="${docs_public_dir}/content"

# Keep local builds untouched. Deployment/CI runs materialize real files.
if [[ "${VERCEL:-}" != "1" && "${CI:-}" != "true" ]]; then
  exit 0
fi

if [[ ! -d "${content_dir}" ]]; then
  echo "Missing content directory: ${content_dir}" >&2
  exit 1
fi

mkdir -p "${docs_public_dir}"
rm -rf "${public_content_path}"
cp -a "${content_dir}" "${public_content_path}"

echo "Materialized docs content to docs-app/public/content"
