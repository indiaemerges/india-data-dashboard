interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({
  title = "Failed to load data",
  message,
  onRetry,
}: ErrorDisplayProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-4xl mb-3">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
