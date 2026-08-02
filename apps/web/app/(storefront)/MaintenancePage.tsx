'use client';

import React from 'react';
import Image from 'next/image';
import styles from './landing.module.css';

export default function MaintenancePage() {
  return (
    <main className={styles.container}>
      <div className={styles.background}>
        <div className={`${styles.blob} ${styles.blob1}`} />
        <div className={`${styles.blob} ${styles.blob2}`} />
        <div className={`${styles.blob} ${styles.blob3}`} />
      </div>

      <div className={styles.glassCard}>
        <div className={styles.logo}>
          <Image src="/logoSB.png" alt="Stemory Blooms" width={220} height={48} priority style={{ objectFit: 'contain' }} />
        </div>
        
        <h1 className={styles.title}>
          We'll be right back.
        </h1>
        
        <p className={styles.subtitle}>
          We're currently making some beautiful updates to our store to serve you better. 
          Please check back shortly. Thank you for your patience!
        </p>

        <div className={styles.footer}>
          <a href="https://instagram.com/stemory.blooms" target="_blank" rel="noreferrer" className={styles.link}>Instagram</a>
          <a href="https://tiktok.com/@stemoryblooms" target="_blank" rel="noreferrer" className={styles.link}>TikTok</a>
        </div>
      </div>
    </main>
  );
}
