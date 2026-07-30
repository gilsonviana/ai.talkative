# Feature: SQLite Conversation Persistence

## Goal

Currently, conversations and their Q&A turns exist only in memory (`conversations` Map in `packages/server/src/index.ts`) and are discarded once a conversation completes or the server restarts. Persisting conversations and their Q&A pairs to a SQLite database allows conversation history to survive server restarts and lays the groundwork for future features like listing/replaying past conversations. No authentication layer exists, so no `users` table is needed — conversations are unowned.

## Acceptance Criteria

- A local SQLite database file stores every started conversation and its Q&A turns.
- Each conversation record includes `topic`, `maxTurns`, and a creation `timestamp`.
- Each Q&A turn record includes `question`, `answer`, `turnNumber`, a `timestamp`, and a foreign key back to its conversation.
- Starting a conversation (`POST /api/conversation/start`) persists a new conversation row immediately.
- Each turn produced during `runConversation()` is persisted as it happens (not just at the end), so partial conversations are retained if the loop errors out early.
- Existing in-memory behavior (WebSocket streaming to the client) is unaffected — persistence is additive, not a replacement for the live streaming flow.
- The database file is created automatically on server startup if it doesn't exist (schema migration runs on boot).

## Technical Approach

- Add `better-sqlite3` as a server dependency (synchronous API, simplest fit for this small, single-process server).
- New module `packages/server/src/db.ts`:
  - Opens/creates the SQLite file (e.g. `packages/server/data/conversations.db`).
  - Runs schema creation (`CREATE TABLE IF NOT EXISTS ...`) on startup.
  - Exports small helper functions: `createConversation(id, topic, maxTurns)`, `addTurn(conversationId, turnNumber, question, answer)`.
- Update `packages/server/src/index.ts`:
  - In `POST /api/conversation/start`, call `createConversation()` after generating `conversationId`.
  - In `runConversation()`, call `addTurn()` right after each Q&A pair is generated (alongside the existing WebSocket send).
- No changes needed to `packages/shared/src/types.ts` — persistence is server-internal and doesn't change the client-facing contract.

## Schema

```sql
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  max_turns INTEGER NOT NULL,
  created_at INTEGER NOT NULL -- unix ms timestamp
);

CREATE TABLE qa_turns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  turn_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at INTEGER NOT NULL -- unix ms timestamp
);
```

## Edge Cases / Constraints

- Server restart mid-conversation: the in-memory `conversations` Map is lost, but any turns already written to SQLite remain — the conversation is left in a permanently incomplete state (no "completed" flag is in scope for this change).
- Model/turn errors that `break` the loop early: partial turns already written stay in the DB; no rollback needed since each turn is its own row.
- Database file path must be writable in both dev and any future deployment environment; committed to `.gitignore` since it's local runtime data.
- `better-sqlite3` is synchronous — calls are fast enough (local file, small rows) that this won't block the event loop in a way that matters for this app's scale.

## Files to Modify

- `packages/server/package.json` (add `better-sqlite3` + `@types/better-sqlite3`)
- `packages/server/src/db.ts` (create)
- `packages/server/src/index.ts` (modify: wire in `createConversation` and `addTurn` calls)
- `.gitignore` (add `packages/server/data/` for the SQLite file)

## Test Plan

- Manual: start the server, POST to `/api/conversation/start`, confirm a row appears in the `conversations` table (via `sqlite3` CLI or a quick script).
- Manual: run a full conversation end-to-end via the client and confirm `qa_turns` rows accumulate matching the WebSocket-streamed Q&A pairs.
- Manual: kill the server mid-conversation and confirm already-written turns persist after restart.
- Unit test (if a test setup is added later): `db.ts` helpers against an in-memory SQLite instance (`:memory:`).
