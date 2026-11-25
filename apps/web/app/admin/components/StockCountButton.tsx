'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StockKind } from '@/lib/commerce/stock-ledger';
import { correctInventoryCount } from '../production/actions';
import AdminDialog from './AdminDialog';
import styles from '../dashboard.module.css';

export default function StockCountButton({ kind, id, name, quantity, onSaved }: { kind: StockKind; id: string; name: string; quantity: number; onSaved?: () => void }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [count, setCount] = useState(quantity); const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const attempt = useRef({ fingerprint: '', id: '' });
  return <><button type="button" className={styles.secondaryAction} onClick={() => { setCount(quantity); setError(''); setOpen(true); }}>Correct count</button>
    <AdminDialog open={open} title="Correct stock count" busy={busy} onClose={() => setOpen(false)}>
      <p><strong>{name}</strong> · Current count: {quantity}. Use this for a physical recount or damaged stock. It does not purchase or manufacture anything.</p>
      <form onSubmit={async event => { event.preventDefault(); if (busy) return; setBusy(true); setError(''); const input = { kind, id, expectedQuantity: quantity, quantity: count, reason }; const fingerprint = JSON.stringify(input); if (attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, id: crypto.randomUUID() };
        try { const result = await correctInventoryCount({ ...input, operationId: attempt.current.id }); if (!result.success) setError(result.message); else { setOpen(false); setReason(''); onSaved?.(); router.refresh(); } } catch { setError('The result could not be confirmed. Retry the same correction safely or review movement history.'); } finally { setBusy(false); }
      }} style={{ display: 'grid', gap: 16 }}>
        <label>Counted quantity<input className={styles.input} type="number" value={count} min="0" max="1000000" step="1" required disabled={busy} onChange={event => setCount(Number(event.target.value))} /></label>
        <label>Reason<textarea className={styles.textarea} value={reason} minLength={3} maxLength={500} rows={3} required disabled={busy} onChange={event => setReason(event.target.value)} /></label>
        {error && <p role="alert">{error}</p>}<button type="submit" className={styles.submitBtn} disabled={busy}>{busy ? 'Recording…' : 'Record stock correction'}</button>
      </form>
    </AdminDialog></>;
}
