import * as Sentry from '@sentry/react';
import type { ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

export default function AppErrorBoundary({ children }: AppErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      beforeCapture={(scope) => {
        scope.setTag('surface', 'react');
        scope.setTag('error_boundary', 'app');
        scope.setLevel('fatal');
      }}
      fallback={({ error, resetError }) => {
        const message = error instanceof Error ? error.message : String(error);
        const backendUnavailable = message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('supabase');

        return (
          <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
            <div className="max-w-md rounded-lg border border-gold-700/25 bg-dark-300 p-8 text-center shadow-gold">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
                DK STUDIOS
              </p>
              <h1 className="mt-4 text-2xl font-bold text-white">
                {backendUnavailable ? 'Backend unavailable' : 'Something went wrong'}
              </h1>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                {backendUnavailable
                  ? 'The Supabase-backed API is unavailable. Check the Supabase URL, anon key, service role key, and Netlify function environment.'
                  : 'The issue has been reported automatically. Please refresh this view or try again.'}
              </p>
              <button
                type="button"
                onClick={resetError}
                className="mt-6 rounded-lg bg-gradient-to-r from-gold-600 to-gold-400 px-5 py-3 text-sm font-bold text-black shadow-gold transition-all duration-200 hover:from-gold-500 hover:to-gold-300 active:scale-95"
              >
                Try Again
              </button>
            </div>
          </div>
        );
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
