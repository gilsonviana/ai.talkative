import { useRef, useState } from 'react';
import type { QAPair, WebSocketMessage } from '@monorepo/shared';
import { startConversation } from '@/lib/api';

type Status = 'idle' | 'starting' | 'connecting' | 'streaming' | 'complete' | 'error';

export function useConversation() {
  const [status, setStatus] = useState<Status>('idle');
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  const start = async (topic: string, maxTurns: number) => {
    setStatus('starting');
    setError(null);
    setQaPairs([]);
    setTopic(topic);

    try {
      const { conversationId } = await startConversation({ topic, maxTurns });
      setConversationId(conversationId);
      setStatus('connecting');

      const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        ws.send(JSON.stringify({ conversationId }));
        setStatus('streaming');
      };

      ws.onmessage = (event) => {
        const msg: WebSocketMessage = JSON.parse(event.data);
        if (msg.event === 'qa' && msg.data) {
          setQaPairs((prev) => [...prev, msg.data!]);
        } else if (msg.event === 'complete') {
          setStatus('complete');
          ws.close();
        }
      };

      ws.onerror = () => {
        setStatus('error');
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        if (status !== 'complete') {
          setStatus('error');
          if (!error) setError('Connection closed unexpectedly');
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
    }
  };

  const reset = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('idle');
    setQaPairs([]);
    setError(null);
    setConversationId(null);
    setTopic(null);
  };

  return {
    status,
    qaPairs,
    error,
    conversationId,
    topic,
    start,
    reset,
  };
}
