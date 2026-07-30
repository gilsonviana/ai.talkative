#!/usr/bin/env bash
#
# check-setup.sh — read-only diagnostics for the ai.talkative monorepo.
#
# Verifies system requirements, installed dependencies, LM Studio connectivity,
# and prints a clear PASS/WARN/FAIL line per check with a troubleshooting hint on
# anything that isn't green. This script NEVER mutates the repo or installs
# anything — it only inspects.
#
# Exit code: 0 if no FAILs, 1 if any FAIL. WARNs do not fail the run.

set -uo pipefail

# Resolve repo root as the dir two levels up from this script
# (.claude/skills/check-setup/check-setup.sh -> repo root).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$ROOT" || exit 2

# --- Output helpers -------------------------------------------------------
if [ -t 1 ]; then
  GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; BOLD=$'\033[1m'; DIM=$'\033[2m'; RESET=$'\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; BOLD=''; DIM=''; RESET=''
fi

FAILS=0
WARNS=0

pass() { printf '  %s✔ PASS%s  %s\n' "$GREEN" "$RESET" "$1"; }
warn() {
  WARNS=$((WARNS + 1))
  printf '  %s▲ WARN%s  %s\n' "$YELLOW" "$RESET" "$1"
  [ -n "${2:-}" ] && printf '           %s↳ %s%s\n' "$DIM" "$2" "$RESET"
}
fail() {
  FAILS=$((FAILS + 1))
  printf '  %s✘ FAIL%s  %s\n' "$RED" "$RESET" "$1"
  [ -n "${2:-}" ] && printf '           %s↳ fix: %s%s\n' "$DIM" "$2" "$RESET"
}
section() { printf '\n%s%s%s\n' "$BOLD" "$1" "$RESET"; }

# Compare two dotted versions: returns 0 if $1 >= $2.
ver_ge() {
  [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

printf '%s ai.talkative — setup doctor %s\n' "$BOLD" "$RESET"
printf '%s repo: %s%s\n' "$DIM" "$ROOT" "$RESET"

# ==========================================================================
section "1. System requirements"
# ==========================================================================

# Node >= 18
if command -v node >/dev/null 2>&1; then
  NODE_V="$(node -v | sed 's/^v//')"
  if ver_ge "$NODE_V" "18.0.0"; then
    pass "node $NODE_V (>= 18)"
  else
    fail "node $NODE_V is too old (need >= 18)" "install Node 18+: https://nodejs.org or use nvm"
  fi
else
  fail "node not found" "install Node 18+: https://nodejs.org or use nvm (nvm install 18)"
fi

# npm (should be bundled with Node)
if command -v npm >/dev/null 2>&1; then
  NPM_V="$(npm -v 2>/dev/null)"
  pass "npm $NPM_V"
else
  fail "npm not found" "npm is typically bundled with Node.js; reinstall Node from https://nodejs.org"
fi

# curl (used to probe LM Studio)
if command -v curl >/dev/null 2>&1; then
  pass "curl present (used for LM Studio connectivity check)"
else
  warn "curl not found" "optional — install curl to probe LM Studio connectivity"
fi

# ==========================================================================
section "2. Installed dependencies"
# ==========================================================================

# Root node_modules (npm workspace — all deps hoisted here)
if [ -d node_modules ]; then
  pass "root node_modules present (npm workspace)"
else
  fail "root node_modules missing" "run 'npm install' at the repo root"
fi

# Check that client and server packages have package.json
if [ -f packages/client/package.json ]; then
  pass "client package.json present"
else
  fail "client package.json missing" "workspace integrity check failed"
fi

if [ -f packages/server/package.json ]; then
  pass "server package.json present"
else
  fail "server package.json missing" "workspace integrity check failed"
fi

# ==========================================================================
section "3. LM Studio connectivity"
# ==========================================================================

# LM Studio is expected to run on http://127.0.0.1:1234 locally
LM_STUDIO_URL="http://127.0.0.1:1234/v1/models"

if command -v curl >/dev/null 2>&1; then
  if curl -s "$LM_STUDIO_URL" >/dev/null 2>&1; then
    pass "LM Studio responding at http://127.0.0.1:1234"
  else
    warn "LM Studio not responding at http://127.0.0.1:1234" "start LM Studio or adjust the URL in packages/server/src/lmStudio.ts if it's running elsewhere"
  fi
else
  warn "skipping LM Studio probe (no curl)" "ensure LM Studio is running on http://127.0.0.1:1234; install curl to verify automatically"
fi

# ==========================================================================
section "Summary"
# ==========================================================================
if [ "$FAILS" -eq 0 ]; then
  printf '%s All required checks passed%s (%d warning(s)).\n' "$GREEN" "$RESET" "$WARNS"
  printf '%s Next: run the dev servers — npm run dev:client and npm run dev:server (in separate terminals).%s\n' "$DIM" "$RESET"
  exit 0
else
  printf '%s %d required check(s) FAILED%s, %d warning(s).\n' "$RED" "$FAILS" "$RESET" "$WARNS"
  printf '%s Resolve the FAIL items above (each has a fix), then re-run this doctor.%s\n' "$DIM" "$RESET"
  exit 1
fi
