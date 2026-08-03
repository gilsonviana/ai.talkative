import { WebSocket } from "ws";
import { askQuestion, answerQuestion } from "./lmStudio";
import { addTurn } from "./db";
import type { WebSocketMessage } from "@monorepo/shared";

interface ActiveConversation {
  topic: string;
  maxTurns: number;
}

export const conversations = new Map<string, ActiveConversation>();
export let currentClient: WebSocket | null = null;

function sendMessage(message: WebSocketMessage) {
  if (currentClient && currentClient.readyState === WebSocket.OPEN) {
    currentClient.send(JSON.stringify(message));
  }
}

export async function runConversation(conversationId: string) {
  const conv = conversations.get(conversationId);
  if (!conv) {
    sendMessage({
      event: "error",
      data: { message: "Conversation not found" },
    });
    return;
  }

  let context = "";

  for (let turn = 0; turn < conv.maxTurns; turn++) {
    try {
      const question = await askQuestion(conv.topic, context);
      const answer = await answerQuestion(conv.topic, question, context);

      context += `Q: ${question}\nA: ${answer}\n\n`;

      try {
        addTurn(conversationId, turn, question, answer);
      } catch (dbError) {
        console.error(`Failed to persist turn ${turn}:`, dbError);
        sendMessage({
          event: "error",
          data: { message: `Failed to save turn ${turn + 1}` },
        });
        break;
      }

      const message: WebSocketMessage = {
        event: "qa",
        data: { question, answer },
      };
      sendMessage(message);
    } catch (error) {
      console.error(`Turn ${turn} error:`, error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      sendMessage({
        event: "error",
        data: { message: `Error during turn ${turn + 1}: ${errorMsg}` },
      });
      break;
    }
  }

  sendMessage({ event: "complete" });
  conversations.delete(conversationId);
}

export function handleConnection(ws: WebSocket) {
  console.log("Client connected");
  currentClient = ws;

  ws.on("message", (message: string) => {
    try {
      const parsed = JSON.parse(message);
      const { conversationId } = parsed;

      if (!conversationId || typeof conversationId !== "string") {
        sendMessage({
          event: "error",
          data: { message: "conversationId is required" },
        });
        return;
      }

      runConversation(conversationId);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error);
      sendMessage({
        event: "error",
        data: { message: "Invalid message format" },
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    currentClient = null;
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
}
