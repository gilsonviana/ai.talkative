import { TopicForm } from './TopicForm';

interface HomeScreenProps {
  onSubmit: (topic: string, maxTurns: number) => void;
  isSubmitting: boolean;
  error?: string | null;
}

export function HomeScreen({ onSubmit, isSubmitting, error }: HomeScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">ai.talkative</h1>
          <p className="text-lg text-muted-foreground">Watch two AIs debate a topic in real-time</p>
        </div>

        <TopicForm onSubmit={onSubmit} isSubmitting={isSubmitting} error={error} />
      </div>
    </div>
  );
}
