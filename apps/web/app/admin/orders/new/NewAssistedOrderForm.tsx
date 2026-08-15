'use client';

import React, { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAssistedOrder } from '../actions';
import CustomDropdown from '../../components/CustomDropdown';
import styles from '../../dashboard.module.css';
import { Plus, Minus, Search, Tag, ChevronDown, CheckCircle2, Image as ImageIcon, Phone, Store } from 'lucide-react';

const InstagramIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 448 512">
    <defs>
      <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <path fill="url(#ig-grad)" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
  </svg>
);

const TikTokIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 448 512">
    <path fill="#000000" d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
  </svg>
);

type Product = {
  id: string;
  name: string;
  basePrice: number;
  salePrice: number | null;
  image: string | null;
};

type BuilderComponent = {
  id: string;
  name: string;
  price: number;
  type: string;
  image: string | null;
};

type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
};

type OrderItemState = {
  id: string; // local id
  productId: string; // can be 'CUSTOM' or start with 'COMPONENT_'
  customName?: string;
  customPrice?: number;
  quantity: number;
};

function DeliveryZoneSelect({
  zones, value, onChange, disabled
}: {
  zones: DeliveryZone[];
  value: string;
  onChange: (zoneId: string) => void;
  disabled: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = zones.find(z => z.id === value);

  useEffect(() => {
    if (selected) setQuery(selected.name);
  }, [selected?.id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(selected?.name ?? '');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [selected]);

  const filtered = zones.filter(z => z.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          disabled={disabled}
          placeholder={disabled ? 'Loading...' : 'Search delivery zone...'}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={styles.input}
          style={{ width: '100%', paddingRight: '2rem' }}
        />
        <Search size={16} color="#9CA3AF" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
          border: '1px solid #E5E7EB', borderRadius: '4px', marginTop: '4px',
          maxHeight: '200px', overflowY: 'auto', zIndex: 10, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {filtered.length > 0 ? filtered.map(z => (
            <button
              key={z.id}
              type="button"
              onClick={() => {
                onChange(z.id);
                setQuery(z.name);
                setOpen(false);
              }}
              style={{
                display: 'flex', justifyContent: 'space-between', width: '100%',
                padding: '0.75rem 1rem', background: 'none', border: 'none',
                textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #F3F4F6'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span style={{ color: '#374151', fontWeight: 500 }}>{z.name}</span>
              <span style={{ color: '#6B7280' }}>+{z.fee} MAD</span>
            </button>
          )) : (
            <div style={{ padding: '0.75rem 1rem', color: '#6B7280', fontSize: '0.9rem' }}>No zones found.</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NewAssistedOrderForm({ 
  products, 
  components,
  deliveryZones 
}: { 
  products: Product[]; 
  components: BuilderComponent[];
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
  
  const [promoCode, setPromoCode] = useState('');
  const [showPromoInput, setShowPromoInput] = useState(false);
  
  const [isHandDelivered, setIsHandDelivered] = useState(false);
  const [items, setItems] = useState<OrderItemState[]>([
    { id: '1', productId: '', quantity: 1 }
  ]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('assistedOrderDraft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.source) setSource(parsed.source);
        if (parsed.isHandDelivered !== undefined) setIsHandDelivered(parsed.isHandDelivered);
        if (parsed.customerName) setCustomerName(parsed.customerName);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.city) setCity(parsed.city);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.deliveryZoneId) setDeliveryZoneId(parsed.deliveryZoneId);
        if (parsed.manualDiscount !== undefined) setManualDiscount(parsed.manualDiscount);
        if (parsed.promoCode) setPromoCode(parsed.promoCode);
        if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) setItems(parsed.items);
      }
    } catch (e) {
      console.log('Failed to load draft');
    }
  }, []);

  // Save draft on changes
  useEffect(() => {
    const draft = { source, isHandDelivered, customerName, phoneNumber, email, city, address, notes, deliveryZoneId, manualDiscount, promoCode, items };
    localStorage.setItem('assistedOrderDraft', JSON.stringify(draft));
  }, [source, isHandDelivered, customerName, phoneNumber, email, city, address, notes, deliveryZoneId, manualDiscount, promoCode, items]);

  const activeZone = deliveryZones.find(z => z.id === deliveryZoneId);
  const deliveryFee = (source === 'IN_PERSON' && isHandDelivered) ? 0 : (activeZone?.fee || 0);

  let subtotal = 0;
  items.forEach(item => {
    if (item.productId === 'CUSTOM') {
      subtotal += (item.customPrice || 0) * item.quantity;
    } else if (item.productId.startsWith('COMPONENT_')) {
      const compId = item.productId.replace('COMPONENT_', '');
      const c = components.find(comp => comp.id === compId);
      if (c) subtotal += c.price * item.quantity;
    } else if (item.productId) {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        subtotal += (p.salePrice ?? p.basePrice) * item.quantity;
      }
    }
  });

  const finalTotal = Math.max(0, subtotal - manualDiscount) + deliveryFee;

  // Build the combined list of products and custom elements
  const allDropdownOptions = [
    { value: 'CUSTOM', label: '-- Create Manual Custom Item --' },
    ...products.map(p => ({
      value: p.id,
      label: `${p.name} (${p.salePrice ?? p.basePrice} MAD)`,
      image: p.image
    })),
    ...components.map(c => ({
      value: `COMPONENT_${c.id}`,
      label: `[Element] ${c.name} (${c.price} MAD)`,
      image: c.image
    }))
  ];

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(), productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof OrderItemState, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const adjustDiscount = (amount: number) => {
    setManualDiscount(prev => Math.max(0, prev + amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.some(i => !i.productId || i.quantity < 1 || (i.productId === 'CUSTOM' && (!i.customName || (i.customPrice || 0) <= 0)))) {
      alert("Please ensure all items have a product (or Custom name/price) and a valid quantity.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          source,
          customerName,
          phoneNumber,
          email: email || undefined,
          city: (source === 'IN_PERSON' && isHandDelivered) ? 'In-Person' : city,
          address: (source === 'IN_PERSON' && isHandDelivered) ? '' : address,
          notes,
          deliveryZoneId: (source === 'IN_PERSON' && isHandDelivered) ? undefined : deliveryZoneId,
          manualDiscount,
          promoCode: promoCode || undefined,
          isHandDelivered: (source === 'IN_PERSON' && isHandDelivered),
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            customName: i.productId === 'CUSTOM' ? i.customName : undefined,
            customPrice: i.productId === 'CUSTOM' ? i.customPrice : undefined,
          }))
        };
        const result = await createAssistedOrder(payload);
        if (result?.success && result.orderNumber) {
          localStorage.removeItem('assistedOrderDraft');
          router.push(`/receipt/${result.orderNumber}`);
        } else {
          router.push('/admin/orders');
        }
      } catch (error: any) {
        alert(error.message || 'Failed to create order');
      }
    });
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <style>{`
        input[type="number"]::-webkit-inner-spin-button, 
        input[type="number"]::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        input[type="number"] { 
          -moz-appearance: textfield; 
        }
      `}</style>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Customer & Delivery */}
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', boxSizing: 'border-box' }}>
          
          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #EFEBE8', paddingBottom: '0.5rem', color: '#111827' }}>Order Source</h3>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Source *</label>
              <CustomDropdown
                value={source}
                onChange={setSource}
                options={[
                  { value: 'INSTAGRAM', label: 'Instagram', icon: <InstagramIcon size={14} /> },
                  { value: 'TIKTOK', label: 'TikTok', icon: <TikTokIcon size={14} /> },
                  { value: 'PHONE', label: 'Phone / WhatsApp', icon: <Phone size={14} /> },
                  { value: 'IN_PERSON', label: 'In Person', icon: <Store size={14} /> }
                ]}
              />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #EFEBE8', paddingBottom: '0.5rem', color: '#111827' }}>Customer Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Full Name *</label>
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} required placeholder="e.g. Imane F." className={styles.input} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Phone Number *</label>
                <input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="e.g. 06 98 76 54 32" className={styles.input} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Email Address (Optional)</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="customer@example.com" className={styles.input} />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid #EFEBE8', paddingBottom: '0.5rem', color: '#111827' }}>Delivery Information</h3>
            
            {source === 'IN_PERSON' && (
              <div 
                style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setIsHandDelivered(!isHandDelivered)}
              >
                <div style={{
                  width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${isHandDelivered ? '#1B5E20' : '#D1D5DB'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', background: isHandDelivered ? '#1B5E20' : '#FFF',
                  transition: 'all 0.2s'
                }}>
                  {isHandDelivered && <CheckCircle2 size={14} color="#FFF" style={{ strokeWidth: 3 }} />}
                </div>
                <span style={{ fontSize: '0.95rem', color: '#111827', fontWeight: 500 }}>
                  I have the product and will deliver it by hand (No delivery fee)
                </span>
              </div>
            )}

            {!(source === 'IN_PERSON' && isHandDelivered) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>City *</label>
                  <input value={city} onChange={e => setCity(e.target.value)} required placeholder="e.g. Casablanca" className={styles.input} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Delivery Zone *</label>
                  <DeliveryZoneSelect 
                    zones={deliveryZones} 
                    value={deliveryZoneId} 
                    onChange={setDeliveryZoneId} 
                    disabled={false}
                  />
                </div>
              </div>
            )}
            
            {!(source === 'IN_PERSON' && isHandDelivered) && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Address Line 1 *</label>
                <input value={address} onChange={e => setAddress(e.target.value)} required placeholder="Full street address..." className={styles.input} />
                <p style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '4px' }}>Phone number will be auto-appended to the address on the receipt.</p>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#374151', fontWeight: 500 }}>Customizations & Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Customer preferences, card message, etc..." className={styles.input}></textarea>
          </div>
        </div>

        {/* RIGHT COLUMN: Items & Pricing */}
        <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
          
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid #EFEBE8', paddingBottom: '0.5rem', color: '#111827' }}>Order Items</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {items.map((item, index) => (
              <div key={item.id} style={{ background: '#F9FAFB', padding: '1rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: item.productId === 'CUSTOM' ? '1rem' : 0, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>Product / Element</label>
                    <CustomDropdown
                      value={item.productId}
                      onChange={val => handleItemChange(item.id, 'productId', val)}
                      placeholder="Select a product or custom element..."
                      options={allDropdownOptions}
                    />
                  </div>
                  <div style={{ width: '80px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>Qty</label>
                    <input type="number" min="1" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)} required className={styles.input} />
                  </div>
                  {items.length > 1 && (
                    <button type="button" onClick={() => handleRemoveItem(item.id)} style={{ padding: '0.75rem', background: '#FEE2E2', color: '#B91C1C', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                      Remove
                    </button>
                  )}
                </div>

                {item.productId === 'CUSTOM' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>Custom Item Name *</label>
                      <input type="text" value={item.customName || ''} onChange={e => handleItemChange(item.id, 'customName', e.target.value)} required placeholder="e.g. Extra large pink bouquet" className={styles.input} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4B5563', fontWeight: 500 }}>Unit Price (MAD) *</label>
                      <input type="number" min="1" value={item.customPrice || ''} onChange={e => handleItemChange(item.id, 'customPrice', parseInt(e.target.value) || 0)} required placeholder="350" className={styles.input} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button type="button" onClick={handleAddItem} style={{ marginBottom: '2rem', padding: '0.75rem', background: '#FFF', color: '#374151', border: '1px dashed #9CA3AF', borderRadius: '4px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <Plus size={16} /> Add Another Item
          </button>

          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', borderBottom: '1px solid #EFEBE8', paddingBottom: '0.5rem', color: '#111827' }}>Pricing</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#4B5563' }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>{subtotal} MAD</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#4B5563' }}>
              <span>Delivery Fee ({activeZone?.name || 'Select Zone'}):</span>
              <span style={{ fontWeight: 600 }}>+{deliveryFee} MAD</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1rem', color: '#4B5563' }}>Manual Discount:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: '4px', overflow: 'hidden' }}>
                <button type="button" onClick={() => adjustDiscount(-10)} style={{ padding: '0.5rem', background: '#F3F4F6', border: 'none', borderRight: '1px solid #D1D5DB', cursor: 'pointer' }}><Minus size={14} /></button>
                <input 
                  type="number" 
                  min="0" 
                  value={manualDiscount || ''} 
                  onChange={e => setManualDiscount(parseInt(e.target.value) || 0)} 
                  className={styles.input} 
                  style={{ width: '80px', border: 'none', borderRadius: 0, textAlign: 'center', margin: 0, padding: '0.5rem' }} 
                />
                <button type="button" onClick={() => adjustDiscount(10)} style={{ padding: '0.5rem', background: '#F3F4F6', border: 'none', borderLeft: '1px solid #D1D5DB', cursor: 'pointer' }}><Plus size={14} /></button>
              </div>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setShowPromoInput(!showPromoInput)}
                style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', padding: 0 }}
              >
                <Tag size={14} /> {showPromoInput ? 'Cancel Promo Code' : 'Add Promo Code'}
              </button>
              
              {showPromoInput && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <input 
                    type="text" 
                    value={promoCode} 
                    onChange={e => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter code..." 
                    className={styles.input} 
                    style={{ flex: 1 }}
                  />
                  <span style={{ alignSelf: 'center', fontSize: '0.8rem', color: '#6B7280' }}>* Validated on save</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #E5E7EB', paddingTop: '1.5rem', marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
              <span>Final Total:</span>
              <span>{finalTotal} MAD</span>
            </div>
          </div>

          <button type="submit" disabled={isPending} className={styles.submitBtn} style={{ width: '100%', fontSize: '1.1rem', padding: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
            {isPending ? 'Processing...' : <><CheckCircle2 size={20} /> Create Assisted Order & Receipt</>}
          </button>

        </div>
      </form>
    </div>
  );
}
