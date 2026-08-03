import OpenAI from "openai";
import { config } from "./config";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const client = new OpenAI({
  apiKey: "not-needed",
  baseURL: config.lmStudio.url,
});

export async function callModel(messages: Message[]): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: config.lmStudio.model,
      messages,
      temperature: config.lmStudio.temperature,
      max_completion_tokens: config.lmStudio.maxTokens,
    });

    if (!response.choices || !response.choices[0]) {
      throw new Error("Invalid response from LM Studio");
    }

    const message = response.choices[0].message;
    const content = (message as { content?: string; reasoning_content?: string }).content ||
      (message as { reasoning_content?: string }).reasoning_content ||
      "";

    return content.trim();
  } catch (error) {
    console.error("LM Studio error: ", error);
    throw error;
  }
}

export async function askQuestion(
  topic: string,
  context: string,
): Promise<string> {
  const messages: Message[] = [
    {
      role: "system",
      content:
        "Ask one clear question about the topic. Answer with only the question, nothing else.",
    },
    {
      role: "user",
      content: `Topic: ${topic}\n\nPrevious Q&A:\n${context || "None yet"}\n\nYour question:`,
    },
  ];

  return callModel(messages);
}

export async function answerQuestion(
  topic: string,
  question: string,
  context: string,
): Promise<string> {
  const messages: Message[] = [
    {
      role: "system",
      content:
        "Answer in 2-3 sentences only. Be direct and concise. Take a clinic approach.",
    },
    {
      role: "user",
      content: `Topic: ${topic}\n\nQuestion: ${question}\n\nContext:${context}\n\nAnswer:`,
    },
  ];

  return callModel(messages);
}
