interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export default function LoadingSpinner({
  message = "Loading data...",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div
        className={`animate-spin rounded-full border-b-2 border-orange-500 ${sizeClasses[size]}`}
      />
      {message && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}
