import "dotenv/config";

import express, { Express } from "express";
import { WebSocketServer } from "ws";
import http from "http";
import cors from "cors";

import { config } from "./config";
import conversationRouter from "./routes/conversation";
import { handleConnection } from "./websocket";

const app: Express = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(cors());

app.use("/api/conversation", conversationRouter);

wss.on("connection", handleConnection);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

server.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  process.exit(1);
});
