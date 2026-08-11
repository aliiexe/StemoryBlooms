import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found | Stemory Blooms',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 50%, #EDE8DC 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'var(--font-sans, sans-serif)',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '560px' }}>
        {/* Decorative flower */}
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', lineHeight: 1 }}>🌸</div>

        {/* 404 number */}
        <div
          style={{
            fontSize: 'clamp(5rem, 20vw, 9rem)',
            fontFamily: 'var(--font-editorial, serif)',
            fontWeight: 600,
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #4f7042, #8BAF7A)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            lineHeight: 1,
            marginBottom: '1rem',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            fontFamily: 'var(--font-editorial, serif)',
            fontWeight: 500,
            color: '#3A3531',
            margin: '0 0 1rem 0',
          }}
        >
          This petal got lost in the wind
        </h1>

        <p style={{ color: '#7A7571', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          Let&apos;s get you back to something beautiful.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.9rem 2rem',
              backgroundColor: '#4f7042',
              color: 'white',
              borderRadius: '50px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(79,112,66,0.3)',
            }}
          >
            ← Back to Home
          </Link>
          <Link
            href="/shop"
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
            Browse the Shop
          </Link>
        </div>

        {/* Subtle decoration */}
        <div
          style={{
            marginTop: '4rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            opacity: 0.35,
            fontSize: '1.4rem',
          }}
        >
          🌿 🌸 🌷 🌸 🌿
        </div>
      </div>
    </div>
  );
}
