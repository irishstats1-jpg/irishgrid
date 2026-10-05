'use client';

import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';

// Branded error page within the localised site (renders inside the header/footer).
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page flex flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow">Error</p>
      <h1 className="mt-2 text-4xl font-semibold text-ink">Something went wrong</h1>
      <p className="prose-body mt-3 max-w-md">
        This page could not be loaded. Rather than show a figure we can&apos;t stand behind, we show nothing. Please try
        again in a moment.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-500">Reference: {error.digest}</p>}
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={reset} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Back to home</Link>
      </div>
    </div>
  );
}
