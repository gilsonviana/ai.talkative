import path from "path";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  lmStudio: {
    url: process.env.LM_STUDIO_URL || "http://127.0.0.1:1234/v1",
    model: process.env.LM_STUDIO_MODEL || "qwen3.5-9b",
    temperature: parseFloat(process.env.LM_STUDIO_TEMPERATURE || "0.01"),
    maxTokens: parseInt(process.env.LM_STUDIO_MAX_TOKENS || "500", 10),
  },
  database: {
    path: process.env.DB_PATH || path.join(__dirname, "..", "data", "conversations.db"),
  },
};
