'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateMessageStatus } from './actions';
import styles from '../dashboard.module.css';
export function MessageActions({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const router = useRouter();
  async function change(next: string) {
    setBusy(true); setError('');
    try { const result = await updateMessageStatus({ id, expectedStatus: status, status: next }); if (result.error) setError(result.error); else router.refresh(); }
    catch { setError('The update failed. Try again.'); } finally { setBusy(false); }
  }
  return <div><div className={styles.actionRow}>
    {status === 'UNREAD' && <button disabled={busy} className={styles.secondaryAction} onClick={() => change('READ')}>Mark read</button>}
    {status !== 'RESOLVED' ? <button disabled={busy} className={styles.primaryAction} onClick={() => change('RESOLVED')}>Resolve</button> : <button disabled={busy} className={styles.secondaryAction} onClick={() => change('READ')}>Reopen</button>}
    </div>{error && <p role="alert">{error}</p>}</div>;
}
