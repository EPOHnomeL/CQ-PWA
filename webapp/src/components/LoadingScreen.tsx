"use client";

interface LoadingScreenProps {
  progress: number;
  error?: string | null;
}

export function LoadingScreen({ progress, error }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-6 z-50">
      <div className="text-4xl font-bold text-primary">CQ</div>
      <p className="text-foreground/70 text-sm">Christian Quotes</p>

      {error ? (
        <div className="text-red-400 text-center px-8">
          <p className="font-medium">Failed to load data</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary rounded-lg text-white text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="w-64 flex flex-col items-center gap-2">
          <div className="w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-foreground/50 text-xs">
            Loading quotes... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
