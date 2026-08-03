import { Router, Request, Response } from "express";
import { createConversation } from "../db";

const router = Router();

interface ConversationStartRequest {
  topic?: string;
  maxTurns?: number;
}

const MAX_TURNS_LIMIT = 50;

router.post("/start", (req: Request<Record<string, never>, object, ConversationStartRequest>, res: Response) => {
  const { topic, maxTurns = 10 } = req.body;

  if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
    res.status(400).json({ error: "topic required and must be a non-empty string" });
    return;
  }

  if (!Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > MAX_TURNS_LIMIT) {
    res.status(400).json({
      error: `maxTurns must be an integer between 1 and ${MAX_TURNS_LIMIT}`,
    });
    return;
  }

  const conversationId = Date.now().toString();

  try {
    createConversation(conversationId, topic, maxTurns);
    res.json({ conversationId });
  } catch (error) {
    console.error("Error starting conversation:", error);
    res.status(500).json({ error: "Failed to start conversation" });
  }
});

export default router;
