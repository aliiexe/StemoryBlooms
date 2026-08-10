'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutPayloadSchema, CheckoutPayload } from '@stemory/contracts';
import { useCartStore } from '@stemory/ui';
import styles from './page.module.css';

const STORAGE_KEY = 'checkout_form_draft';

type DraftFields = Pick<CheckoutPayload, 'customerName' | 'email' | 'phoneNumber' | 'address' | 'deliveryInstructions' | 'deliveryCompanyId' | 'city'>;

type DeliveryZoneOption = {
  id: string;
  name: string;
  fee: number;
  deliveryTime: string | null;
};

// ── Custom searchable city picker ──────────────────────────────────────────
function CitySelect({
  zones, value, onChange, hasError, disabled,
}: {
  zones: DeliveryZoneOption[];
  value: string;
  onChange: (zone: DeliveryZoneOption) => void;
  hasError: boolean;
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
        // reset query to selected name if user typed but didn't pick
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
          placeholder={disabled ? 'Loading cities…' : 'Search city…'}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          style={{
            width: '100%', padding: '12px 2.5rem 12px 1rem',
            border: `1px solid ${hasError ? '#ff4d4f' : open ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-primary)',
            fontSize: '1rem', background: 'var(--bg-primary)', boxSizing: 'border-box',
            boxShadow: open ? '0 0 0 2px rgba(111,126,89,0.1)' : 'none', outline: 'none',
          }}
        />
        <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#9A9591', fontSize: '0.75rem' }}>
          {open ? '▲' : '▼'}
        </span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          zIndex: 50, maxHeight: '220px', overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '0.75rem 1rem', color: '#9A9591', fontSize: '0.9rem' }}>No cities found</div>
          ) : filtered.map(z => (
            <div
              key={z.id}
              onMouseDown={() => { onChange(z); setQuery(z.name); setOpen(false); }}
              style={{
                padding: '0.75rem 1rem', cursor: 'pointer', fontSize: '0.95rem',
                background: z.id === value ? 'rgba(111,126,89,0.08)' : 'transparent',
                color: z.id === value ? 'var(--brand-primary)' : 'var(--text-primary)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(111,126,89,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = z.id === value ? 'rgba(111,126,89,0.08)' : 'transparent')}
            >
              <span>{z.name}</span>
              <span style={{ fontSize: '0.8rem', color: '#9A9591' }}>{z.fee} MAD</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Custom payment method picker ───────────────────────────────────────────
const PAYMENT_OPTIONS = [
  { value: 'COD', label: 'Cash on Delivery', description: 'Pay when you receive your order', icon: '💵' },
];

function PaymentSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {PAYMENT_OPTIONS.map(opt => {
        const selected = value === opt.value;
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: '1rem',
              padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              border: `2px solid ${selected ? 'var(--brand-primary)' : 'var(--border-subtle)'}`,
              background: selected ? 'rgba(111,126,89,0.05)' : 'var(--bg-primary)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${selected ? 'var(--brand-primary)' : '#C4BCAF'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selected && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--brand-primary)' }} />}
            </div>
            <span style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{opt.label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZoneOption[]>([]);
  const [promoInput, setPromoInput] = useState('');
  const [giftInput, setGiftInput] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [giftDiscount, setGiftDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [giftStatus, setGiftStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [applyingGift, setApplyingGift] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');

  const defaultDeliveryZone = deliveryZones[0] ?? null;

  const draftRef = useRef<DraftFields>((() => {
    if (typeof window === 'undefined') return {} as DraftFields;
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {} as DraftFields; }
  })());
  const draft = draftRef.current;

  const { register, handleSubmit, setValue, control, watch, trigger, formState: { errors, isValid } } = useForm<CheckoutPayload>({
    resolver: zodResolver(CheckoutPayloadSchema),
    mode: 'onChange',
    defaultValues: {
      customerName: draft.customerName || '',
      email: draft.email || '',
      phoneNumber: draft.phoneNumber || '',
      city: draft.city || '',
      address: draft.address || '',
      deliveryInstructions: draft.deliveryInstructions || '',
      deliveryCompanyId: draft.deliveryCompanyId || '',
      cartItems: items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        configuration: item.configuration
      })),
      termsAccepted: false as unknown as true,
      deliveryPolicyAccepted: false as unknown as true,
      privacyNoticeAccepted: false as unknown as true,
      codConditionsAccepted: false as unknown as true,
    }
  });

  const watchedFields = watch(['customerName', 'email', 'phoneNumber', 'city', 'address', 'deliveryInstructions', 'deliveryCompanyId']);

  useEffect(() => {
    const [customerName, email, phoneNumber, city, address, deliveryInstructions, deliveryCompanyId] = watchedFields;
    const toPersist: DraftFields = { customerName, email, phoneNumber, city, address, deliveryInstructions, deliveryCompanyId };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist)); } catch {}
  }, [watchedFields]);

  const termsAccepted = watch("termsAccepted");
  const deliveryPolicyAccepted = watch("deliveryPolicyAccepted");
  const privacyNoticeAccepted = watch("privacyNoticeAccepted");
  const codConditionsAccepted = watch("codConditionsAccepted");

  const allAccepted = termsAccepted && deliveryPolicyAccepted && privacyNoticeAccepted && codConditionsAccepted;

  const handleAcceptAll = () => {
    const newValue = !allAccepted;
    setValue("termsAccepted", newValue as true, { shouldValidate: true });
    setValue("deliveryPolicyAccepted", newValue as true, { shouldValidate: true });
    setValue("privacyNoticeAccepted", newValue as true, { shouldValidate: true });
    setValue("codConditionsAccepted", newValue as true, { shouldValidate: true });
  };

  // Re-sync cartItems after cart store hydrates on the client
  useEffect(() => {
    if (items.length > 0) {
      setValue('cartItems', items.map(item => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        configuration: item.configuration
      })), { shouldValidate: true });
    }
  }, [items]);

  useEffect(() => {
    let isMounted = true;

    const loadDeliveryZones = async () => {
      try {
        const response = await fetch('/api/v1/delivery-zones');
        const data = await response.json();
        if (!isMounted) return;

        const zones = Array.isArray(data.zones) ? data.zones.sort((a: any, b: any) => a.name.localeCompare(b.name)) : [];
        setDeliveryZones(zones);

        // Restore saved city/zone selection after zones load
        const savedDraftCompanyId = (draftRef.current as DraftFields).deliveryCompanyId;
        if (savedDraftCompanyId) {
          const savedZone = zones.find((z: DeliveryZoneOption) => z.id === savedDraftCompanyId);
          if (savedZone) {
            setValue('deliveryCompanyId', savedZone.id, { shouldValidate: true });
            setValue('city', savedZone.name, { shouldValidate: true });
          }
        }
      } catch {
        if (!isMounted) return;
        setDeliveryZones([]);
      }
    };

    loadDeliveryZones();

    return () => {
      isMounted = false;
    };
  }, []);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const selectedDeliveryZoneId = useWatch({ control, name: 'deliveryCompanyId' });
  const selectedDeliveryZone = deliveryZones.find((zone) => zone.id === selectedDeliveryZoneId);
  const deliveryFee = selectedDeliveryZone?.fee ?? 0;
  const totalDiscount = promoDiscount + giftDiscount;
  const total = Math.max(0, subtotal - totalDiscount) + deliveryFee;

  const applyCode = async (type: 'promo' | 'giftCard', code: string) => {
    if (!code) return;
    if (type === 'promo') setApplyingPromo(true); else setApplyingGift(true);
    try {
      const res = await fetch('/api/v1/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type, subtotal })
      });
      const data = await res.json();
      if (!res.ok) {
        if (type === 'promo') { setPromoStatus({ ok: false, msg: data.message }); setPromoDiscount(0); }
        else { setGiftStatus({ ok: false, msg: data.message }); setGiftDiscount(0); }
      } else {
        if (type === 'promo') {
          setValue('promoCode', code, { shouldValidate: true });
          setPromoDiscount(data.discountAmount);
          setPromoStatus({ ok: true, msg: data.message });
        } else {
          setValue('giftCardCode', code, { shouldValidate: true });
          setGiftDiscount(data.discountAmount);
          setGiftStatus({ ok: true, msg: data.message });
        }
      }
    } catch {
      const status = { ok: false, msg: 'Failed to validate code' };
      if (type === 'promo') setPromoStatus(status); else setGiftStatus(status);
    } finally {
      if (type === 'promo') setApplyingPromo(false); else setApplyingGift(false);
    }
  };

  const onSubmit = async (data: CheckoutPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const idempotencyKey = `checkout-${globalThis.crypto.randomUUID()}`;
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(data)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || 'Failed to place order');
      }

      clearCart();
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      router.push(`/checkout/success?order=${result.orderNumber}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <h2>Your cart is empty</h2>
        <button onClick={() => router.push('/shop')} className={styles.backBtn}>Continue Shopping</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.checkoutHeader}>
        <button onClick={() => router.back()} className={styles.backLink}>&larr; Checkout</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={styles.formLayout}>
        <div className={styles.mainColumn}>
          <section className={styles.section}>
            <h3>Contact</h3>
            <div className={styles.fieldGroup}>
              <label htmlFor="customerName">Full name</label>
              <input 
                id="customerName"
                autoComplete="name"
                {...register("customerName")}
                placeholder="Ali Bourak"
                className={errors.customerName ? styles.inputError : ''}
              />
              {errors.customerName && <span className={styles.errorText}>{errors.customerName.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="email">Email</label>
              <input 
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                placeholder="ali@example.com"
                className={errors.email ? styles.inputError : ''}
              />
              {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="phoneNumber">Phone number</label>
              <input 
                id="phoneNumber"
                type="tel"
                autoComplete="tel"
                {...register("phoneNumber")}
                placeholder="06 12 34 56 78"
                className={errors.phoneNumber ? styles.inputError : ''}
              />
              {errors.phoneNumber && <span className={styles.errorText}>{errors.phoneNumber.message}</span>}
            </div>
          </section>

          <section className={styles.section}>
            <h3>Delivery Address</h3>
            <div className={styles.fieldGroup}>
              <label>City / Delivery Zone</label>
              <CitySelect
                zones={deliveryZones}
                value={selectedDeliveryZoneId ?? ''}
                onChange={(zone) => {
                  setValue('deliveryCompanyId', zone.id, { shouldValidate: true });
                  setValue('city', zone.name, { shouldValidate: true });
                }}
                hasError={!!(errors.city || errors.deliveryCompanyId)}
                disabled={deliveryZones.length === 0}
              />
              {(errors.city || errors.deliveryCompanyId) && <span className={styles.errorText}>Please select a valid city</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="address">Address</label>
              <input 
                id="address"
                autoComplete="street-address"
                {...register("address")}
                placeholder="123, Maarif, Casablanca"
                className={errors.address ? styles.inputError : ''}
              />
              {errors.address && <span className={styles.errorText}>{errors.address.message}</span>}
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="deliveryInstructions">Notes to rider (optional)</label>
              <input 
                id="deliveryInstructions"
                {...register("deliveryInstructions")}
                placeholder="Building B, second floor"
              />
            </div>
          </section>

          <section className={styles.section}>
            <h3>Payment Method</h3>
            <PaymentSelect value={paymentMethod} onChange={setPaymentMethod} />
          </section>

          <section className={styles.section}>
            <h3>Terms and Conditions</h3>
            <div 
              onClick={handleAcceptAll}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#F8F6F2', borderRadius: '12px', cursor: 'pointer', marginBottom: '1.5rem', border: '1px solid #EAE6DF' }}
            >
              <div style={{ width: '22px', height: '22px', borderRadius: '6px', border: allAccepted ? 'none' : '2px solid #C4BCAF', background: allAccepted ? '#3A3531' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {allAccepted && <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <strong style={{ color: '#3A3531' }}>Accept all terms and policies</strong>
            </div>

            {[
              { id: "termsAccepted", label: "I accept the Terms and Conditions", value: termsAccepted, err: errors.termsAccepted },
              { id: "deliveryPolicyAccepted", label: "I accept the Delivery Policy", value: deliveryPolicyAccepted, err: errors.deliveryPolicyAccepted },
              { id: "privacyNoticeAccepted", label: "I accept the Privacy Notice", value: privacyNoticeAccepted, err: errors.privacyNoticeAccepted },
              { id: "codConditionsAccepted", label: "I accept the Cash on Delivery Conditions", value: codConditionsAccepted, err: errors.codConditionsAccepted }
            ].map(term => (
              <div key={term.id} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input type="checkbox" id={term.id} {...register(term.id as any)} style={{ display: 'none' }} />
                  <div style={{ width: '20px', height: '20px', borderRadius: '5px', border: term.value ? 'none' : '2px solid #C4BCAF', background: term.value ? '#3A3531' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {term.value && <svg width="12" height="9" viewBox="0 0 14 10" fill="none"><path d="M1 5L5 9L13 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </div>
                  <span style={{ color: '#5A5551', fontSize: '0.95rem' }}>{term.label}</span>
                </label>
                {term.err && <span className={styles.errorText} style={{ display: 'block', marginLeft: '2rem', marginTop: '0.25rem' }}>{term.err.message}</span>}
              </div>
            ))}
          </section>
        </div>

        <div className={styles.sidebarColumn}>
          <div className={styles.summaryCard}>
            <h3>Order Summary</h3>
            <div className={styles.summaryItems}>
              {items.map(item => (
                <div key={item.id} className={styles.summaryItem}>
                  <div className={styles.summaryItemName}>
                    {item.name} <span className={styles.qty}>x{item.quantity}</span>
                  </div>
                  <div className={styles.summaryItemPrice}>{item.price * item.quantity} MAD</div>
                </div>
              ))}
            </div>
            
            <div className={styles.summaryLine}>
              <span>Subtotal</span>
              <span>{subtotal} MAD</span>
            </div>
            <div className={styles.summaryLine}>
              <span>Delivery Fee</span>
              <span>{deliveryFee} MAD</span>
            </div>

            {selectedDeliveryZone && (
              <div className={styles.deliveryDisclosure} style={{ marginTop: '1rem', backgroundColor: '#FDFBF7', padding: '1rem', borderRadius: '8px', border: '1px solid #EAE6DF' }}>
                <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#3A3531' }}>Estimated Delivery Time</strong>
                <span style={{ color: '#5A5551' }}>{selectedDeliveryZone.deliveryTime}</span>
              </div>
            )}
            
            <div className={styles.fieldGroup} style={{ marginTop: '1rem' }}>
              <label htmlFor="promoCode">Promo Code (Optional)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                  id="promoCode"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoStatus(null); setPromoDiscount(0); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCode('promo', promoInput))}
                  placeholder="e.g. SUMMER20"
                  style={{ textTransform: 'uppercase', flex: 1, minWidth: 0, padding: '12px var(--space-3)', border: `1px solid ${promoStatus ? (promoStatus.ok ? '#4caf50' : '#ff4d4f') : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-primary)', fontSize: '1rem', background: 'var(--bg-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => applyCode('promo', promoInput)}
                  disabled={applyingPromo || !promoInput}
                  style={{ flexShrink: 0, padding: '0 1rem', background: promoStatus?.ok ? '#4caf50' : 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: (!promoInput || applyingPromo) ? 0.6 : 1 }}
                >
                  {applyingPromo ? '...' : promoStatus?.ok ? '✓' : 'Apply'}
                </button>
              </div>
              {promoStatus && <span style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: promoStatus.ok ? '#4caf50' : '#ff4d4f' }}>{promoStatus.msg}</span>}
            </div>

            <div className={styles.fieldGroup} style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <label htmlFor="giftCardCode">Gift Card Code (Optional)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <input
                  id="giftCardCode"
                  value={giftInput}
                  onChange={e => { setGiftInput(e.target.value.toUpperCase()); setGiftStatus(null); setGiftDiscount(0); }}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), applyCode('giftCard', giftInput))}
                  placeholder="e.g. GC-A1B2C3"
                  style={{ textTransform: 'uppercase', flex: 1, minWidth: 0, padding: '12px var(--space-3)', border: `1px solid ${giftStatus ? (giftStatus.ok ? '#4caf50' : '#ff4d4f') : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-primary)', fontSize: '1rem', background: 'var(--bg-primary)' }}
                />
                <button
                  type="button"
                  onClick={() => applyCode('giftCard', giftInput)}
                  disabled={applyingGift || !giftInput}
                  style={{ flexShrink: 0, padding: '0 1rem', background: giftStatus?.ok ? '#4caf50' : 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', opacity: (!giftInput || applyingGift) ? 0.6 : 1 }}
                >
                  {applyingGift ? '...' : giftStatus?.ok ? '✓' : 'Apply'}
                </button>
              </div>
              {giftStatus && <span style={{ fontSize: '0.82rem', marginTop: '0.35rem', color: giftStatus.ok ? '#4caf50' : '#ff4d4f' }}>{giftStatus.msg}</span>}
            </div>

            {totalDiscount > 0 && (
              <div className={styles.summaryLine} style={{ color: '#4caf50' }}>
                <span>Discount</span>
                <span>−{totalDiscount} MAD</span>
              </div>
            )}

            <div className={`${styles.summaryLine} ${styles.totalLine}`}>
              <span>Total</span>
              <span>{total} MAD</span>
            </div>

            <div className={styles.deliveryDisclosure}>
              <p style={{ color: '#5A5551', marginBottom: '10px' }}>
                <strong>Made to Order:</strong> Since every piece is handmade with care, please allow <strong>2-3 days for production</strong> before your order ships.
              </p>
              <p>Delivery fees are predefined by the delivery company and added automatically at checkout. Delivery scheduling and the final delivery attempt are handled by the delivery company. We will prepare and hand over your order according to the stated processing estimate.</p>
            </div>

            {error && <div className={styles.globalError}>{error}</div>}

            <button 
              type="submit" 
              disabled={isSubmitting || !isValid} 
              className={styles.placeOrderBtn}
              style={{ opacity: (!isValid || isSubmitting) ? 0.5 : 1, cursor: (!isValid || isSubmitting) ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
