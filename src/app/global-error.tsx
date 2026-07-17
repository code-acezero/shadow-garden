'use client';

// Removed Sentry dependency
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-[#050505] text-white font-sans">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-zinc-400 mb-8 max-w-md">
            A critical error occurred. The application could not recover.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}