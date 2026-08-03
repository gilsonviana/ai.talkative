import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  role: 'question' | 'answer';
  content: string;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isQuestion = role === 'question';

  return (
    <div className={cn('flex mb-4', isQuestion ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-sm md:max-w-md lg:max-w-lg px-4 py-3 rounded-lg',
          isQuestion
            ? 'bg-muted text-muted-foreground border-l-4 border-primary'
            : 'bg-primary text-primary-foreground'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
      </div>
    </div>
  );
}
