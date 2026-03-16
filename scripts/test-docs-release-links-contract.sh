#!/usr/bin/env bash
set -euo pipefail

# Validates docs release link contract for PR CI:
# - registry path conventions
# - required docs content entries
# - route rewrites/redirects and user-facing links

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

REGISTRY_PATH="${REPO_ROOT}/registry/versions.json"
NEXT_CONFIG_PATH="${REPO_ROOT}/docs-app/next.config.ts"
SIDEBAR_PATH="${REPO_ROOT}/docs-app/components/Sidebar.tsx"
API_PAGE_PATH="${REPO_ROOT}/docs-app/app/[version]/api/page.tsx"

failures=0

log_pass() {
  echo "PASS: $1"
}

log_fail() {
  echo "FAIL: $1" >&2
  failures=$((failures + 1))
}

assert_file_exists() {
  local path="$1"
  local label="$2"
  if [[ -f "${path}" ]]; then
    log_pass "${label}"
  else
    log_fail "${label} (missing: ${path})"
  fi
}

assert_dir_exists() {
  local path="$1"
  local label="$2"
  if [[ -d "${path}" ]]; then
    log_pass "${label}"
  else
    log_fail "${label} (missing: ${path})"
  fi
}

assert_equals() {
  local expected="$1"
  local actual="$2"
  local label="$3"
  if [[ "${expected}" == "${actual}" ]]; then
    log_pass "${label}"
  else
    log_fail "${label} (expected: ${expected}, actual: ${actual})"
  fi
}

assert_file_contains() {
  local path="$1"
  local expected_text="$2"
  local label="$3"
  if grep -Fq "${expected_text}" "${path}"; then
    log_pass "${label}"
  else
    log_fail "${label} (missing text: ${expected_text})"
  fi
}

test_registry_release_links() {
  if [[ ! -f "${REGISTRY_PATH}" ]]; then
    log_fail "versions registry exists (missing: ${REGISTRY_PATH})"
    return
  fi

  local row_count=0
  while IFS=$'\t' read -r id wiki_root api_base demo_base; do
    row_count=$((row_count + 1))

    local expected_wiki_root="/content/${id}/wiki"
    local expected_api_base="/static/api/${id}"
    local expected_demo_base="/demo/${id}/"

    assert_equals "${expected_wiki_root}" "${wiki_root}" "registry wikiRoot uses canonical path for ${id}"
    assert_equals "${expected_api_base}" "${api_base}" "registry apiBase uses canonical path for ${id}"
    assert_equals "${expected_demo_base}" "${demo_base}" "registry demoBase uses clean URL for ${id}"

    assert_dir_exists "${REPO_ROOT}/content/${id}/wiki" "wiki directory exists for ${id}"
    assert_file_exists "${REPO_ROOT}/content/${id}/wiki/index.md" "wiki index exists for ${id}"
  done < <(
    node -e '
      const fs = require("fs");
      const registryPath = process.argv[1];
      const parsed = JSON.parse(fs.readFileSync(registryPath, "utf8"));
      if (!Array.isArray(parsed.versions)) process.exit(2);
      for (const version of parsed.versions) {
        const id = version.id ?? "";
        const wikiRoot = version.wikiRoot ?? "";
        const apiBase = version.apiBase ?? "";
        const demoBase = version.demoBase ?? "";
        process.stdout.write([id, wikiRoot, apiBase, demoBase].join("\t") + "\n");
      }
    ' "${REGISTRY_PATH}"
  )

  if ((row_count == 0)); then
    log_fail "versions registry contains at least one release entry"
  else
    log_pass "versions registry contains ${row_count} release entries"
  fi
}

test_clean_link_routes_are_present() {
  assert_file_contains "${NEXT_CONFIG_PATH}" 'source: "/demo"' "next config redirects /demo to latest release"
  assert_file_contains "${NEXT_CONFIG_PATH}" 'source: "/playground"' "next config redirects /playground to snapshot"
  assert_file_contains "${NEXT_CONFIG_PATH}" 'throw new Error("DOCS_STATIC_BASE_URL must be set for docs-app builds and runtime.")' "next config requires DOCS_STATIC_BASE_URL"
  assert_file_contains "${NEXT_CONFIG_PATH}" 'const staticOrigin = `${docsStaticBaseUrl}/static`' "next config resolves static origin from DOCS_STATIC_BASE_URL"
  assert_file_contains "${NEXT_CONFIG_PATH}" 'source: "/static/:path*"' "next config rewrites static assets through CDN origin"
  assert_file_contains "${NEXT_CONFIG_PATH}" 'source: "/demo/:version/"' "next config rewrites clean demo entry route"
  assert_file_contains "${NEXT_CONFIG_PATH}" 'destination: `${staticOrigin}/demo/:version/index.html`' "next config maps clean demo entry route"
  assert_file_contains "${NEXT_CONFIG_PATH}" 'source: "/playground/:version/"' "next config rewrites clean playground entry route"
  assert_file_contains "${NEXT_CONFIG_PATH}" 'destination: `${staticOrigin}/playground/:version/index.html`' "next config maps clean playground entry route"
}

test_user_facing_links_use_clean_paths() {
  assert_file_contains "${SIDEBAR_PATH}" 'href={demoUrl}' "sidebar demo link resolves via version registry URL"
  assert_file_contains "${SIDEBAR_PATH}" 'const demoUrl = getVersionDemoUrl(version);' "sidebar uses version demoBase helper"
  assert_file_contains "${SIDEBAR_PATH}" 'href="/playground"' "sidebar playground link uses clean URL"
  assert_file_contains "${API_PAGE_PATH}" 'const apiUrl = getVersionApiIndexUrl(version);' "api page uses version apiBase helper"
}

main() {
  test_registry_release_links
  test_clean_link_routes_are_present
  test_user_facing_links_use_clean_paths

  if ((failures > 0)); then
    echo "Link validation failed: ${failures} check(s)." >&2
    exit 1
  fi

  echo "All docs release link checks passed."
}

main "$@"
