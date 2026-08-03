import type { ConversationRequest } from '@monorepo/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function startConversation(req: ConversationRequest): Promise<{ conversationId: string }> {
  const res = await fetch(`${API_URL}/api/conversation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}
