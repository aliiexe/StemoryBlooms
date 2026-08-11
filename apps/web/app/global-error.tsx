'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 50%, #EDE8DC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '560px' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem', lineHeight: 1 }}>🥀</div>

          <div
            style={{
              fontSize: 'clamp(4rem, 15vw, 7rem)',
              fontWeight: 700,
              color: 'transparent',
              backgroundImage: 'linear-gradient(135deg, #8B1C1C, #C62828)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              lineHeight: 1,
              marginBottom: '1rem',
            }}
          >
            500
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
              fontWeight: 500,
              color: '#3A3531',
              margin: '0 0 1rem 0',
            }}
          >
            Something wilted on our end
          </h1>

          <p style={{ color: '#7A7571', fontSize: '1rem', lineHeight: 1.7, marginBottom: '0.5rem' }}>
            An unexpected error occurred. Our team has been notified and is working on it.
          </p>

          {error.digest && (
            <p style={{ color: '#C4C0BB', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '2rem' }}>
              Error ID: {error.digest}
            </p>
          )}

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <button
              onClick={() => reset()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.9rem 2rem',
                backgroundColor: '#4f7042',
                color: 'white',
                borderRadius: '50px',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(79,112,66,0.3)',
              }}
            >
              Try Again
            </button>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.9rem 2rem',
                backgroundColor: 'transparent',
                color: '#4f7042',
                border: '1.5px solid #4f7042',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              ← Go Home
            </Link>
          </div>

          <div
            style={{
              marginTop: '4rem',
              display: 'flex',
              justifyContent: 'center',
              gap: '0.75rem',
              opacity: 0.3,
              fontSize: '1.4rem',
            }}
          >
            🌿 🌸 🌷 🌸 🌿
          </div>
        </div>
      </body>
    </html>
  );
}
