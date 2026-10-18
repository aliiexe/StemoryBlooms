'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckoutPayloadSchema, type CheckoutPayload } from '@stemory/contracts';
import { useCartStore } from '@stemory/ui';
import { checkoutCartLines } from '@/lib/commerce/cart-lines';
import type { OrderQuote } from '@/lib/commerce/orders';
import { CustomSelect } from '@/components/ui/CustomSelect';
import styles from './page.module.css';

const DRAFT = 'checkout_form_draft_v2';
const ATTEMPT = 'stemory-checkout-attempt';
const consentFields = [
  ['termsAccepted', 'I accept the Terms and Conditions'],
  ['deliveryPolicyAccepted', 'I accept the Delivery Policy'],
  ['privacyNoticeAccepted', 'I accept the Privacy Notice'],
  ['codConditionsAccepted', 'I accept the Cash on Delivery Conditions'],
] as const;
const draftFields = ['customerName', 'email', 'phoneNumber', 'city', 'address', 'deliveryInstructions', 'deliveryZoneId'] as const;
const subscribe = () => () => {};
type CheckoutAttempt = { fingerprint: string; key: string; payload: CheckoutPayload; expires: number };
type Zone = { id: string; name: string; fee: number; deliveryTime: string | null };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneError, setZoneError] = useState('');
  const [zoneAttempt, retryZones] = useState(0);
  const [promoInput, setPromoInput] = useState('');
  const [giftInput, setGiftInput] = useState('');
  const [error, setError] = useState('');
  const [quoteAttempt, retryQuote] = useState(0);
  const [quoteState, setQuoteState] = useState<{ body: string; quote?: OrderQuote; error?: string }>({ body: '' });
  const submitting = useRef(false);
  const attemptRef = useRef<CheckoutAttempt | null>(null);
  const [previousAttempt, setPreviousAttempt] = useState<CheckoutAttempt | null>(null);
  const [recovering, setRecovering] = useState(false);
  const { register, handleSubmit, setValue, control, watch, formState: { errors, isSubmitting } } = useForm<CheckoutPayload>({
    resolver: zodResolver(CheckoutPayloadSchema),
    defaultValues: { customerName: '', email: '', phoneNumber: '', city: '', address: '', deliveryInstructions: '',
      deliveryZoneId: '', cartItems: [], expectedTotal: 0,
      termsAccepted: false as unknown as true, deliveryPolicyAccepted: false as unknown as true,
      privacyNoticeAccepted: false as unknown as true, codConditionsAccepted: false as unknown as true },
  });
  const values = useWatch({ control });
  const cartItems = checkoutCartLines(items);
  const cartJson = JSON.stringify(cartItems);
  const quoteBody = JSON.stringify({ cartItems, city: values.city || '', deliveryZoneId: values.deliveryZoneId || '',
    promoCode: values.promoCode || undefined, giftCardCode: values.giftCardCode || undefined });
  const needsQuote = items.length > 0 && Boolean(values.deliveryZoneId);
  const quote = quoteState.body === quoteBody ? quoteState.quote : undefined;
  const quoteError = quoteState.body === quoteBody ? quoteState.error : undefined;

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT) || 'null');
      if (saved?.expires > Date.now()) for (const field of draftFields) {
        if (typeof saved.values?.[field] === 'string') setValue(field, saved.values[field]);
      }
    } catch { /* A damaged local draft must not prevent checkout. */ }
    try {
      const previous = JSON.parse(sessionStorage.getItem(ATTEMPT) || 'null');
      if (previous?.expires > Date.now() && /^[A-Za-z0-9_-]{16,128}$/.test(previous.key) && CheckoutPayloadSchema.safeParse(previous.payload).success) {
        queueMicrotask(() => setPreviousAttempt(previous));
      }
    } catch { /* Storage is optional. */ }
    const subscription = watch(value => {
      const fields = Object.fromEntries(draftFields.map(field => [field, value[field] || '']));
      try { sessionStorage.setItem(DRAFT, JSON.stringify({ values: fields, expires: Date.now() + 86400000 })); } catch { /* Storage is optional. */ }
    });
    return () => subscription.unsubscribe();
  }, [setValue, watch]);

  useEffect(() => { setValue('cartItems', JSON.parse(cartJson), { shouldValidate: false }); }, [cartJson, setValue]);
  useEffect(() => {
    const abort = new AbortController();
    fetch('/api/v1/delivery-zones', { signal: abort.signal }).then(async response => {
      if (!response.ok) throw new Error('Delivery cities could not be loaded.');
      const data = await response.json();
      if (!Array.isArray(data.zones) || !data.zones.length) throw new Error('No delivery cities are available right now.');
      setZones(data.zones); setZoneError('');
    }).catch(err => { if (!abort.signal.aborted) setZoneError(err.message || 'Could not load delivery cities.'); });
    return () => abort.abort();
  }, [zoneAttempt]);
  useEffect(() => {
    if (!needsQuote) return;
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/v1/orders/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: quoteBody, signal: abort.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Could not check your order total.');
        if (!abort.signal.aborted) { setQuoteState({ body: quoteBody, quote: data }); setValue('expectedTotal', data.total); }
      } catch (err) {
        if (!abort.signal.aborted) setQuoteState({ body: quoteBody, error: err instanceof Error ? err.message : 'Could not check your order total.' });
      }
    }, 250);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [needsQuote, quoteBody, quoteAttempt, setValue]);

  const submit = async (data: CheckoutPayload) => {
    if (submitting.current || !quote) return;
    submitting.current = true; setError('');
    try {
      const payload = { ...data, cartItems: checkoutCartLines(items), expectedTotal: quote.total };
      const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)))))
        .map(value => value.toString(16).padStart(2, '0')).join('');
      let attempt = attemptRef.current;
      try { attempt = JSON.parse(sessionStorage.getItem(ATTEMPT) || 'null') || attempt; } catch { /* Generate a new attempt below. */ }
      if (!attempt || attempt.fingerprint !== fingerprint || attempt.expires < Date.now()) attempt = { fingerprint, key: `checkout-${crypto.randomUUID()}`, payload, expires: Date.now() + 86400000 };
      setPreviousAttempt(attempt);
      attemptRef.current = attempt;
      try { sessionStorage.setItem(ATTEMPT, JSON.stringify(attempt)); } catch { /* A retry in this tab still retains the form. */ }
      const response = await fetch('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) { retryQuote(value => value + 1); throw new Error(result.message || 'Could not place your order.'); }
      try {
        sessionStorage.setItem(`order-receipt:${result.orderNumber}`, result.receiptUrl);
        sessionStorage.removeItem(DRAFT); sessionStorage.removeItem(ATTEMPT); localStorage.removeItem('checkout_form_draft');
      } catch { /* The direct receipt URL is also returned by the server. */ }
      clearCart();
      router.push(`${result.receiptUrl}&received=1`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not place your order.'); }
    finally { submitting.current = false; }
  };

  const recover = async () => {
    if (!previousAttempt || submitting.current) return;
    submitting.current = true; setRecovering(true); setError('');
    try {
      const response = await fetch('/api/v1/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': previousAttempt.key }, body: JSON.stringify(previousAttempt.payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not recover the order.');
      try { sessionStorage.removeItem(ATTEMPT); sessionStorage.removeItem(DRAFT); } catch { /* Optional storage. */ }
      clearCart(); router.push(`${result.receiptUrl}&received=1`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not recover the order.'); }
    finally { submitting.current = false; setRecovering(false); }
  };

  if (!mounted) return <div className={styles.emptyContainer}>Loading checkout…</div>;
  if (!items.length) return <div className={styles.emptyContainer}><h1>Your cart is empty</h1><Link href="/shop">Continue shopping</Link></div>;
  const estimatedSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const fields = [
    ['customerName', 'Full name', 'text', 'name'], ['email', 'Email', 'email', 'email'], ['phoneNumber', 'Phone number', 'tel', 'tel'],
  ] as const;
  return <div className={styles.container}>
    {previousAttempt && <section className={styles.section} aria-label="Previous checkout attempt"><h2>Previous checkout attempt</h2><p>If your last confirmation was interrupted, retry it safely here. This uses the same checkout attempt and original details ({previousAttempt.payload.expectedTotal} MAD).</p><button type="button" className={styles.placeOrderBtn} disabled={recovering || isSubmitting} onClick={recover}>{recovering ? 'Checking previous order…' : 'Retry previous checkout'}</button></section>}
    <header className={styles.checkoutHeader}><h1>Checkout</h1><Link href="/shop">Continue shopping</Link></header>
    <form onSubmit={handleSubmit(submit)} className={styles.formLayout}>
      <div>
        <section className={styles.section}><h2>Contact</h2>{fields.map(([name, label, type, complete]) =>
          <div key={name} className={styles.fieldGroup}><label htmlFor={name}>{label}</label>
            <input id={name} type={type} autoComplete={complete} {...register(name)} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `${name}-error` : undefined} />
            {errors[name] && <span id={`${name}-error`} className={styles.errorText}>{errors[name]?.message}</span>}
          </div>)}</section>
        <section className={styles.section}><h2>Delivery address</h2>
          <div className={styles.fieldGroup}><label>City / delivery zone</label>
            <CustomSelect label="Delivery city" searchable value={values.deliveryZoneId || ''} options={zones.map(zone => ({ value: zone.id, label: `${zone.name} — ${zone.fee} MAD` }))}
              disabled={!zones.length} placeholder="Choose your city" onChange={id => { const zone = zones.find(value => value.id === id); if (zone) { setValue('deliveryZoneId', id, { shouldValidate: true }); setValue('city', zone.name, { shouldValidate: true }); } }} />
            {errors.deliveryZoneId && <span className={styles.errorText}>Choose a delivery city.</span>}
            {zoneError && <p role="alert">{zoneError} <button type="button" onClick={() => retryZones(value => value + 1)}>Retry</button></p>}
          </div>
          <div className={styles.fieldGroup}><label htmlFor="address">Complete address</label><input id="address" autoComplete="street-address" {...register('address')} aria-invalid={Boolean(errors.address)} />{errors.address && <span className={styles.errorText}>{errors.address.message}</span>}</div>
          <div className={styles.fieldGroup}><label htmlFor="deliveryInstructions">Delivery notes (optional)</label><input id="deliveryInstructions" maxLength={1000} {...register('deliveryInstructions')} /></div>
          <p>Allow 2–3 days for production, plus {quote?.deliveryEstimate || 'your city’s delivery time'}. <Link href="/shipping">Delivery policy</Link></p>
        </section>
        <section className={styles.section}><h2>Payment</h2><p><strong>Cash on delivery</strong><br />Pay the full amount shown when your order arrives.</p></section>
        <section className={styles.section}><h2>Terms and policies</h2>
          {consentFields.map(([field, label]) => <div key={field} className={styles.checkboxGroup}>
            <label className={styles.consent}><input type="checkbox" {...register(field)} /><span className={styles.checkmark} aria-hidden="true">{values[field] ? '✓' : ''}</span><span>{label}</span></label>
            {errors[field] && <span className={styles.errorText}>{errors[field]?.message}</span>}
          </div>)}
          <p><Link href="/shipping">Shipping</Link> · <Link href="/returns">Returns and replacements</Link></p>
        </section>
      </div>
      <aside className={styles.summaryCard}><h2>Order summary</h2>
        <div className={styles.summaryItems}>{(quote?.items || items.map(item => ({ productName: item.name, quantity: item.quantity, totalPrice: item.price * item.quantity }))).map((item, index) =>
          <div key={index} className={styles.summaryItem}><span>{item.quantity} × {item.productName}</span><span>{item.totalPrice} MAD</span></div>)}</div>
        <div className={styles.summaryLine}><span>{quote ? 'Subtotal' : 'Estimated subtotal'}</span><span>{quote?.subtotal ?? estimatedSubtotal} MAD</span></div>
        <div className={styles.summaryLine}><span>Delivery</span><span>{quote ? `${quote.deliveryFee} MAD` : 'Select a city'}</span></div>
        {Boolean(quote?.promoDiscount) && <div className={styles.summaryLine}><span>Promotion</span><span>−{quote?.promoDiscount} MAD</span></div>}
        {Boolean(quote?.giftAmount) && <div className={styles.summaryLine}><span>Gift card</span><span>−{quote?.giftAmount} MAD</span></div>}
        {(['promoCode', 'giftCardCode'] as const).map((field, index) => <div className={styles.fieldGroup} key={field}>
          <label htmlFor={field}>{index ? 'Gift card' : 'Promo code'} (optional)</label>
          <div className={styles.codeRow}><input id={field} value={index ? giftInput : promoInput} maxLength={64}
            onChange={event => { (index ? setGiftInput : setPromoInput)(event.target.value.toUpperCase()); setValue(field, ''); }}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); setValue(field, (index ? giftInput : promoInput).trim()); } }} />
            <button type="button" disabled={!(index ? giftInput : promoInput).trim()} onClick={() => setValue(field, (index ? giftInput : promoInput).trim())}>Apply</button></div>
          {values[field] && quote && <span role="status">Applied</span>}
        </div>)}
        <div className={`${styles.summaryLine} ${styles.totalLine}`}><span>Amount due on delivery</span><span>{quote ? `${quote.total} MAD` : '—'}</span></div>
        <div aria-live="polite">{needsQuote && !quote && !quoteError && <p>Checking prices and availability…</p>}{quoteError && <p role="alert" className={styles.globalError}>{quoteError} <button type="button" onClick={() => retryQuote(value => value + 1)}>Retry</button></p>}</div>
        {error && <p role="alert" className={styles.globalError}>{error}</p>}
        <button className={styles.placeOrderBtn} type="submit" disabled={isSubmitting || !quote}>{isSubmitting ? 'Placing order…' : 'Place order'}</button>
        <p>Your order is received first, then confirmed by our team.</p>
      </aside>
    </form>
  </div>;
}
