import React from 'react';
import styles from './page.module.css';

export default function ShopLoading() {
  return (
    <main className={styles.shopContainer}>
      <header className={styles.shopHeader}>
        <div style={{ height: '3rem', width: '300px', backgroundColor: '#EAE6DF', margin: '0 auto 1rem', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
        <div style={{ height: '1.5rem', width: '400px', backgroundColor: '#EAE6DF', margin: '0 auto', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
      </header>

      <div className={styles.productGrid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: '#EAE6DF', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
            <div style={{ height: '1.25rem', width: '70%', backgroundColor: '#EAE6DF', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
            <div style={{ height: '1rem', width: '40%', backgroundColor: '#EAE6DF', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
    </main>
  );
}
