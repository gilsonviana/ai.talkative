import { useEffect, useRef } from 'react';
import type { QAPair } from '@monorepo/shared';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { ConnectionStatus } from './ConnectionStatus';

type Status = 'idle' | 'starting' | 'connecting' | 'streaming' | 'complete' | 'error';

interface ConversationViewProps {
  topic: string | null;
  qaPairs: QAPair[];
  status: Status;
  error: string | null;
  onReset: () => void;
}

export function ConversationView({ topic, qaPairs, status, error, onReset }: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [qaPairs]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{topic}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {qaPairs.length} turn{qaPairs.length !== 1 ? 's' : ''} discussed
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatus status={status} />
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={status !== 'complete' && status !== 'error'}
            >
              New conversation
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1">
          <div className="max-w-2xl mx-auto w-full px-4 py-6">
            {qaPairs.length === 0 && status === 'streaming' && (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">Starting conversation…</p>
                </div>
              </div>
            )}

            {qaPairs.map((pair, idx) => (
              <div key={idx}>
                <MessageBubble role="question" content={pair.question} />
                <MessageBubble role="answer" content={pair.answer} />
              </div>
            ))}

            {status === 'complete' && qaPairs.length > 0 && (
              <div className="mt-6 p-4 bg-card border border-border rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Conversation complete</p>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
