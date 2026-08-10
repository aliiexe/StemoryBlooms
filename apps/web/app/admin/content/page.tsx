import React from 'react';
import { db, contentBlock, giftCard, promoCode } from '@stemory/database';
import { desc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { saveContentBlock } from './actions';
import { PromoForm } from '../promotions/PromoForm';
import { GiftCardForm } from '../promotions/GiftCardForm';

type ContentBlockPayload = {
  title?: string;
  type?: string;
  isActive?: boolean;
};

function formatBlockPreview(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }

  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return 'Unrenderable content';
  }
}

const contentBlockIdeas = [
  'Homepage hero copy and CTA text',
  'Announcement bar messages',
  'Delivery and care notes',
  'FAQ snippets and policy text',
  'Holiday or campaign banners',
];

export default async function AdminContentPage() {
  const blocks = await db.query.contentBlock.findMany({
    orderBy: [desc(contentBlock.createdAt)],
  });

  const promos = await db.query.promoCode.findMany({
    orderBy: [desc(promoCode.createdAt)],
  });

  const giftCards = await db.query.giftCard.findMany({
    orderBy: [desc(giftCard.createdAt)],
  });

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Marketing & Content</h1>
        <p style={{ maxWidth: '760px', margin: '0.75rem 0 0', color: '#5A5551', lineHeight: 1.6 }}>
          This page keeps reusable site content, promo codes, and gift cards in one place. Use it when you want to change homepage text, launch a campaign, or manage discount tools without hopping between duplicate menus.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start', marginBottom: '2rem' }}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Promo codes</h3>
          <PromoForm />
          <table className={styles.table} style={{ marginTop: '1.5rem' }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Value</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              {promos.map((promo) => (
                <tr key={promo.id}>
                  <td><strong>{promo.code}</strong></td>
                  <td>{promo.type === 'PERCENTAGE' ? `${promo.value}%` : `${promo.value} MAD`}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#5A5551', fontWeight: 500 }}>
                        {promo.usageLimit ? `${promo.usageCount} / ${promo.usageLimit}` : `${promo.usageCount} uses`}
                        {!promo.usageLimit && <span style={{ marginLeft: '6px', padding: '2px 6px', backgroundColor: '#E3F2FD', color: '#0D47A1', borderRadius: '4px', fontSize: '0.75rem' }}>No limit</span>}
                      </span>
                      {promo.usageLimit ? (
                        <div style={{ width: '100%', maxWidth: '120px', height: '6px', backgroundColor: '#F0EBE1', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(100, (promo.usageCount / promo.usageLimit) * 100)}%`, height: '100%', backgroundColor: 'var(--brand-primary)', borderRadius: '3px' }} />
                        </div>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {promos.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No promo codes yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Gift cards</h3>
          <GiftCardForm />
          <table className={styles.table} style={{ marginTop: '1.5rem' }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {giftCards.map((card) => (
                <tr key={card.id}>
                  <td><strong>{card.code}</strong></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#5A5551', fontWeight: 500 }}>
                        {card.currentBalance} / {card.initialBalance} MAD
                      </span>
                      <div style={{ width: '100%', maxWidth: '120px', height: '6px', backgroundColor: '#F0EBE1', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${Math.min(100, (card.currentBalance / Math.max(card.initialBalance, 1)) * 100)}%`, 
                          height: '100%', 
                          backgroundColor: (card.currentBalance / Math.max(card.initialBalance, 1)) < 0.2 ? '#D32F2F' : '#388E3C', 
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 600,
                      backgroundColor: card.isActive ? '#E8F5E9' : '#FCE4EC',
                      color: card.isActive ? '#1B5E20' : '#C2185B'
                    }}>
                      {card.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
              {giftCards.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No gift cards issued.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Content blocks</h3>
        <p style={{ marginTop: '-0.25rem', color: '#6B6660', lineHeight: 1.6 }}>
          Good content blocks are short, reusable, and easy to swap. Typical categories are:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {contentBlockIdeas.map((idea) => (
            <span key={idea} style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', backgroundColor: '#F6F1E8', color: '#4E473F', fontSize: '0.85rem', border: '1px solid #E7DDCF' }}>
              {idea}
            </span>
          ))}
        </div>

        <form action={async (formData) => { 'use server'; await saveContentBlock(formData); }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#3A3531' }}>Identifier</label>
            <input name="identifier" required placeholder="home_hero" style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#3A3531' }}>Title</label>
            <input name="title" placeholder="Homepage hero" style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#3A3531' }}>Type</label>
            <input name="type" placeholder="banner" style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#3A3531' }}>Status</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem', borderRadius: '10px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7' }}>
              <input type="checkbox" name="isActive" defaultChecked />
              Active
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#3A3531' }}>Content JSON or copy</label>
            <textarea name="content" rows={5} placeholder='{"headline":"Fresh blooms"}' style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1px solid #D6CFE6', backgroundColor: '#FDFBF7', resize: 'vertical' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className={styles.submitBtn} style={{ margin: 0 }}>Save content block</button>
          </div>
        </form>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block) => (
              <tr key={block.id}>
                <td><strong>{block.key}</strong></td>
                <td>{((block.content as ContentBlockPayload) ?? {}).title || 'Untitled'}</td>
                <td>{((block.content as ContentBlockPayload) ?? {}).type || '-'}</td>
                <td>{((block.content as ContentBlockPayload) ?? {}).isActive ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
            {blocks.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#7A7571' }}>No content blocks yet.</td>
              </tr>
            )}
          </tbody>
        </table>

        {blocks.length > 0 && (
          <div style={{ marginTop: '1.25rem', display: 'grid', gap: '1rem' }}>
            {blocks.map((block) => (
              <div key={block.id} style={{ padding: '1rem', borderRadius: '12px', border: '1px solid #EAE6DF', backgroundColor: '#FCFBF8' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'var(--brand-primary)' }}>{block.key}</strong>
                  <span style={{ color: '#7A7571', fontSize: '0.85rem' }}>{new Date(block.createdAt).toLocaleDateString()}</span>
                </div>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#5A5551', fontSize: '0.85rem', lineHeight: 1.6 }}>{formatBlockPreview(block.content)}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
