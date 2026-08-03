import { useConversation } from '@/hooks/useConversation';
import { HomeScreen } from '@/components/HomeScreen';
import { ConversationView } from '@/components/ConversationView';

function App() {
  const conversation = useConversation();

  const handleStart = (topic: string, maxTurns: number) => {
    conversation.start(topic, maxTurns);
  };

  const isHome = conversation.status === 'idle';

  return isHome ? (
    <HomeScreen
      onSubmit={handleStart}
      isSubmitting={conversation.status === 'starting'}
      error={conversation.error}
    />
  ) : (
    <ConversationView
      topic={conversation.topic}
      qaPairs={conversation.qaPairs}
      status={conversation.status}
      error={conversation.error}
      onReset={conversation.reset}
    />
  );
}

export default App;
