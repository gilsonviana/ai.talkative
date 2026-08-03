import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { config } from "./config";

const dataDir = path.dirname(config.database.path);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(config.database.path);

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    topic TEXT NOT NULL,
    max_turns INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS qa_turns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    turn_number INTEGER NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
`);

export function createConversation(
  id: string,
  topic: string,
  maxTurns: number
) {
  try {
    db.prepare(
      "INSERT INTO conversations (id, topic, max_turns, created_at) VALUES (?, ?, ?, ?)"
    ).run(id, topic, maxTurns, Date.now());
  } catch (error) {
    console.error("Failed to create conversation:", error);
    throw error;
  }
}

export function addTurn(
  conversationId: string,
  turnNumber: number,
  question: string,
  answer: string
) {
  try {
    db.prepare(
      "INSERT INTO qa_turns (conversation_id, turn_number, question, answer, created_at) VALUES (?, ?, ?, ?, ?)"
    ).run(conversationId, turnNumber, question, answer, Date.now());
  } catch (error) {
    console.error("Failed to add turn:", error);
    throw error;
  }
}
