'use client';

import React from 'react';
import Image from 'next/image';
import styles from './page.module.css';

export default function MaintenancePage() {
  return (
    <main className={styles.main} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--brand-primary)' }}>
      <div style={{ backgroundColor: 'var(--surface-primary)', padding: '4rem 3rem', borderRadius: '24px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Image src="/logoSB.png" alt="Stemory Blooms" width={180} height={40} style={{ margin: '0 auto' }} />
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '1rem', lineHeight: 1.2 }}>
          We'll be right back.
        </h1>
        
        <p style={{ color: '#7A7571', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          We're currently making some updates to our store to serve you better. Please check back soon!
        </p>

        <div style={{ marginTop: '3rem', borderTop: '1px solid #EAE6DF', paddingTop: '1.5rem' }}>
          <a href="https://instagram.com/stemory.blooms" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.9rem', marginRight: '1rem' }}>Instagram</a>
          <a href="https://tiktok.com/@stemoryblooms" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>TikTok</a>
        </div>
      </div>
    </main>
  );
}
