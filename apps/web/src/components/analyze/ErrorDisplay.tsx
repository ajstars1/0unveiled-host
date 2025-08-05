interface ErrorDisplayProps {
  error: string;
  onDismiss?: () => void;
}

export function ErrorDisplay({ error, onDismiss }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {error}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-400 hover:text-red-600"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
