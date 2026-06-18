'use client';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
  const containerClass = fullScreen
    ? 'flex items-center justify-center min-h-screen bg-gray-50'
    : 'flex items-center justify-center p-8';

  return (
    <div className={containerClass} role="status" aria-label={message}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}
