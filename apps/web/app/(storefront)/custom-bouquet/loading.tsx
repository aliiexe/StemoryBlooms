import React from 'react';
import styles from './page.module.css';

export default function CustomBouquetLoading() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div style={{ height: '2.5rem', width: '300px', backgroundColor: '#EAE6DF', margin: '0 auto 1rem', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
        <div style={{ height: '1.25rem', width: '400px', backgroundColor: '#EAE6DF', margin: '0 auto', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
      </header>
      
      <div style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ height: '4rem', width: '100%', backgroundColor: '#EAE6DF', borderRadius: '12px', marginBottom: '2rem', animation: 'pulse 2s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
           {[1, 2, 3, 4].map((i) => (
             <div key={i} style={{ height: '80px', width: '100%', backgroundColor: '#EAE6DF', borderRadius: '12px', animation: 'pulse 2s infinite' }} />
           ))}
        </div>
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
