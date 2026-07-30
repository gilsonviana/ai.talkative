import { useState } from "react";
import { Input, Button } from "@headlessui/react";

import { QAPair } from "@monorepo/shared";

export default function App() {
  const [topic, setTopic] = useState("");
  const [maxTurns, setMaxTurns] = useState(10);
  const [running, setRunning] = useState(false);
  const [pairs, setPairs] = useState<QAPair[]>([]);

  const handleStart = async () => {
    const res = await fetch("http://localhost:3000/api/conversation/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, maxTurns }),
    });

    const { conversationId } = await res.json();
    setRunning(true);
    setPairs([]);

    // Connect WebSocket
    const ws = new WebSocket("ws://localhost:3000");
    ws.onopen = () => {
      ws.send(JSON.stringify({ conversationId }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.event === "qa") {
        setPairs((prev) => [...prev, message.data]);
      } else if (message.event === "complete") {
        setRunning(false);
        ws.close();
      }
    };
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>AI Q&A Conversation</h1>

      <div>
        <Input
          type="text"
          placeholder="Enter topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={running}
        />
        <Input
          type="number"
          placeholder="Max turns"
          value={maxTurns}
          onChange={(e) => setMaxTurns(Number(e.target.value))}
          disabled={running}
        />
        <Button onClick={handleStart} disabled={running || !topic}>
          Start
        </Button>
      </div>

      {running && <p>Active...</p>}

      <div>
        {pairs.map((pair, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "20px",
              borderLeft: "2px solid gray",
              paddingLeft: "10px",
            }}
          >
            <p>
              <strong>Q:</strong> {pair.question}
            </p>
            <p>
              <strong>A:</strong> {pair.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
