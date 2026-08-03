import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface TopicFormProps {
  onSubmit: (topic: string, maxTurns: number) => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function TopicForm({ onSubmit, isSubmitting, error }: TopicFormProps) {
  const [topic, setTopic] = useState('');
  const [maxTurns, setMaxTurns] = useState(10);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic.trim(), Math.max(1, Math.min(50, maxTurns)));
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="What should the two AIs discuss?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="turns" className="text-sm text-muted-foreground">
              Turns:
            </label>
            <Input
              id="turns"
              type="number"
              min="1"
              max="50"
              value={maxTurns}
              onChange={(e) => setMaxTurns(parseInt(e.target.value, 10))}
              disabled={isSubmitting}
              className="w-20"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Starting…' : 'Start Conversation'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
