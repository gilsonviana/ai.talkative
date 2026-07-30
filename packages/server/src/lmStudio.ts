import OpenAI from "openai";

const LM_STUDIO_URL = "http://127.0.0.1:1234/v1";
const LM_STUDIO_MODEL = "qwen3.5-9b";
const LM_STUDIO_TEMPERATURE = 0.01;
const LM_STUDIO_MAX_TOKENS = 500;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

const client = new OpenAI({
  apiKey: "not-needed",
  baseURL: LM_STUDIO_URL,
});

export async function callModel(messages: Message[]): Promise<string> {
  try {
    const response = await client.chat.completions.create({
      model: LM_STUDIO_MODEL,
      messages,
      temperature: LM_STUDIO_TEMPERATURE,
      max_completion_tokens: LM_STUDIO_MAX_TOKENS,
    });

    if (!response.choices || !response.choices[0]) {
      throw new Error("Invalid response from LM Studio");
    }

    const message = response.choices[0].message as any;
    const content = message.content || message.reasoning_content || "";

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
