#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 <release_version> [release_notes]" >&2
  exit 1
fi

release_version="$1"
release_notes="${2:-Release ${release_version}}"

if [[ ! "${release_version}" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "release_version must be SemVer (major.minor.patch), got: ${release_version}" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/.." && pwd)"

snapshot_dir="${repo_root}/content/snapshot"
release_dir="${repo_root}/content/${release_version}"
registry_path="${repo_root}/registry/versions.json"

if [[ ! -d "${snapshot_dir}" ]]; then
  echo "Missing snapshot directory: ${snapshot_dir}" >&2
  exit 1
fi

if [[ ! -d "${snapshot_dir}/wiki" ]]; then
  echo "Missing snapshot wiki directory: ${snapshot_dir}/wiki" >&2
  exit 1
fi

if [[ -e "${release_dir}" ]]; then
  echo "Release content already exists: ${release_dir}" >&2
  exit 1
fi

if [[ ! -f "${registry_path}" ]]; then
  echo "Missing registry file: ${registry_path}" >&2
  exit 1
fi

cp -R "${snapshot_dir}" "${release_dir}"

# Keep generated Finder metadata out of the new release folder.
find "${release_dir}" -name ".DS_Store" -type f -delete

tmp_registry="$(mktemp)"

if ! jq --arg release "${release_version}" --arg notes "${release_notes}" '
  .versions as $versions
  | if any($versions[]?; .id == $release) then
      error("release version already exists in registry")
    else
      .versions = (
        [ $versions[] | select(.id == "snapshot") ] +
        [
          {
            id: $release,
            label: $release,
            wikiRoot: ("/content/" + $release + "/wiki"),
            apiBase: ("/static/api/" + $release),
            demoBase: ("/demo/" + $release + "/"),
            notes: $notes
          }
        ] +
        [ $versions[] | select(.id != "snapshot") ]
      )
    end
' "${registry_path}" > "${tmp_registry}"; then
  rm -rf "${release_dir}"
  rm -f "${tmp_registry}"
  echo "Failed to update registry/versions.json." >&2
  exit 1
fi

mv "${tmp_registry}" "${registry_path}"

echo "Promoted snapshot docs to release version ${release_version}."
