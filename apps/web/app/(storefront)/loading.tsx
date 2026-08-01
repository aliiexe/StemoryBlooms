import React from 'react';
import styles from './page.module.css';

export default function HomeLoading() {
  return (
    <main className={styles.main}>
      <section className={styles.hero} style={{ backgroundColor: '#F5F3EF' }}>
        <div className={styles.heroContent} style={{ animation: 'pulse 2s infinite' }}>
          <div style={{ height: '1rem', width: '150px', backgroundColor: '#EAE6DF', marginBottom: '1.5rem', borderRadius: '4px' }} />
          <div style={{ height: '3.5rem', width: '80%', backgroundColor: '#EAE6DF', marginBottom: '1.5rem', borderRadius: '8px' }} />
          <div style={{ height: '3.5rem', width: '60%', backgroundColor: '#EAE6DF', marginBottom: '2rem', borderRadius: '8px' }} />
          <div style={{ height: '1.5rem', width: '90%', backgroundColor: '#EAE6DF', marginBottom: '0.5rem', borderRadius: '4px' }} />
          <div style={{ height: '1.5rem', width: '70%', backgroundColor: '#EAE6DF', marginBottom: '2.5rem', borderRadius: '4px' }} />
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ height: '3rem', width: '150px', backgroundColor: '#EAE6DF', borderRadius: '30px' }} />
            <div style={{ height: '3rem', width: '150px', backgroundColor: '#EAE6DF', borderRadius: '30px' }} />
          </div>
        </div>
        <div className={styles.heroImageWrapper} style={{ animation: 'pulse 2s infinite', backgroundColor: '#EAE6DF', borderRadius: '24px' }} />
      </section>
      
      <section className={styles.featured}>
        <div className={styles.featuredHeader}>
          <div style={{ height: '2rem', width: '200px', backgroundColor: '#EAE6DF', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
        </div>
        <div className={styles.productGrid}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ width: '100%', aspectRatio: '3/4', backgroundColor: '#EAE6DF', borderRadius: '8px', animation: 'pulse 2s infinite' }} />
              <div style={{ height: '1.25rem', width: '70%', backgroundColor: '#EAE6DF', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
              <div style={{ height: '1rem', width: '40%', backgroundColor: '#EAE6DF', borderRadius: '4px', animation: 'pulse 2s infinite' }} />
            </div>
          ))}
        </div>
      </section>
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
