'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h1 style={{ color: 'red' }}>Client Error Caught</h1>
      <pre style={{ whiteSpace: 'pre-wrap', background: '#fee', padding: 16 }}>
        {error.message}
      </pre>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: '#666' }}>
        {error.stack}
      </pre>
      <button onClick={reset} style={{ marginTop: 16, padding: '8px 16px' }}>
        Retry
      </button>
    </div>
  );
}
