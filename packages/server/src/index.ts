import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import cors from "cors";

import { askQuestion, answerQuestion } from "./lmStudio";
import { WebSocketMessage, QAPair } from "@monorepo/shared";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(cors());

interface ActiveConversation {
  topic: string;
  maxTurns: number;
}

const conversations = new Map<string, ActiveConversation>();
let currentClient: any = null;

app.post("/api/conversation/start", (req, res) => {
  const { topic, maxTurns = 10 } = req.body;

  if (!topic) {
    res.status(400).json({ error: "topic required" });
    return;
  }

  const conversationId = Date.now().toString();
  conversations.set(conversationId, { topic, maxTurns });

  res.json({ conversationId });
});

async function runConversation(conversationId: string) {
  const conv = conversations.get(conversationId);
  if (!conv) return;

  let context = "";

  for (let turn = 0; turn < conv.maxTurns; turn++) {
    try {
      // Model A asks question
      const question = await askQuestion(conv.topic, context);

      // Model B answers
      const answer = await answerQuestion(conv.topic, question, context);

      // Add to context
      context += `Q: ${question}\nA: ${answer}\n\n`;

      // Send to client
      const message: WebSocketMessage = {
        event: "qa",
        data: { question, answer },
      };
      if (currentClient) {
        currentClient.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error(`Turn ${turn} error:`, error);
      break;
    }
  }

  // Send complete signal
  if (currentClient) {
    currentClient.send(JSON.stringify({ event: "complete" }));
  }

  conversations.delete(conversationId);
}

wss.on("connection", (ws) => {
  console.log("Client connected");
  currentClient = ws;

  ws.on("message", (message: string) => {
    const { conversationId } = JSON.parse(message);
    runConversation(conversationId);
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    currentClient = null;
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
