'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDialog from '../components/AdminDialog';
import { restockMaterial } from '../materials/actions';
import styles from '../dashboard.module.css';
export default function PurchaseButton({ id, name, cost }: { id: string; name: string; cost: number | null }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [quantity, setQuantity] = useState(1); const [unitCost, setUnitCost] = useState(cost === null ? '' : String(Math.round(cost * 100) / 100)); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const attempt = useRef({ id: '', fingerprint: '' });
  return <><button type="button" className={styles.secondaryAction} onClick={() => setOpen(true)}>Record purchase</button><AdminDialog open={open} title="Record material purchase" busy={busy} onClose={() => setOpen(false)}>
    <p>{name}. This increases stock and records the purchase expense together. A physical recount belongs under Correct count.</p>
    <form style={{ display: 'grid', gap: 16 }} onSubmit={async event => { event.preventDefault(); if (busy) return; setBusy(true); setError(''); const fingerprint = JSON.stringify({ id, quantity, unitCost, reason }); if (attempt.current.fingerprint !== fingerprint) attempt.current = { id: crypto.randomUUID(), fingerprint };
      try { const result = await restockMaterial(id, quantity, attempt.current.id, Number(unitCost), reason); if (result.error) setError(result.error); else { setOpen(false); router.refresh(); } } catch { setError('Purchase could not be confirmed. Retry the same request safely or check movement history.'); } finally { setBusy(false); }
    }}><label>Purchased quantity<input className={styles.input} type="number" min="1" max="100000" step="1" required value={quantity} disabled={busy} onChange={event => setQuantity(Number(event.target.value))} /></label>
      <label>Unit cost (MAD)<input className={styles.input} type="number" min="0" max="1000000" step="0.01" required value={unitCost} disabled={busy} onChange={event => setUnitCost(event.target.value)} /></label>
      <label>Receipt reference or purchase note<textarea className={styles.textarea} required minLength={3} maxLength={500} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} /></label>
      <strong>Total purchase: {(quantity * Number(unitCost || 0)).toFixed(2)} MAD</strong>{error && <p role="alert">{error}</p>}
      <button className={styles.submitBtn} disabled={busy} type="submit">{busy ? 'Recording…' : 'Record purchase and expense'}</button>
    </form></AdminDialog></>;
}
