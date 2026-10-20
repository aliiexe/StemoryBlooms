'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Plus } from 'lucide-react';
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
const sourceOptions = [{ value: 'INSTAGRAM', label: 'Instagram' }, { value: 'TIKTOK', label: 'TikTok' }, { value: 'PHONE', label: 'Phone / WhatsApp' }, { value: 'IN_PERSON', label: 'In person' }];
const money = (value: number) => `${value.toLocaleString('en-GB')} MAD`;
const fingerprint = (title: string, data: AssistedDraftData) => JSON.stringify({ title, data });
function pricingInput(data: AssistedDraftData) {
  return { source: data.source, items: data.items, city: data.isHandDelivered ? 'In person' : data.city,
    deliveryZoneId: data.isHandDelivered ? undefined : data.deliveryZoneId || undefined,
    isHandDelivered: data.isHandDelivered, manualDiscount: data.manualDiscount, manualDiscountReason: data.manualDiscountReason,
    promoCode: data.promoCode || undefined };
}

export default function NewAssistedOrderForm({ catalog, initialDraft }: { catalog: AssistedCatalog; initialDraft?: DraftEditor }) {
  const router = useRouter();
  const [data, setData] = useState<AssistedDraftData>(() => initialDraft?.data || AssistedDraftDataSchema.parse({ items: [{ productId: '', quantity: 1 }] }));
  const [title, setTitle] = useState(initialDraft?.title || 'Untitled order');
  const [meta, setMeta] = useState(initialDraft);
  const metaRef = useRef(initialDraft);
  const idRef = useRef(initialDraft?.id || '');
  const submitting = useRef(false);
  const [lastSaved, setLastSaved] = useState(() => fingerprint(initialDraft?.title || 'Untitled order', initialDraft?.data || AssistedDraftDataSchema.parse({ items: [{ productId: '', quantity: 1 }] })));
  const [busy, setBusy] = useState<'saving' | 'creating' | null>(null);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(false);
  const [quoteAttempt, retryQuote] = useState(0);
  const [quoteState, setQuoteState] = useState<{ body: string; quote?: StaffOrderQuote; error?: string }>({ body: '' });
  const [legacy, setLegacy] = useState<AssistedDraftData | null>(null);
  const [recoverLegacy, setRecoverLegacy] = useState(false);
  const importedLegacy = useRef(false);
  const [review, setReview] = useState<{ title: string; data: AssistedDraftData; quote: StaffOrderQuote } | null>(null);
  const quoteBody = JSON.stringify(pricingInput(data));
  const canQuote = data.items.length > 0 && data.items.every(item => item.productId) && (data.isHandDelivered || Boolean(data.deliveryZoneId));
  const quote = quoteState.body === quoteBody ? quoteState.quote : undefined;
  const quoteError = quoteState.body === quoteBody ? quoteState.error : undefined;
  const dirty = lastSaved !== fingerprint(title, data);

  useEffect(() => {
    if (initialDraft) return;
    try {
      const saved = readDraftPayload(JSON.parse(localStorage.getItem('assistedOrderDraft') || 'null'));
      if (saved) queueMicrotask(() => setLegacy(saved.data));
    } catch { /* Earlier local storage is optional. */ }
  }, [initialDraft]);

  useEffect(() => {
    if (!canQuote) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await getAssistedOrderQuote(JSON.parse(quoteBody));
        if (!cancelled) setQuoteState(result.success ? { body: quoteBody, quote: result.quote } : { body: quoteBody, error: result.message });
      } catch { if (!cancelled) setQuoteState({ body: quoteBody, error: 'Could not check prices. Try again.' }); }
    }, 350);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [canQuote, quoteBody, quoteAttempt]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function field<K extends keyof AssistedDraftData>(key: K, value: AssistedDraftData[K]) { setData(previous => ({ ...previous, [key]: value })); }
  function editItem(index: number, change: Partial<Item>) { setData(previous => ({ ...previous, items: previous.items.map((item, position) => position === index ? { ...item, ...change } : item) })); }
  function refreshQuote() { setQuoteState({ body: '' }); retryQuote(value => value + 1); }
  function fail(message: string, code?: string) { setError(message); setConflict(code === 'DRAFT_CONFLICT' || code === 'DRAFT_CLOSED'); }
  async function persistDraft(currentTitle: string, currentData: AssistedDraftData) {
    if (!idRef.current) idRef.current = crypto.randomUUID();
    const result = await saveCustomOrderDraft({ id: idRef.current, expectedRevision: metaRef.current?.revision || 0, title: currentTitle, data: currentData });
    if (!result.success) { fail(result.message, result.code); return null; }
    if (importedLegacy.current) { try { localStorage.removeItem('assistedOrderDraft'); } catch { /* Optional storage. */ } }
    metaRef.current = result.draft; setMeta(result.draft); setLastSaved(fingerprint(result.draft.title, result.draft.data)); setTitle(result.draft.title);
    // A reload during conversion must return to the durable draft and its linked order.
    window.history.replaceState(null, '', `/admin/custom-orders/${result.draft.id}`);
    return result.draft;
  }
  async function save() {
    if (submitting.current) return;
    submitting.current = true; setBusy('saving'); setError(''); setConflict(false);
    try { await persistDraft(title, data); }
    catch { setError('The save could not be confirmed. Your fields are preserved; retry saving with the same draft.'); }
    finally { submitting.current = false; setBusy(null); }
  }
  function prepare(event: FormEvent) {
    event.preventDefault(); setError(''); setConflict(false);
    if (!quote) { setError('Review a current quote before creating the order.'); return; }
    if (!idRef.current) idRef.current = crypto.randomUUID();
    const checked = AssistedOrderSchema.safeParse({ ...data, ...pricingInput(data), idempotencyKey: `draft-${idRef.current}`, expectedTotal: quote.total, quoteVersion: quote.quoteVersion });
    if (!checked.success) { setError(checked.error.issues.map(issue => issue.message).join(' ')); return; }
    if (!title.trim()) { setError('Give the draft a title before continuing.'); return; }
    setReview({ title, data, quote });
  }
  async function create(snapshot: NonNullable<typeof review>) {
    if (submitting.current) return;
    submitting.current = true; setReview(null); setBusy('creating'); setError(''); setConflict(false);
    try {
      const saved = metaRef.current && lastSaved === fingerprint(snapshot.title, snapshot.data) ? metaRef.current : await persistDraft(snapshot.title, snapshot.data);
      if (!saved) return;
      const result = await convertCustomOrderDraft({ id: saved.id, expectedRevision: saved.revision, title: saved.title, data: snapshot.data, expectedTotal: snapshot.quote.total, quoteVersion: snapshot.quote.quoteVersion });
      if (!result.success) { fail(result.message, result.code); refreshQuote(); return; }
      setLastSaved(fingerprint(snapshot.title, snapshot.data));
      router.push(`/admin/orders/${result.order.id}`);
    } catch { setError('The order could not be confirmed. Your draft is saved. Retry this conversion or reload the saved draft to see whether its order was created.'); }
    finally { submitting.current = false; setBusy(null); }
  }
  const options = [
    { value: 'BOUQUET', label: 'Custom bouquet · choose a component recipe' },
    { value: 'CUSTOM', label: 'Manual item · enter name and price' },
    ...catalog.products.map(product => ({ value: product.id, image: product.image, label: `${product.name} · ${money(product.price)} · ${product.stock} in stock${product.status !== 'PUBLISHED' ? ' · hidden' : ''}`, disabled: !product.available || product.stock <= 0 || product.status !== 'PUBLISHED' })),
  ];
  return <div className={styles.workspace}>
    <div className={styles.toolbar}><Link href="/admin/custom-orders">All order drafts</Link><span role="status">{busy === 'saving' ? 'Saving draft…' : busy === 'creating' ? 'Creating order…' : meta ? `Draft revision ${meta.revision} · ${dirty ? 'Unsaved changes' : 'Saved'}` : 'New order · not saved yet'}</span></div>
    {legacy && !meta && <div className={styles.saved}><p>An earlier assisted-order form is saved in this browser. Recover it, then save it as a shared draft.</p><button type="button" className={styles.secondaryButton} onClick={() => setRecoverLegacy(true)}>Recover earlier browser draft</button></div>}
    {error && <div className={styles.error} role="alert">{error}{conflict && meta && <p><Link href={`/admin/custom-orders/${meta.id}`} onClick={event => { event.preventDefault(); window.location.assign(`/admin/custom-orders/${meta.id}`); }}>Reload saved draft</Link> · Copy any unsaved notes before reloading.</p>}</div>}
    <form onSubmit={prepare} noValidate>
      <fieldset disabled={Boolean(busy)}><div className={styles.layout}>
        <div className={styles.column}>
          <section className={styles.panel}><h2>Order details</h2><div className={styles.fields}>
            <label>Draft title<input maxLength={120} value={title} onChange={event => setTitle(event.target.value)} /></label>
            <label>Sales channel<CustomSelect label="Sales channel" value={data.source} options={sourceOptions} onChange={value => setData(previous => ({ ...previous, source: value as AssistedDraftData['source'], isHandDelivered: value === 'IN_PERSON' && previous.isHandDelivered }))} /></label>
          </div></section>
          <section className={styles.panel}><h2>Buyer</h2><div className={styles.fields}>
            <label>Full name<input autoComplete="name" maxLength={150} value={data.customerName} onChange={event => field('customerName', event.target.value)} /></label>
            <label>Phone number<input type="tel" autoComplete="tel" maxLength={40} placeholder="06 12 34 56 78" value={data.phoneNumber} onChange={event => field('phoneNumber', event.target.value)} /></label>
            <label className={styles.full}>Email (optional)<input type="email" autoComplete="email" maxLength={254} value={data.email} onChange={event => field('email', event.target.value)} /></label>
          </div></section>
          <section className={styles.panel}><h2>Delivery and recipient</h2>
            {data.source === 'IN_PERSON' && <button type="button" role="switch" aria-checked={data.isHandDelivered} className={styles.toggle} onClick={() => field('isHandDelivered', !data.isHandDelivered)}><Check size={18} aria-hidden="true" />Hand delivery · no carrier fee</button>}
            {!data.isHandDelivered && <div className={styles.fields}>
              <label className={styles.full}>Delivery city<CustomSelect label="Delivery city" searchable value={data.deliveryZoneId} placeholder="Choose a delivery city…"
                options={catalog.zones.map(zone => ({ value: zone.id, label: `${zone.name} · ${money(zone.fee)}${zone.available ? '' : ' · unavailable'}`, disabled: !zone.available }))}
                onChange={id => { const zone = catalog.zones.find(value => value.id === id); setData(previous => ({ ...previous, deliveryZoneId: id, city: zone?.name || '' })); }} /></label>
              <label className={styles.full}>Complete delivery address<textarea rows={3} maxLength={500} value={data.address} onChange={event => field('address', event.target.value)} /></label>
            </div>}
            <p className={styles.hint}>Leave both recipient fields blank when the buyer receives the order.</p>
            <div className={styles.fields}><label>Recipient name (optional)<input maxLength={150} value={data.recipientName} onChange={event => field('recipientName', event.target.value)} /></label>
              <label>Recipient phone (optional)<input type="tel" maxLength={40} value={data.recipientPhone} onChange={event => field('recipientPhone', event.target.value)} /></label>
              <label className={styles.full}>Production and delivery notes<textarea rows={3} maxLength={1000} value={data.notes} onChange={event => field('notes', event.target.value)} /></label></div>
          </section>
          <section className={styles.panel}><h2>Items and custom bouquets</h2>
            {data.items.map((item, index) => {
              const product = catalog.products.find(value => value.id === item.productId);
              const lineOptions = item.productId && !options.some(option => option.value === item.productId) ? [{ value: item.productId, label: 'Unavailable saved selection · replace this item', disabled: true }, ...options] : options;
              return <article key={index} className={styles.line} aria-label={`Order item ${index + 1}`}>
                <div className={styles.lineHeader}><h3>Item {index + 1}</h3><button type="button" className={styles.quietButton} aria-label={`Remove item ${index + 1}`} onClick={() => field('items', data.items.filter((_, position) => position !== index))}>Remove</button></div>
                <div className={styles.lineFields}><label>Item<CustomSelect label={`Choose item ${index + 1}`} value={item.productId} searchable options={lineOptions} onChange={productId => editItem(index, { productId, customName: undefined, customPrice: undefined, configuration: productId === 'BOUQUET' ? { components: {}, cardMessage: '' } : undefined })} /></label>
                  <label>Quantity<input aria-label={`Item ${index + 1} quantity`} type="number" min="1" max="100" step="1" value={item.quantity} onChange={event => editItem(index, { quantity: Number(event.target.value) })} /></label></div>
                {product && <p className={styles.hint}>{product.stock} available · {money(product.price)} each. Availability is checked again when the order is created.</p>}
                {item.productId === 'CUSTOM' && <><div className={styles.fields}><label>Manual item name<input maxLength={150} value={item.customName || ''} onChange={event => editItem(index, { customName: event.target.value })} /></label><label>Unit price (MAD)<input type="number" min="0" max="1000000" step="1" value={item.customPrice ?? ''} onChange={event => editItem(index, { customPrice: event.target.value === '' ? undefined : Number(event.target.value) })} /></label></div><p className={styles.hint}>Manual items do not reserve catalog or component stock. Use a custom bouquet recipe when components must be reserved.</p></>}
                {item.productId === 'BOUQUET' && <BouquetRecipeEditor number={index + 1} components={catalog.components} value={item.configuration || { components: {} }} onChange={configuration => editItem(index, { configuration })} />}
              </article>;
            })}
            <button type="button" disabled={data.items.length >= 50} className={styles.secondaryButton} onClick={() => field('items', [...data.items, { productId: '', quantity: 1 }])}><Plus size={16} aria-hidden="true" /> Add item</button>
          </section>
        </div>
        <aside className={styles.summary} aria-label="Order quote and draft actions">
          <section className={styles.panel}><h2>Discounts</h2><div className={styles.fields}>
            <label className={styles.full}>Promo code<input maxLength={64} value={data.promoCode} onChange={event => field('promoCode', event.target.value.toUpperCase())} /></label>
            <label className={styles.full}>Manual discount (MAD)<input type="number" min="0" step="1" max="10000000" value={data.manualDiscount} onChange={event => field('manualDiscount', Number(event.target.value))} /></label>
            {data.manualDiscount > 0 && <label className={styles.full}>Discount reason<textarea rows={2} maxLength={300} value={data.manualDiscountReason} onChange={event => field('manualDiscountReason', event.target.value)} /></label>}
          </div></section>
          <section className={styles.panel}><h2>Current quote</h2>
            <div aria-live="polite">{!canQuote && <p className={styles.hint}>Choose items and a delivery city, or hand delivery, to check the total.</p>}
              {canQuote && !quote && !quoteError && <p>Checking prices and stock…</p>}
              {canQuote && quoteError && <div className={styles.error}><p>{quoteError}</p><button type="button" className={styles.secondaryButton} onClick={refreshQuote}>Refresh quote</button></div>}
              {quote && <><div>{quote.items.map((item, index) => <div className={styles.quoteLine} key={index}><span>{item.quantity} × {item.productName}</span><span>{money(item.totalPrice)}</span></div>)}</div>
                <dl><div className={styles.moneyRow}><dt>Merchandise</dt><dd>{money(quote.subtotal)}</dd></div><div className={styles.moneyRow}><dt>Promo discount</dt><dd>−{money(quote.promoDiscount)}</dd></div><div className={styles.moneyRow}><dt>Manual discount</dt><dd>−{money(data.manualDiscount)}</dd></div><div className={styles.moneyRow}><dt>Delivery</dt><dd>{money(quote.deliveryFee)}</dd></div><div className={`${styles.moneyRow} ${styles.total}`}><dt>Amount to collect</dt><dd>{money(quote.total)}</dd></div></dl>
                <p className={styles.hint}>{data.isHandDelivered ? 'Hand delivery' : quote.city}{quote.deliveryEstimate ? ` · ${quote.deliveryEstimate}` : ''} · Cash on delivery</p></>}
            </div>
            <button type="submit" className={styles.primaryButton} disabled={Boolean(busy) || !quote || conflict}>{busy === 'creating' ? 'Creating order…' : 'Review and create order'}</button>
            <p className={styles.hint}>Creating the order reserves stock and queues its confirmation. The amount is checked again before anything is saved.</p>
            <button type="button" className={styles.secondaryButton} disabled={Boolean(busy) || conflict} onClick={save}>{busy === 'saving' ? 'Saving…' : 'Save draft'}</button>
            <p className={styles.hint}>Incomplete drafts are allowed. Drafts do not reserve stock, redeem codes, send confirmations, or count as sales.</p>
          </section>
        </aside>
      </div></fieldset>
    </form>
    <ConfirmModal isOpen={recoverLegacy} title="Recover earlier browser draft?" message="Replace the current editor fields with the earlier browser draft? Save your current work first if you need to keep it." confirmText="Recover draft" isDestructive={false} onCancel={() => setRecoverLegacy(false)} onConfirm={() => { if (legacy) { setData(legacy); setTitle(legacy.customerName ? `Order for ${legacy.customerName}`.slice(0, 120) : 'Earlier browser draft'); importedLegacy.current = true; setLegacy(null); } setRecoverLegacy(false); }} />
    <ConfirmModal isOpen={Boolean(review)} title="Create assisted order?" isDestructive={false} confirmText="Create order" cancelText="Keep editing"
      message={review ? `Create this ${sourceOptions.find(option => option.value === review.data.source)?.label.toLowerCase()} order for ${review.data.customerName}?\nAmount to collect: ${money(review.quote.total)}.\n${review.data.isHandDelivered ? 'Hand delivery.' : `Deliver to ${review.data.recipientName || review.data.customerName} in ${review.quote.city}.`}\nStock will be reserved and a confirmation queued.` : ''}
      onCancel={() => setReview(null)} onConfirm={() => { if (review) void create(review); }} />
  </div>;
}
