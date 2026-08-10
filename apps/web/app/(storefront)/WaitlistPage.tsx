'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { HeroSlideshow } from '../../components/ui/HeroSlideshow';
import { joinWaitlist } from './actions';
import styles from './landing.module.css';

export default function WaitlistPage({ heroImages = [], heroFadeSpeed = 5 }: { heroImages?: string[]; heroFadeSpeed?: number }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsPending(true);
    setError(null);
    
    const res = await joinWaitlist(email);
    
    if (res.error) {
      setError(res.error);
    } else {
      setSubmitted(true);
    }
    setIsPending(false);
  };

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
            Something beautiful is blooming.
          </h1>
          
          <p className={styles.subtitle}>
            We are preparing to launch our collection of luxury, handcrafted everlasting pipe-cleaner bouquets. 
            Join the exclusive waitlist to be the first to know when we open our doors in Morocco.
          </p>

          {submitted ? (
            <div className={styles.successMessage}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontFamily: 'var(--font-editorial)', fontWeight: 500 }}>You're on the list.</h3>
              <p style={{ fontSize: '0.95rem', opacity: 0.9 }}>Keep an eye on your inbox. We'll email you the moment we launch.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              {error && (
                <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '1rem', fontSize: '0.9rem', textAlign: 'left', borderLeft: '3px solid #C62828' }}>
                  {error}
                </div>
              )}
              <div className={styles.inputWrapper}>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className={styles.input}
                />
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className={styles.button}
              >
                {isPending ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          )}

          <div className={styles.footer}>
            <a href="https://instagram.com/stemory.blooms" target="_blank" rel="noreferrer" className={styles.link}>Instagram</a>
            <a href="https://tiktok.com/@stemory.blooms" target="_blank" rel="noreferrer" className={styles.link}>TikTok</a>
          </div>
        </div>
      </div>
    </main>
  );
}
