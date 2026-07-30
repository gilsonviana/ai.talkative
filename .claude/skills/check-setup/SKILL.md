---
name: check-setup
description: Verify the ai.talkative monorepo is set up correctly — check system requirements, dependencies, and LM Studio connectivity, then attempt to boot both server and client. Use when onboarding, when `npm run dev:*` fails, or to sanity-check the environment.
---

Verify the project is set up correctly and can boot. Work top to bottom; **do not skip ahead** — a later step assumes the earlier ones passed. For every problem, give the user the specific fix command (the bundled script already prints these) rather than a vague "check your setup".

## 1. Run the diagnostics script

Run the read-only doctor from the repo root:

```bash
bash .claude/skills/check-setup/check-setup.sh
```

It checks, in order, and prints `PASS` / `WARN` / `FAIL` with a fix hint on each non-green line:

1. **System requirements** — `node` (>= 18), `npm`, and `curl` (for LM Studio connectivity check).
2. **Installed dependencies** — root `node_modules` (npm workspace hoisted), and the `client` and `server` package.json files.
3. **LM Studio connectivity** — confirms LM Studio is running and responding on `http://127.0.0.1:1234/v1/models`.

The script never mutates the repo or installs anything — it only inspects. It exits non-zero if any check **FAILs** (WARNs don't fail it).

## 2. Resolve findings, then re-run

Report the results grouped as **FAIL** (blocks boot) vs **WARN** (works, but should be fixed). For each FAIL, run or offer the exact fix the script printed. The common ones:

| Symptom                                 | Fix                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| Node missing or too old (< 18)          | `nvm install 18 && nvm use` or install from https://nodejs.org                        |
| `npm` missing                           | npm is bundled with Node.js; reinstall Node from https://nodejs.org                    |
| `root node_modules` missing             | `npm install` (repo root — installs all workspace dependencies)                        |
| `curl` missing (optional but useful)    | Install curl via your package manager (e.g., `brew install curl` on macOS)             |
| LM Studio not responding                | Start LM Studio and ensure it's listening on `http://127.0.0.1:1234`, or update the URL in `packages/server/src/lmStudio.ts` if it's elsewhere |

After applying fixes, **re-run the script** until there are no FAILs. Confirm with the user before running any install command that changes their machine or the repo.

## 3. Attempt to boot the apps

Only once step 1 shows no FAILs. Boot the server and client in separate terminals and confirm each actually comes up — don't just launch and assume success.

**Server** (from repo root):

```bash
npm run dev:server
```

Verify it's running — you should see Express listening on `http://localhost:3000` and WebSocket server ready.

**Client** (from repo root, in a separate terminal):

```bash
npm run dev:client
```

Confirm Vite reports it's listening on `http://localhost:5173` and you can open the browser to see the UI.

**Both at once** — note: the current project doesn't have a unified `npm run dev` command, so you need to run them separately.

When you run the servers as foreground processes to test them, confirm they're actually serving before handing control back to the user. If a boot fails, capture the actual error output and map it back to a step-1 check (e.g. a module import error → `npm install`, an LM Studio connection error → step 3 connectivity, a port-already-in-use error → kill the conflicting process).

## 4. Report

Give the user a short, honest summary: what passed, what you fixed, whether both apps booted (with the URLs — server `http://localhost:3000`, client `http://localhost:5173`), and any remaining WARNs worth addressing later. If something is still broken, state exactly what and the next action — don't claim success it didn't reach.
