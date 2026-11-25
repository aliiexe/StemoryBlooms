'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';
import type { ProductionQuote } from '@/lib/commerce/production';
import { getProductionQuote, completeProduction } from './actions';
import ConfirmModal from '../components/ConfirmModal';
import StockCountButton from '../components/StockCountButton';
import styles from '../orders/new/assisted-order.module.css';
type Item = { id: string; name: string; stock: number };
export default function ProductionClient({ products, components, ready, initialKind, initialId }: { products: Item[]; components: Item[]; ready: boolean; initialKind: 'PRODUCT' | 'COMPONENT'; initialId: string }) {
  const router = useRouter(); const [kind, setKind] = useState(initialKind); const [id, setId] = useState(initialId); const [quantity, setQuantity] = useState(1); const [reason, setReason] = useState(''); const [attempt, refresh] = useState(0); const [state, setState] = useState<{ body: string; quote?: ProductionQuote; error?: string }>({ body: '' }); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [review, setReview] = useState<ProductionQuote | null>(null); const [completed, setCompleted] = useState(''); const operation = useRef({ id: '', fingerprint: '' });
  const body = JSON.stringify({ kind, id, quantity }); const quote = state.body === body ? state.quote : undefined;
  const list = kind === 'PRODUCT' ? products : components;
  useEffect(() => { if (!id) return; let cancelled = false; const timer = setTimeout(async () => { try { const result = await getProductionQuote(JSON.parse(body)); if (!cancelled) setState(result.success ? { body, quote: result.quote } : { body, error: result.message }); } catch { if (!cancelled) setState({ body, error: 'Could not load this recipe. Try again.' }); } }, 250); return () => { cancelled = true; clearTimeout(timer); }; }, [body, id, attempt]);
  async function record(current: ProductionQuote) {
    if (busy) return; setReview(null); setBusy(true); setError('');
    const data = { kind: current.output.kind, id: current.output.id, quantity: current.output.quantity, recipeVersion: current.recipeVersion, reason };
    const fingerprint = JSON.stringify(data); if (operation.current.fingerprint !== fingerprint) operation.current = { id: crypto.randomUUID(), fingerprint };
    try { const result = await completeProduction({ ...data, operationId: operation.current.id }); if (!result.success) { setError(result.message); setState({ body: '' }); refresh(value => value + 1); } else { setCompleted(`Recorded ${current.output.quantity} × ${result.result.subjectName}. Finished stock is now ${result.result.finalQuantity}.`); router.refresh(); } } catch { setError('This batch could not be confirmed. Retry the same batch safely or check movement history before starting another.'); } finally { setBusy(false); }
  }
  return <div className={styles.workspace}>{error && <p role="alert" className={styles.error}>{error}</p>}{completed && <p role="status" className={styles.saved}>{completed} <Link href="/admin/inventory/movements">View movements</Link><button type="button" className={styles.secondaryButton} onClick={() => { operation.current = { id: '', fingerprint: '' }; setCompleted(''); setState({ body: '' }); refresh(value => value + 1); }}>Start another batch</button></p>}
    <fieldset disabled={busy || Boolean(completed)}><div className={styles.layout}><section className={styles.panel}><h2>Production batch</h2><div className={styles.fields}>
      <label>Make<CustomSelect label="Production item type" value={kind} onChange={value => { setKind(value as typeof kind); setId(''); }} options={[{ value: 'PRODUCT', label: 'Finished product' }, { value: 'COMPONENT', label: 'Builder component' }]} /></label>
      <label>Item<CustomSelect label="Production item" searchable value={id} onChange={setId} options={list.map(item => ({ value: item.id, label: `${item.name} · ${item.stock} in stock` }))} /></label>
      <label>Units to make<input type="number" min="1" max="1000" step="1" value={quantity} onChange={event => setQuantity(Number(event.target.value))} /></label><label className={styles.full}>Batch note / reason<textarea minLength={3} maxLength={500} value={reason} onChange={event => setReason(event.target.value)} rows={3} /></label>
    </div><p className={styles.hint}>{kind === 'PRODUCT' ? 'Assembly consumes finished components from stock, plus raw materials listed directly on the product. Their own raw-material recipes are not deducted again.' : 'Component production consumes the raw materials in this component’s recipe.'}</p>
      {list.find(item => item.id === id) && <fieldset disabled={!ready}><StockCountButton kind={kind} id={id} name={list.find(item => item.id === id)!.name} quantity={list.find(item => item.id === id)!.stock} /></fieldset>}
    </section><section className={styles.panel}><h2>Ingredients and output</h2><div aria-live="polite">{!id && <p>Choose an item to preview its recipe.</p>}{id && state.body !== body && <p>Checking recipe and stock…</p>}{state.body === body && state.error && <p role="alert">{state.error}</p>}
      {quote && <><p>Make <strong>{quote.output.quantity} × {quote.output.name}</strong>. Current finished stock: {quote.output.currentStock}.</p>{quote.inputs.map(line => <div key={`${line.kind}:${line.id}`} className={styles.quoteLine}><span><strong>{line.name}</strong><br />{line.kind === 'MATERIAL' ? 'Raw material' : 'Finished component'} · {line.perUnit} per unit</span><span>{line.required} needed<br />{line.available} available{line.available < line.required && <strong> · shortage</strong>}</span></div>)}<p>Finished stock after this batch: {quote.output.currentStock + quote.output.quantity}</p>{!quote.canProduce && <p role="alert">Resolve ingredient shortages or recount historical negative stock before recording this batch.</p>}</>}
    </div><button type="button" className={styles.primaryButton} disabled={!ready || !quote?.canProduce || reason.trim().length < 3 || busy} onClick={() => setReview(quote || null)}>{busy ? 'Recording…' : 'Review production batch'}</button><button type="button" className={styles.secondaryButton} onClick={() => { setState({ body: '' }); refresh(value => value + 1); }}>Refresh recipe</button></section></div></fieldset>
    <ConfirmModal isOpen={Boolean(review)} title="Record production batch?" isDestructive={false} message={review ? `Make ${review.output.quantity} × ${review.output.name}?\n${review.inputs.map(line => `${line.required} × ${line.name}`).join('\n')}\nThese ingredients will be consumed and finished stock added together. No purchase expense is created.` : ''} confirmText="Record completed production" onCancel={() => setReview(null)} onConfirm={() => { if (review) void record(review); }} />
  </div>;
}
