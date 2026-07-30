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
  - `WebSocketMessage`: Events sent from server to client (`"qa"` or `"complete"`)

### Server Package (`packages/server/`)

**`src/index.ts`** — Main server logic:
- Express app with CORS enabled
- WebSocket server for real-time streaming
- `POST /api/conversation/start`: Creates a conversation session and returns `conversationId`
- WebSocket message handler: Receives `{ conversationId }` from client and executes `runConversation()`
- `runConversation()`: The core orchestration loop
  - Maintains `context` string that accumulates Q&A history
  - Iterates `maxTurns` times:
    - Calls `askQuestion()` to generate a question
    - Calls `answerQuestion()` to generate an answer
    - Sends `{ event: "qa", data }` to client via WebSocket
  - Sends `{ event: "complete" }` when done

**`src/lmStudio.ts`** — LM Studio integration:
- `callModel(messages)`: Low-level API wrapper using OpenAI SDK against LM Studio
  - Base URL: `http://127.0.0.1:1234/v1` (LM Studio default)
  - Model: `qwen3.5-9b`
  - Temperature: 0.01 (near-deterministic)
  - Max tokens: 500
- `askQuestion(topic, context)`: System prompt that requests a single clear question about the topic
- `answerQuestion(topic, question, context)`: System prompt that requests a concise 2-3 sentence answer

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
- Only one client connection is maintained at a time (`currentClient` in `index.ts`)
- Conversations are identified by `conversationId` (timestamp-based string)
- WebSocket messages are JSON-encoded strings

### Context Accumulation
- Each turn's Q&A is appended to a `context` string in the format `Q: ...\nA: ...\n\n`
- This context is passed to both `askQuestion()` and `answerQuestion()` to enable coherent multi-turn dialogue
- Context grows unbounded; no cleanup or truncation is implemented

### Configuration
- LM Studio connection details are hardcoded in `src/lmStudio.ts`; no env vars yet
- No build-time environment switching (dev/prod use same endpoints)
- CORS is permissively enabled on the server

### Error Handling
- Model API errors are logged to console and break the conversation loop
- WebSocket disconnections set `currentClient` to null but don't persist conversation state
- No retry logic or fallback strategies

## Common Development Tasks

### Running the Full Stack

1. Ensure LM Studio is running on `http://127.0.0.1:1234`
2. Terminal 1: `npm run dev:server`
3. Terminal 2: `npm run dev:client`
4. Open http://localhost:5173 and enter a topic to test

### Adding a New Message Type

Update `WebSocketMessage` in `packages/shared/src/types.ts`, then handle it in:
- Server: `runConversation()` or the ws.onmessage handler in `index.ts`
- Client: `ws.onmessage` handler in `App.tsx`

### Testing Model Integration

The `lmStudio.ts` module is self-contained. You can test `callModel()` in isolation by creating a temporary test file that imports and calls it with sample messages, assuming LM Studio is running.

### Styling Changes

Client styling uses Tailwind CSS v4. The entry point is likely in a global CSS file (not yet visible in src/App.tsx; may need to be created). Update Tailwind config in `vite.config.ts` if needed.

## Notes for Future Development

- **State Persistence**: Conversations are lost if the server crashes or client disconnects mid-stream
- **Scalability**: Single-client-at-a-time design won't support concurrent users
- **Configuration**: LM Studio URL, model name, and parameters should be moved to environment variables
- **Validation**: Input validation on topic/maxTurns is minimal
- **Styling**: The client uses inline styles; consider migrating to Tailwind utility classes
