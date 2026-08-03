# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ai.talkative** is a real-time AI Q&A conversation system. Two AI models engage in a back-and-forth dialogue on a given topic, with the conversation streamed to a web client in real-time via WebSocket. The system is structured as a monorepo with three packages:

- **client**: React/TypeScript frontend with Vite and Tailwind CSS
- **server**: Node.js/Express backend that orchestrates the conversation flow
- **shared**: TypeScript type definitions shared across packages

### How it Works

1. User enters a topic and max conversation turns on the client
2. Client sends a request to `/api/conversation/start` to create a conversation session
3. Server establishes a WebSocket connection with the client
4. For each turn, the server:
   - Calls the "ask" model to generate a question (with prior Q&A context)
   - Calls the "answer" model to generate a response to the question
   - Broadcasts the Q&A pair to the connected client via WebSocket
5. Client displays Q&A pairs in real-time as they're received
6. Conversation continues until max turns reached or an error occurs

Both models use OpenAI's API-compatible interface pointing to **LM Studio** (local inference), specifically the `qwen3.5-9b` model. The models are configured with low temperature (0.01) for deterministic responses and 500 token limits.

## Development Commands

### Both Client and Server

```bash
# Run client dev server (Vite on http://localhost:5173)
npm run dev:client

# Run server (Express on http://localhost:3000)
npm run dev:server

# Build client (outputs to dist/)
npm run build --workspace=@monorepo/client

# Build server (outputs compiled JS)
npm run build --workspace=@monorepo/server

# Lint all code
npm run lint

# Format all code with Prettier
npm run format
```

### From Root (Monorepo)

```bash
# Install all dependencies (runs automatically after changes to package.json)
npm install

# List workspaces
npm ls -a
```

## Architecture and Key Files

### Shared Package (`packages/shared/`)
- **`src/types.ts`**: Defines the contract between client and server
  - `ConversationRequest`: POST body for starting a conversation
  - `QAPair`: Immutable question-answer exchange
  - `WebSocketMessage`: Events sent from server to client (`"qa"`, `"complete"`, or `"error"`)

### Server Package (`packages/server/`)

The server is organized into layers for clarity and maintainability:

**`src/index.ts`** — Entrypoint:
- Creates Express app with middleware and routes
- Sets up WebSocket server
- Loads environment config via `dotenv`
- Registers error handlers

**`src/config.ts`** — Configuration management:
- Exports environment-based config object
- Reads from environment variables with sensible defaults
- Centralized source for: `PORT`, LM Studio URL/model/temperature/max-tokens, DB path

**`src/routes/conversation.ts`** — HTTP route handlers:
- `POST /api/conversation/start`: Creates a conversation session and returns `conversationId`
- Validates `topic` (required, non-empty string) and `maxTurns` (integer 1–50)
- Returns 400 on validation failure

**`src/websocket.ts`** — WebSocket orchestration:
- `handleConnection(ws)`: Manages client connections with error handlers
- `runConversation(conversationId)`: Core orchestration loop
  - Maintains `context` string that accumulates Q&A history
  - Iterates `maxTurns` times:
    - Calls `askQuestion()` and `answerQuestion()` from `lmStudio.ts`
    - Sends `{ event: "qa", data }` to client via WebSocket
    - Sends `{ event: "error", data: { message: string } }` on error
  - Sends `{ event: "complete" }` when done or on failure

**`src/lmStudio.ts`** — LM Studio integration:
- `callModel(messages)`: Low-level API wrapper using OpenAI SDK against LM Studio
  - Reads base URL, model name, temperature, and max tokens from `config.ts`
  - Wraps responses to extract `content` or `reasoning_content`
  - Throws errors on API failures
- `askQuestion(topic, context)`: System prompt requesting a single clear question about the topic
- `answerQuestion(topic, question, context)`: System prompt requesting a concise 2-3 sentence answer

**`src/db.ts`** — SQLite persistence:
- `createConversation()` and `addTurn()` with error handling
- Reads DB path from `config.ts`
- Creates schema on first run

### Client Package (`packages/client/`)

**`src/App.tsx`** — React component with:
- Form inputs: `topic` (string) and `maxTurns` (number, default 10)
- `handleStart()`: Initiates conversation by POSTing to server, opens WebSocket, dispatches incoming Q&A pairs to state
- Renders Q&A pairs in order with inline styling (gray border on the left)
- Disables inputs while `running === true`

**`vite.config.ts`**:
- React plugin enabled
- Tailwind CSS v4 via `@tailwindcss/vite` plugin
- Dev server port: 5173

## Key Design Patterns and Constraints

### WebSocket State Management
- Only one client connection is maintained at a time (`currentClient` in `websocket.ts`)
- Conversations are identified by `conversationId` (timestamp-based string)
- WebSocket messages are JSON-encoded strings

### Context Accumulation
- Each turn's Q&A is appended to a `context` string in the format `Q: ...\nA: ...\n\n`
- This context is passed to both `askQuestion()` and `answerQuestion()` to enable coherent multi-turn dialogue
- Context grows unbounded; no cleanup or truncation is implemented

### Configuration
- Centralized in `packages/server/src/config.ts`, reads from environment variables with defaults
- Environment variables (see `packages/server/.env.example`):
  - `PORT`: Server port (default: 3000)
  - `LM_STUDIO_URL`: LM Studio base URL (default: http://127.0.0.1:1234/v1)
  - `LM_STUDIO_MODEL`: Model name (default: qwen3.5-9b)
  - `LM_STUDIO_TEMPERATURE`: Temperature 0–1 (default: 0.01)
  - `LM_STUDIO_MAX_TOKENS`: Max tokens per response (default: 500)
  - `DB_PATH`: SQLite database path (default: ./data/conversations.db)
- Environment variables are loaded via `dotenv` in dev and should be set on the server in production
- CORS is permissively enabled on the server

### Error Handling
- Model API errors are logged to console and send a `{ event: "error" }` message to the client via WebSocket before breaking the conversation loop
- Database errors are caught, logged, and rethrown to propagate to the client
- WebSocket message parsing errors are caught and an error event is sent to the client
- Express error middleware catches uncaught route errors and returns a 500 response
- Process-level handlers for `uncaughtException` and `unhandledRejection` log and exit to prevent hung processes
- WebSocket disconnections set `currentClient` to null
- No retry logic or fallback strategies currently implemented

## Common Development Tasks

### Running the Full Stack

1. Ensure LM Studio is running on `http://127.0.0.1:1234`
2. Terminal 1: `npm run dev:server`
3. Terminal 2: `npm run dev:client`
4. Open http://localhost:5173 and enter a topic to test

### Adding a New Message Type

Update `WebSocketMessage` in `packages/shared/src/types.ts`, then handle it in:
- Server: `websocket.ts` in the message handler or `runConversation()`
- Client: `ws.onmessage` handler in `App.tsx`

### Testing Model Integration

The `lmStudio.ts` module is self-contained. You can test `callModel()` in isolation by creating a temporary test file that imports and calls it with sample messages, assuming LM Studio is running.

### Styling Changes

Client styling uses Tailwind CSS v4. The entry point is likely in a global CSS file (not yet visible in src/App.tsx; may need to be created). Update Tailwind config in `vite.config.ts` if needed.

## Notes for Future Development

- **State Persistence**: Conversations are lost if the server crashes or client disconnects mid-stream; consider persisting conversation state to the database
- **Scalability**: Single-client-at-a-time design (`currentClient` global) won't support concurrent users; refactor to a client registry
- **Testing**: Add unit tests for routes, WebSocket handlers, and model integration; integration tests for the full flow
- **Retry Logic**: Model API calls have no retry strategy on transient failures
- **Client Error Handling**: The client currently doesn't display error messages from the server; wire up error event handlers in `App.tsx`
- **Validation**: Add stricter validation for model responses (e.g., ensure question/answer aren't empty strings)
