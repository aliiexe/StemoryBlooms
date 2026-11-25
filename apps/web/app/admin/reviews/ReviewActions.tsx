'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { moderateReview } from './actions';
import styles from '../dashboard.module.css';
export function ReviewActions({ id, status }: { id: string; status: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function change(next: string) {
    setBusy(true); setError('');
    try { const result = await moderateReview({ id, expectedStatus: status, status: next }); if (result.error) setError(result.error); else router.refresh(); }
    catch { setError('Moderation failed. Try again.'); } finally { setBusy(false); }
  }
  return <div><div className={styles.actionRow}>{['APPROVED','REJECTED','PENDING'].filter(value => value !== status).map(value => <button className={styles.secondaryAction} disabled={busy} onClick={() => change(value)} key={value}>{value === 'PENDING' ? 'Return to pending' : value === 'APPROVED' ? 'Approve' : 'Reject'}</button>)}</div>{error && <p role="alert">{error}</p>}</div>;
}
