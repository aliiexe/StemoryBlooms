'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './page.module.css';
import { joinWaitlist } from './actions';

export default function WaitlistPage() {
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
    <main className={styles.main} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--brand-primary)' }}>
      <div style={{ backgroundColor: 'var(--surface-primary)', padding: '4rem 3rem', borderRadius: '24px', maxWidth: '500px', width: '90%', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Image src="/logoSB.png" alt="Stemory Blooms" width={180} height={40} style={{ margin: '0 auto' }} />
        </div>
        
        <h1 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2.5rem', color: 'var(--brand-primary)', marginBottom: '1rem', lineHeight: 1.2 }}>
          Something beautiful is blooming.
        </h1>
        
        <p style={{ color: '#7A7571', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          We are preparing to launch our collection of luxury, handcrafted everlasting pipe-cleaner bouquets. 
          Join the exclusive waitlist to be the first to know when we open our doors in Morocco.
        </p>

        {submitted ? (
          <div style={{ backgroundColor: '#E8F5E9', padding: '1.5rem', borderRadius: '12px', color: '#1B5E20' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>You're on the list! ✨</h3>
            <p style={{ fontSize: '0.9rem' }}>Keep an eye on your inbox. We'll email you the moment we launch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', textAlign: 'left' }}>
                {error}
              </div>
            )}
            <input 
              type="email" 
              placeholder="Enter your email address" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #D6CFE6', fontSize: '1rem', outline: 'none' }}
            />
            <button 
              type="submit" 
              disabled={isPending}
              style={{ padding: '1rem', backgroundColor: 'var(--brand-primary)', color: 'var(--surface-primary)', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 500, cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}
            >
              {isPending ? 'Joining...' : 'Join the Waitlist'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '3rem', borderTop: '1px solid #EAE6DF', paddingTop: '1.5rem' }}>
          <a href="https://instagram.com/stemory.blooms" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.9rem', marginRight: '1rem' }}>Instagram</a>
          <a href="https://tiktok.com/@stemoryblooms" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontSize: '0.9rem' }}>TikTok</a>
        </div>
      </div>
    </main>
  );
}
