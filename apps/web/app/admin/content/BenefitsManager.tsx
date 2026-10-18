'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { giftCard, promoCode } from '@stemory/database';
import { GiftCardForm } from '../promotions/GiftCardForm';
import { PromoForm } from '../promotions/PromoForm';
import styles from '../dashboard.module.css';

export default function BenefitsManager({ promos, cards }: { promos: (typeof promoCode.$inferSelect)[]; cards: (typeof giftCard.$inferSelect)[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<{ kind: 'promo' | 'gift'; id?: string } | null>(null);
  const close = () => { setEditing(null); router.refresh(); };
  return <section className={styles.card} style={{ padding: '1.25rem' }}>
    <h2>Promotions and gift cards</h2>
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}><button type="button" className={styles.secondaryAction} onClick={() => setEditing({ kind: 'promo' })}>Create promo code</button><button type="button" className={styles.secondaryAction} onClick={() => setEditing({ kind: 'gift' })}>Issue gift card</button></div>
    {editing && <section style={{ maxWidth: 600, padding: '1rem', border: '1px solid #D6CFE6', borderRadius: 12, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h3>{editing.id ? 'Edit' : 'Create'} {editing.kind === 'promo' ? 'promotion' : 'gift card'}</h3><button type="button" className={styles.secondaryAction} onClick={() => setEditing(null)}>Close editor</button></div>
      {editing.kind === 'promo' ? <PromoForm key={editing.id || 'new-promo'} promo={promos.find(value => value.id === editing.id)} onSaved={close} /> : <GiftCardForm key={editing.id || 'new-gift'} card={cards.find(value => value.id === editing.id)} onSaved={close} />}
    </section>}
    <h3>Promo codes</h3><div className={styles.tableScroller}><table className={styles.table}><thead><tr><th>Code</th><th>Discount</th><th>Usage</th><th>Status</th><th>Manage</th></tr></thead><tbody>{promos.map(promo => <tr key={promo.id}><td>{promo.code}</td><td>{promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' MAD'}</td><td>{promo.usageCount} / {promo.usageLimit ?? 'Unlimited'}</td><td>{promo.isActive ? 'Active' : 'Disabled'}</td><td><button type="button" className={styles.secondaryAction} onClick={() => setEditing({ kind: 'promo', id: promo.id })}>Edit {promo.code}</button></td></tr>)}{!promos.length && <tr><td colSpan={5}>No promo codes yet.</td></tr>}</tbody></table></div>
    <h3>Gift cards</h3><div className={styles.tableScroller}><table className={styles.table}><thead><tr><th>Code</th><th>Remaining balance</th><th>Issued value</th><th>Status</th><th>Manage</th></tr></thead><tbody>{cards.map(card => <tr key={card.id}><td>{card.code}</td><td>{card.currentBalance} MAD</td><td>{card.initialBalance} MAD</td><td>{card.isActive ? 'Active' : 'Disabled'}</td><td><button type="button" className={styles.secondaryAction} onClick={() => setEditing({ kind: 'gift', id: card.id })}>Edit gift card</button></td></tr>)}{!cards.length && <tr><td colSpan={5}>No gift cards issued.</td></tr>}</tbody></table></div>
  </section>;
}
