'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, Package, Truck, ShoppingBag, CreditCard, Check } from 'lucide-react';
import { AssistedDraftDataSchema, AssistedOrderSchema, type AssistedDraftData } from '@stemory/contracts';
import type { AssistedCatalog } from '@/lib/commerce/assisted-catalog';
import { readDraftPayload, type DraftEditor } from '@/lib/commerce/draft-payload';
import type { StaffOrderQuote } from '@/lib/commerce/orders';
import { CustomSelect } from '@/components/ui/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import { getAssistedOrderQuote } from '../actions';
import { saveCustomOrderDraft, convertCustomOrderDraft } from '../../custom-orders/actions';
import BouquetRecipeEditor from './BouquetRecipeEditor';
import styles from './assisted-order.module.css';

type Item = AssistedDraftData['items'][number];
const sources = [{ value: 'INSTAGRAM', label: 'Instagram' }, { value: 'TIKTOK', label: 'TikTok' }, { value: 'PHONE', label: 'Phone / WhatsApp' }, { value: 'IN_PERSON', label: 'In person' }];
const money = (value: number) => `${value.toLocaleString('en-GB', { maximumFractionDigits: 2 })} MAD`;
const fingerprint = (title: string, data: AssistedDraftData) => JSON.stringify({ title, data });
function pricingInput(data: AssistedDraftData) {
  const method = data.fulfillmentMethod || (data.isHandDelivered ? 'HAND_DELIVERY' : 'DELIVERY');
  return { source: data.source, items: data.items, city: method === 'PICKUP' ? 'Customer pickup' : method === 'HAND_DELIVERY' ? 'In person' : data.city,
    deliveryZoneId: method === 'DELIVERY' ? data.deliveryZoneId || undefined : undefined, fulfillmentMethod: method,
    trackInventory: data.trackInventory !== false, isHandDelivered: method !== 'DELIVERY', manualDiscount: data.manualDiscount,
    manualDiscountReason: data.manualDiscountReason, promoCode: data.promoCode || undefined };
}
export default function NewAssistedOrderForm({ catalog, draftId, initialDraft }: { catalog: AssistedCatalog; draftId: string; initialDraft?: DraftEditor }) {
  const router = useRouter();
  const [data, setData] = useState<AssistedDraftData>(() => initialDraft?.data || AssistedDraftDataSchema.parse({ items: [{ productId: '', quantity: 1 }], trackInventory: false, fulfillmentMethod: 'DELIVERY' }));
  const [title, setTitle] = useState(initialDraft?.title || 'New order');
  const [meta, setMeta] = useState(initialDraft);
  const metaRef = useRef(initialDraft); const submitting = useRef(false); const errorRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(draftId);
  const [lastSaved, setLastSaved] = useState(() => initialDraft ? fingerprint(initialDraft.title, initialDraft.data) : '');
  const [busy, setBusy] = useState<'saving' | 'creating' | null>(null);
  const [error, setError] = useState(''); const [conflict, setConflict] = useState(false);
  const [quoteAttempt, retryQuote] = useState(0);
  const [quoteState, setQuoteState] = useState<{ body: string; quote?: StaffOrderQuote; error?: string }>({ body: '' });
  const [legacy, setLegacy] = useState<AssistedDraftData | null>(null);
  const [recoverLegacy, setRecoverLegacy] = useState(false); const importedLegacy = useRef(false);
  const [review, setReview] = useState<{ title: string; data: AssistedDraftData; quote: StaffOrderQuote } | null>(null);
  const [paymentMode, setPaymentMode] = useState(initialDraft?.data.receivedPayment ? 'CUSTOM' : 'UNPAID');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'BANK_TRANSFER'>(initialDraft?.data.receivedPayment?.method || 'CARD');
  const [paymentReference, setPaymentReference] = useState(initialDraft?.data.receivedPayment?.reference || '');
  const [paymentAmount, setPaymentAmount] = useState(initialDraft?.data.receivedPayment ? String(initialDraft.data.receivedPayment.amountCents / 100) : '');
  const [allocation, setAllocation] = useState<'ORDER' | 'ITEMS' | 'DELIVERY'>(initialDraft?.data.receivedPayment?.allocation || 'ORDER');
  const method = data.fulfillmentMethod || (data.isHandDelivered ? 'HAND_DELIVERY' : 'DELIVERY');
  const quoteBody = JSON.stringify(pricingInput(data));
  const canQuote = data.items.length > 0 && data.items.every(item => item.productId) && (method !== 'DELIVERY' || Boolean(data.deliveryZoneId));
  const quote = quoteState.body === quoteBody ? quoteState.quote : undefined;
  const quoteError = quoteState.body === quoteBody ? quoteState.error : undefined;
  const paidCents = paymentMode === 'ALL' ? Math.round((quote?.total || 0) * 100) : paymentMode === 'ITEMS' ? Math.round(((quote?.total || 0) - (quote?.deliveryFee || 0)) * 100) : paymentMode === 'CUSTOM' && /^\d+(?:\.\d{1,2})?$/.test(paymentAmount) ? Math.round(Number(paymentAmount) * 100) : 0;
  const currentData: AssistedDraftData = { ...data, receivedPayment: paymentMode === 'UNPAID' ? undefined : { method: paymentMethod, allocation: paymentMode === 'ITEMS' ? 'ITEMS' : paymentMode === 'ALL' ? 'ORDER' : allocation, amountCents: paidCents, reference: paymentReference } };
  const dirty = meta ? lastSaved !== fingerprint(title, currentData) : Boolean(data.customerName || data.phoneNumber || data.items.some(item => item.productId));
  useEffect(() => {
    if (initialDraft) return;
    try { const saved = readDraftPayload(JSON.parse(localStorage.getItem('assistedOrderDraft') || 'null')); if (saved) queueMicrotask(() => setLegacy(saved.data)); } catch { /* Optional earlier draft. */ }
  }, [initialDraft]);
  useEffect(() => {
    if (!canQuote) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try { const result = await getAssistedOrderQuote(JSON.parse(quoteBody)); if (!cancelled) setQuoteState(result.success ? { body: quoteBody, quote: result.quote } : { body: quoteBody, error: result.message }); }
      catch { if (!cancelled) setQuoteState({ body: quoteBody, error: 'Prices could not be checked. Your selections are still here.' }); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [canQuote, quoteBody, quoteAttempt]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  function field<K extends keyof AssistedDraftData>(key: K, value: AssistedDraftData[K]) { setData(previous => ({ ...previous, [key]: value })); }
  function editItem(index: number, change: Partial<Item>) { setData(previous => ({ ...previous, items: previous.items.map((item, position) => position === index ? { ...item, ...change } : item) })); }
  function fail(message: string, code?: string) { setError(message); setConflict(code === 'DRAFT_CONFLICT' || code === 'DRAFT_CLOSED'); }
  async function persistDraft(currentTitle: string, value: AssistedDraftData) {
    const result = await saveCustomOrderDraft({ id: idRef.current, expectedRevision: metaRef.current?.revision || 0, title: currentTitle, data: value });
    if (!result.success) { fail(result.message, result.code); return null; }
    if (importedLegacy.current) try { localStorage.removeItem('assistedOrderDraft'); } catch { /* Optional storage. */ }
    metaRef.current = result.draft; setMeta(result.draft); setLastSaved(fingerprint(result.draft.title, result.draft.data)); setTitle(result.draft.title);
    window.history.replaceState(null, '', `/admin/custom-orders/${result.draft.id}`);
    return result.draft;
  }
  async function save() {
    if (submitting.current) return; submitting.current = true; setBusy('saving'); setError(''); setConflict(false);
    try { await persistDraft(title, currentData); } catch { setError('The draft save could not be confirmed. Your fields are preserved. Retry this form safely.'); }
    finally { submitting.current = false; setBusy(null); }
  }
  function prepare(event: FormEvent) {
    event.preventDefault(); setError(''); setConflict(false);
    if (!quote) { setError('Choose your items and delivery option to see a current total.'); return; }
    const checked = AssistedOrderSchema.safeParse({ ...currentData, ...pricingInput(currentData), idempotencyKey: `draft-${idRef.current}`, expectedTotal: quote.total, quoteVersion: quote.quoteVersion });
    if (!checked.success) { setError(checked.error.issues.map(issue => `${issue.path[0] === 'phoneNumber' ? 'Phone: ' : ''}${issue.message}`).join(' ')); return; }
    if (paidCents > quote.total * 100 || (paymentMode === 'ITEMS' && paidCents <= 0)) { setError('The received payment must fit within the order amount.'); return; }
    setReview({ title, data: currentData, quote });
  }
  async function create(snapshot: NonNullable<typeof review>) {
    if (submitting.current) return; submitting.current = true; setReview(null); setBusy('creating'); setError(''); setConflict(false);
    let saved: DraftEditor | null = null;
    try {
      saved = metaRef.current && lastSaved === fingerprint(snapshot.title, snapshot.data) ? metaRef.current : await persistDraft(snapshot.title, snapshot.data);
      if (!saved) return;
      const result = await convertCustomOrderDraft({ id: saved.id, expectedRevision: saved.revision, title: saved.title, data: snapshot.data, expectedTotal: snapshot.quote.total, quoteVersion: snapshot.quote.quoteVersion });
      if (!result.success) { fail(result.message, result.code); retryQuote(value => value + 1); return; }
      setLastSaved(fingerprint(snapshot.title, snapshot.data)); router.push(`/admin/orders/${result.order.id}`);
    } catch { setError(saved ? 'The result could not be confirmed. Reload this saved draft to check whether the order exists, or retry the same draft.' : 'The save could not be confirmed. Your fields are preserved. Retry this form safely.'); }
    finally { submitting.current = false; setBusy(null); }
  }
  const itemOptions = [{ value: 'BOUQUET', label: 'Custom bouquet · choose flowers' }, { value: 'CUSTOM', label: 'Custom item · set a name and price' }, ...catalog.products.map(product => ({ value: product.id, label: `${product.name} · ${money(product.price)}`, disabled: !product.available || product.status !== 'PUBLISHED' || (data.trackInventory !== false && product.stock <= 0) }))];
  return <div className={styles.workspace}>
    <div className={styles.toolbar}><Link href="/admin/orders">Orders</Link><span role="status">{busy === 'saving' ? 'Saving…' : busy === 'creating' ? 'Creating order…' : meta ? dirty ? 'Unsaved changes' : 'Draft saved' : 'New order'}</span><Link href="/admin/custom-orders">Saved drafts</Link></div>
    {legacy && !meta && <div className={styles.saved}>An earlier form is saved in this browser. <button type="button" className={styles.secondaryButton} onClick={() => setRecoverLegacy(true)}>Recover earlier work</button></div>}
    {error && <div ref={errorRef} tabIndex={-1} className={styles.error} role="alert">{error}{meta && <p><Link href={`/admin/custom-orders/${meta.id}`}>Open saved draft</Link></p>}</div>}
    <form onSubmit={prepare} noValidate><fieldset disabled={Boolean(busy)}><div className={styles.layout}><div className={styles.column}>
      <section className={styles.panel}><div className={styles.sectionHeading}><h2>Customer</h2><CustomSelect label="Order source" value={data.source} options={sources} onChange={value => field('source', value as AssistedDraftData['source'])} /></div>
        <div className={styles.fields}><label>Full name<input autoComplete="name" maxLength={150} placeholder="Customer name" value={data.customerName} onChange={event => field('customerName', event.target.value)} /></label><label>Phone<input type="tel" autoComplete="tel" maxLength={40} placeholder="06 12 34 56 78" value={data.phoneNumber} onChange={event => field('phoneNumber', event.target.value)} /></label></div>
        <details className={styles.details}><summary>Email or a different recipient</summary><div className={styles.fields}><label className={styles.full}>Email · optional<input type="email" value={data.email} onChange={event => field('email', event.target.value)} maxLength={254} /></label><label>Recipient name<input value={data.recipientName} onChange={event => field('recipientName', event.target.value)} maxLength={150} /></label><label>Recipient phone<input type="tel" value={data.recipientPhone} onChange={event => field('recipientPhone', event.target.value)} maxLength={40} /></label></div></details>
      </section>
      <section className={styles.panel}><div className={styles.sectionHeading}><h2>Items</h2><span className={styles.muted}>{data.items.length} {data.items.length === 1 ? 'item' : 'items'}</span></div>
        {data.items.map((item, index) => <article key={index} className={styles.line} aria-label={`Order item ${index + 1}`}><div className={styles.lineFields}><label>Product or custom item<CustomSelect label={`Choose item ${index + 1}`} searchable value={item.productId} options={item.productId && !itemOptions.some(option => option.value === item.productId) ? [{ value: item.productId, label: 'Earlier selection · replace if unavailable' }, ...itemOptions] : itemOptions} onChange={productId => editItem(index, { productId, customName: undefined, customPrice: undefined, unitPriceOverride: undefined, priceOverrideReason: undefined, configuration: productId === 'BOUQUET' ? { components: {}, cardMessage: '' } : undefined })} /></label><label>Qty<input aria-label={`Item ${index + 1} quantity`} type="number" min="1" max="100" value={item.quantity} onChange={event => editItem(index, { quantity: Number(event.target.value) })} /></label><button type="button" className={styles.iconButton} aria-label={`Remove item ${index + 1}`} onClick={() => field('items', data.items.filter((_, position) => position !== index))}><Trash2 size={17} /></button></div>
          {item.productId === 'CUSTOM' && <div className={styles.fields}><label>Item name<input value={item.customName || ''} maxLength={150} onChange={event => editItem(index, { customName: event.target.value })} /></label><label>Your unit price (MAD)<input type="number" min="0" value={item.customPrice ?? ''} onChange={event => editItem(index, { customPrice: event.target.value === '' ? undefined : Number(event.target.value) })} /></label></div>}
          {item.productId === 'BOUQUET' && <BouquetRecipeEditor number={index + 1} components={catalog.components} trackInventory={data.trackInventory !== false} value={item.configuration || { components: {} }} onChange={configuration => editItem(index, { configuration })} />}
          {item.productId && item.productId !== 'CUSTOM' && <details className={styles.details} open={item.unitPriceOverride !== undefined}><summary>Set a different price for this order</summary><div className={styles.fields}><label>Your unit price (MAD)<input type="number" min="0" value={item.unitPriceOverride ?? ''} placeholder="Use catalog price" onChange={event => editItem(index, { unitPriceOverride: event.target.value === '' ? undefined : Number(event.target.value), priceOverrideReason: item.priceOverrideReason || 'Agreed customer price' })} /></label><label>Price note<input value={item.priceOverrideReason || ''} maxLength={300} onChange={event => editItem(index, { priceOverrideReason: event.target.value })} /></label></div></details>}
        </article>)}
        <button type="button" className={styles.secondaryButton} disabled={data.items.length >= 50} onClick={() => field('items', [...data.items, { productId: '', quantity: 1 }])}><Plus size={16} /> Add another item</button>
      </section>
      <section className={styles.panel}><div className={styles.sectionHeading}><h2>Delivery or pickup</h2><Link href="/admin/deliveries/zones" target="_blank" rel="noopener">Look up city prices</Link></div><div className={styles.choiceGrid}>{([{ value: 'DELIVERY', label: 'Courier delivery', icon: Truck }, { value: 'PICKUP', label: 'Customer pickup', icon: ShoppingBag }, { value: 'HAND_DELIVERY', label: 'Local hand delivery', icon: Package }] as const).map(option => <button type="button" key={option.value} aria-pressed={method === option.value} className={styles.choice} onClick={() => { field('fulfillmentMethod', option.value); field('isHandDelivered', option.value !== 'DELIVERY'); }}><option.icon size={20} /><span>{option.label}</span>{option.value !== 'DELIVERY' && <small>No delivery fee</small>}</button>)}</div>
        {method === 'DELIVERY' ? <div className={styles.fields}><label className={styles.full}>City<CustomSelect label="Delivery city" searchable value={data.deliveryZoneId} placeholder="Search a city to see its delivery price" options={catalog.zones.filter(zone => zone.available).map(zone => ({ value: zone.id, label: `${zone.name} · ${money(zone.fee)}` }))} onChange={id => { const zone = catalog.zones.find(value => value.id === id); setData(previous => ({ ...previous, deliveryZoneId: id, city: zone?.name || '' })); }} /></label><label className={styles.full}>Delivery address<textarea rows={2} maxLength={500} value={data.address} placeholder="Street, building, apartment, and any useful directions" onChange={event => field('address', event.target.value)} /></label></div> : <p className={styles.hint}>{method === 'PICKUP' ? 'The customer collects the order. No city, address, or courier is required.' : 'You hand the order to the customer yourself. No courier registration or delivery charge.'}</p>}
      </section>
      <section className={styles.panel}><div className={styles.sectionHeading}><h2>Payment</h2><CreditCard size={19} /></div><p className={styles.hint}>Record money you have already received. You can add more payments later.</p><CustomSelect label="Payment received" value={paymentMode} onChange={setPaymentMode} options={[{ value: 'UNPAID', label: 'Not paid yet' }, { value: 'ALL', label: 'Everything already paid · items + delivery' }, { value: 'ITEMS', label: 'Items paid · delivery still due in cash' }, { value: 'CUSTOM', label: 'Partially paid · enter an amount' }]} />
        {paymentMode !== 'UNPAID' && <div className={styles.fields}><label>Payment method<CustomSelect label="Received payment method" value={paymentMethod} onChange={value => setPaymentMethod(value as typeof paymentMethod)} options={[{ value: 'CARD', label: 'Card' }, { value: 'BANK_TRANSFER', label: 'Bank transfer' }, { value: 'CASH', label: 'Cash' }]} /></label><label>Payment reference{paymentMethod === 'CASH' ? ' · optional' : ''}<input value={paymentReference} maxLength={150} placeholder="Receipt or transfer reference" onChange={event => setPaymentReference(event.target.value)} /></label>{paymentMode === 'CUSTOM' && <><label>Amount received (MAD)<input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={event => setPaymentAmount(event.target.value)} /></label><label>What it covers<CustomSelect label="Payment covers" value={allocation} onChange={value => setAllocation(value as typeof allocation)} options={[{ value: 'ORDER', label: 'Order balance' }, { value: 'ITEMS', label: 'Items only' }, { value: 'DELIVERY', label: 'Delivery only' }]} /></label></>}</div>}
      </section>
      <details className={`${styles.panel} ${styles.details}`}><summary>Notes, discounts, and stock tracking</summary><div className={styles.fields}><label className={styles.full}>Order note<textarea rows={2} maxLength={1000} value={data.notes} onChange={event => field('notes', event.target.value)} /></label><label>Promo code<input maxLength={64} value={data.promoCode} onChange={event => field('promoCode', event.target.value.toUpperCase())} /></label><label>Discount (MAD)<input type="number" min="0" value={data.manualDiscount} onChange={event => field('manualDiscount', Number(event.target.value))} /></label>{data.manualDiscount > 0 && <label className={styles.full}>Discount note<input value={data.manualDiscountReason} onChange={event => field('manualDiscountReason', event.target.value)} maxLength={300} /></label>}<label className={styles.full}>Draft name<input maxLength={120} value={title} onChange={event => setTitle(event.target.value)} /></label></div><button type="button" role="switch" aria-checked={data.trackInventory !== false} className={styles.toggle} onClick={() => field('trackInventory', data.trackInventory === false)}><Check size={18} />Update finished-item and component stock for this order</button><p className={styles.hint}>Off by default for new assisted orders. You can work without entering material purchases or rebuilding old stock counts.</p></details>
    </div><aside className={styles.summary}><section className={styles.panel}><h2>Order summary</h2><div aria-live="polite">{!canQuote && <p className={styles.hint}>Add an item and choose delivery or pickup to see the total.</p>}{canQuote && !quote && !quoteError && <p>Checking the total…</p>}{quoteError && <div className={styles.error}>{quoteError}<button type="button" onClick={() => retryQuote(value => value + 1)}>Try again</button></div>}{quote && <><div>{quote.items.map((item, index) => <div className={styles.quoteLine} key={index}><span>{item.quantity} × {item.productName}</span><strong>{money(item.totalPrice)}</strong></div>)}</div><dl><div className={styles.moneyRow}><dt>Items</dt><dd>{money(quote.subtotal)}</dd></div>{quote.discount > 0 && <div className={styles.moneyRow}><dt>Discount</dt><dd>−{money(quote.discount)}</dd></div>}<div className={styles.moneyRow}><dt>{method === 'PICKUP' ? 'Pickup' : 'Delivery'}</dt><dd>{money(quote.deliveryFee)}</dd></div><div className={`${styles.moneyRow} ${styles.total}`}><dt>Order total</dt><dd>{money(quote.total)}</dd></div><div className={styles.moneyRow}><dt>Already received</dt><dd>{money(paidCents / 100)}</dd></div><div className={`${styles.moneyRow} ${styles.balance}`}><dt>{method === 'PICKUP' ? 'Due at pickup' : 'Still to collect'}</dt><dd>{money(Math.max(0, quote.total - paidCents / 100))}</dd></div></dl></>}</div><button type="submit" className={styles.primaryButton} disabled={Boolean(busy) || !quote || conflict}>{busy === 'creating' ? 'Creating…' : 'Review order'}</button><button type="button" className={styles.secondaryButton} disabled={Boolean(busy) || conflict} onClick={save}>{busy === 'saving' ? 'Saving…' : 'Save as draft'}</button><p className={styles.hint}>Drafts save your work without creating a sale or recording a payment.</p></section></aside></div></fieldset></form>
    <ConfirmModal isOpen={recoverLegacy} title="Recover earlier work?" message="Replace the current form with your earlier browser draft?" confirmText="Recover" isDestructive={false} onCancel={() => setRecoverLegacy(false)} onConfirm={() => { if (legacy) { setData(legacy); setTitle(legacy.customerName ? `Order for ${legacy.customerName}` : 'Earlier order'); importedLegacy.current = true; setLegacy(null); } setRecoverLegacy(false); }} />
    <ConfirmModal isOpen={Boolean(review)} title="Create this order?" confirmText="Create order" cancelText="Keep editing" isDestructive={false} onCancel={() => setReview(null)} onConfirm={() => { if (review) void create(review); }} message={review ? `${review.data.customerName}\nOrder total: ${money(review.quote.total)}\nAlready received: ${money((review.data.receivedPayment?.amountCents || 0) / 100)}\nStill to collect: ${money(review.quote.total - (review.data.receivedPayment?.amountCents || 0) / 100)}\n${review.data.trackInventory === false ? 'Stock tracking is off for this order.' : 'This order will reserve stock.'}` : ''} />
  </div>;
}
