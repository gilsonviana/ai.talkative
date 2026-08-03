export interface ConversationRequest {
  topic: string;
  maxTurns: number;
}

export interface QAPair {
  question: string;
  answer: string;
}

export interface WebSocketMessage {
  event: "qa" | "complete" | "error";
  data?: QAPair | { message: string };
}
