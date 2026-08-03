import { cn } from '@/lib/utils';

type Status = 'idle' | 'starting' | 'connecting' | 'streaming' | 'complete' | 'error';

interface ConnectionStatusProps {
  status: Status;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getLabel = (status: Status): string => {
    switch (status) {
      case 'starting':
        return 'Starting…';
      case 'connecting':
        return 'Connecting…';
      case 'streaming':
        return 'Live';
      case 'complete':
        return 'Complete';
      case 'error':
        return 'Error';
      case 'idle':
      default:
        return '';
    }
  };

  const getColors = (status: Status): string => {
    switch (status) {
      case 'starting':
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'streaming':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'complete':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'idle':
      default:
        return '';
    }
  };

  if (status === 'idle') return null;

  return (
    <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium', getColors(status))}>
      {getLabel(status)}
    </span>
  );
}
