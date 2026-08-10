'use client';

import React from 'react';
import Image from 'next/image';
import { HeroSlideshow } from '../../components/ui/HeroSlideshow';
import styles from './landing.module.css';

export default function MaintenancePage({ heroImages = [], heroFadeSpeed = 5 }: { heroImages?: string[]; heroFadeSpeed?: number }) {
  return (
    <main className={styles.splitContainer}>
      <div className={styles.imageSide}>
        <HeroSlideshow 
          images={heroImages} 
          fadeSpeedSeconds={heroFadeSpeed} 
          priority 
        />
      </div>

      <div className={styles.contentSide}>
        <div className={styles.contentWrapper}>
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

          <div className={styles.footer} style={{ marginTop: '2rem' }}>
            <a href="https://instagram.com/stemory.blooms" target="_blank" rel="noreferrer" className={styles.link}>Instagram</a>
            <a href="https://tiktok.com/@stemory.blooms" target="_blank" rel="noreferrer" className={styles.link}>TikTok</a>
          </div>
        </div>
      </div>
    </main>
  );
}
