'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createAssistedOrder } from '../actions';
import styles from '../../dashboard.module.css';

type Product = {
  id: string;
  name: string;
  basePrice: number;
  salePrice: number | null;
};

type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
};

export default function NewAssistedOrderForm({ 
  products, 
  deliveryZones 
}: { 
  products: Product[]; 
  deliveryZones: DeliveryZone[]; 
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [source, setSource] = useState('INSTAGRAM');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryZoneId, setDeliveryZoneId] = useState(deliveryZones[0]?.id || '');
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 }
  ]);

  const activeZone = deliveryZones.find(z => z.id === deliveryZoneId);
  const deliveryFee = activeZone?.fee || 0;

  let subtotal = 0;
  items.forEach(item => {
    if (item.productId) {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        subtotal += (p.salePrice ?? p.basePrice) * item.quantity;
      }
    }
  });

  const finalTotal = Math.max(0, subtotal - manualDiscount) + deliveryFee;

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.some(i => !i.productId || i.quantity < 1)) {
      alert("Please ensure all items have a product selected and a valid quantity.");
      return;
    }

    startTransition(async () => {
      try {
        await createAssistedOrder({
          source,
          customerName,
          phoneNumber,
          email,
          city,
          address,
          notes,
          deliveryZoneId,
          manualDiscount,
          items
        });
        router.push('/admin/orders');
      } catch (error: any) {
        alert(error.message || 'Failed to create order');
      }
    });
  };

  return (
    <div className={styles.card} style={{ maxWidth: '800px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 600 }}>Source *</label>
            <select value={source} onChange={e => setSource(e.target.value)} required className={styles.input}>
              <option value="INSTAGRAM">Instagram</option>
              <option value="TIKTOK">TikTok</option>
              <option value="PHONE">Phone / WhatsApp</option>
              <option value="IN_PERSON">In Person</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 600 }}>Customer Name *</label>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="e.g. Imane F." className={styles.input} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 600 }}>Phone Number *</label>
            <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="e.g. 06 98 76 54 32" className={styles.input} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 600 }}>Email Address (Optional)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" className={styles.input} />
          </div>
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #EFEBE8', paddingBottom: '0.5rem' }}>Delivery Information</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 600 }}>City *</label>
            <input value={city} onChange={e => setCity(e.target.value)} required placeholder="e.g. Casablanca" className={styles.input} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 600 }}>Delivery Zone *</label>
            <select value={deliveryZoneId} onChange={e => setDeliveryZoneId(e.target.value)} required className={styles.input}>
              {deliveryZones.map(z => (
                <option key={z.id} value={z.id}>{z.name} (+{z.fee} MAD)</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 600 }}>Address Line 1 *</label>
            <input value={address} onChange={e => setAddress(e.target.value)} required placeholder="Full street address..." className={styles.input} />
        </div>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #EFEBE8', paddingBottom: '0.5rem' }}>Order Items</h3>
        
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551' }}>Product</label>
              <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} required className={styles.input}>
                <option value="">Select a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.salePrice ?? p.basePrice} MAD)</option>
                ))}
              </select>
            </div>
            <div style={{ width: '100px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551' }}>Qty</label>
              <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} required className={styles.input} />
            </div>
            {items.length > 1 && (
              <button type="button" onClick={() => handleRemoveItem(index)} style={{ padding: '0.75rem 1rem', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                Remove
              </button>
            )}
          </div>
        ))}
        
        <button type="button" onClick={handleAddItem} style={{ marginBottom: '2rem', padding: '0.5rem 1rem', background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>
          + Add Another Product
        </button>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#5A5551', fontWeight: 600 }}>Customizations & Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Customer preferences, card message, etc..." className={styles.input}></textarea>
        </div>

        <div style={{ background: '#F9FAFB', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#6B7280' }}>Subtotal:</span>
            <span style={{ fontWeight: 500 }}>{subtotal} MAD</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: '#6B7280' }}>Delivery ({activeZone?.name || 'None'}):</span>
            <span style={{ fontWeight: 500 }}>+{deliveryFee} MAD</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: '#6B7280' }}>Manual Discount:</span>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5rem' }}>-</span>
              <input type="number" min="0" max={subtotal} value={manualDiscount} onChange={e => setManualDiscount(parseInt(e.target.value) || 0)} className={styles.input} style={{ width: '100px', padding: '0.25rem 0.5rem', textAlign: 'right' }} />
              <span style={{ marginLeft: '0.5rem' }}>MAD</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #D1D5DB', paddingTop: '1rem', marginTop: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>
            <span>Final Total:</span>
            <span style={{ color: '#1B5E20' }}>{finalTotal} MAD</span>
          </div>
        </div>

        <button type="submit" disabled={isPending} className={styles.submitBtn} style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
          {isPending ? 'Processing...' : 'Create Assisted Order'}
        </button>
      </form>
    </div>
  );
}
