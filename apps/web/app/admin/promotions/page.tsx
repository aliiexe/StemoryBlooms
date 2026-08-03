import React from 'react';
import { prisma } from '@stemory/database';
import styles from '../dashboard.module.css';
import { PromoForm } from './PromoForm';
import { GiftCardForm } from './GiftCardForm';

export default async function AdminPromotionsPage() {
  const promoCodes = await prisma.promoCode.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const giftCards = await prisma.giftCard.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Promotions & Gift Cards</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Promo Codes Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className={styles.card}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem' }}>Promo Codes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {promoCodes.map((p) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #EAE6DF', borderRadius: '12px', backgroundColor: p.isActive ? '#FFFFFF' : '#F9F9F9', opacity: p.isActive ? 1 : 0.6 }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--brand-primary)' }}>{p.code}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#7A7571', marginTop: '0.25rem' }}>
                      {p.type === 'PERCENTAGE' ? `${p.value}% OFF` : `${p.value} MAD OFF`} 
                      {p.usageLimit ? ` • ${p.usageCount} / ${p.usageLimit} uses` : ` • ${p.usageCount} uses`}
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#9A9591', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                </div>
              ))}
              {promoCodes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#7A7571', border: '1px dashed #D6CFE6', borderRadius: '12px' }}>
                  No promo codes yet.
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem' }}>Create Promo Code</h3>
            <PromoForm />
          </div>
        </div>

        {/* Gift Cards Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className={styles.card}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem' }}>Gift Cards</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {giftCards.map((g) => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #EAE6DF', borderRadius: '12px', backgroundColor: g.isActive ? '#FFFFFF' : '#F9F9F9', opacity: g.isActive ? 1 : 0.6 }}>
                  <div>
                    <strong style={{ fontSize: '1.1rem', color: '#3A3531' }}>{g.code}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#7A7571', marginTop: '0.25rem' }}>
                      Balance: <span style={{ color: g.currentBalance > 0 ? '#2E7D32' : '#C62828', fontWeight: 600 }}>{g.currentBalance} MAD</span> / {g.initialBalance} MAD
                    </div>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#9A9591', cursor: 'pointer', textDecoration: 'underline' }}>Edit</button>
                </div>
              ))}
              {giftCards.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#7A7571', border: '1px dashed #D6CFE6', borderRadius: '12px' }}>
                  No gift cards issued.
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#3A3531', fontSize: '1.25rem' }}>Issue Gift Card</h3>
            <GiftCardForm />
          </div>
        </div>

      </div>
    </div>
  );
}
