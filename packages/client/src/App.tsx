import { useState } from "react";

import { QAPair } from "@monorepo/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col">
      <div className="mx-auto max-w-2xl px-6 py-16 flex-1 w-full">
        <div className="mb-12">
          <h1 className="font-serif text-4xl font-medium text-ink mb-6">
            AI Q&A Conversation
          </h1>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStart();
            }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1">
                <label
                  htmlFor="topic"
                  className="block text-xs uppercase tracking-widest text-ink-soft mb-2"
                >
                  Topic
                </label>
                <Input
                  id="topic"
                  type="text"
                  placeholder="Enter a topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={running}
                  className="h-auto w-full bg-transparent border-0 border-b border-line font-sans text-base text-ink placeholder:text-ink-soft/60 py-2 px-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-accent transition-colors disabled:opacity-50"
                />
              </div>

              <div className="sm:w-24">
                <label
                  htmlFor="maxTurns"
                  className="block text-xs uppercase tracking-widest text-ink-soft mb-2"
                >
                  Turns
                </label>
                <Input
                  id="maxTurns"
                  type="number"
                  min="1"
                  max="50"
                  value={maxTurns}
                  onChange={(e) => setMaxTurns(Number(e.target.value))}
                  disabled={running}
                  className="h-auto w-full bg-transparent border-0 border-b border-line font-sans text-right text-base text-ink placeholder:text-ink-soft/60 py-2 px-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-accent transition-colors disabled:opacity-50"
                />
              </div>
            </div>
          </form>
        </div>

        {running && (
          <div className="flex items-center gap-2 text-sm text-ink-soft mb-8">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Listening…
          </div>
        )}

        {!running && pairs.length === 0 && (
          <p className="font-serif italic text-ink-soft text-center py-16">
            Enter a topic to begin the conversation.
          </p>
        )}

        {pairs.length > 0 && (
          <div className="divide-y divide-line pb-24">
            {pairs.map((pair, idx) => (
              <article
                key={idx}
                className="py-8"
                style={{
                  animation: "fade-in-up 0.4s ease-out",
                }}
              >
                <p className="font-sans text-xs uppercase tracking-widest text-accent mb-2">
                  Question
                </p>
                <p className="font-serif text-lg leading-relaxed text-ink mb-6">
                  {pair.question}
                </p>

                <p className="font-sans text-xs uppercase tracking-widest text-ink-soft mb-2">
                  Answer
                </p>
                <p className="font-serif text-lg leading-relaxed text-ink">
                  {pair.answer}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      <Button
        type="button"
        onClick={handleStart}
        disabled={running || !topic}
        className="fixed bottom-0 left-0 right-0 w-full z-50 h-auto rounded-none bg-ink text-paper font-sans text-sm font-medium tracking-wide py-3 hover:bg-accent transition-colors disabled:opacity-40 disabled:pointer-events-none"
      >
        Start
      </Button>
    </div>
  );
}
