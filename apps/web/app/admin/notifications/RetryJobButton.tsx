'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { retryNotification } from './actions';
import AdminDialog from '../components/AdminDialog';
import styles from '../dashboard.module.css';
export default function RetryJobButton({ id }: { id: string }) {
  const [open,setOpen]=useState(false); const [busy,setBusy]=useState(false); const [reason,setReason]=useState(''); const [error,setError]=useState(''); const router=useRouter();
  async function retry() { setBusy(true);setError('');try {const result=await retryNotification({id,reason});if(result.error)setError(result.error);else{setOpen(false);router.refresh();}}catch{setError('Retry could not be confirmed. Reload to check the job.');}finally{setBusy(false);}}
  return <><button className={styles.secondaryAction} onClick={()=>setOpen(true)}>Retry failed job</button><AdminDialog open={open} onClose={()=>setOpen(false)} title="Retry notification" busy={busy}><form onSubmit={event=>{event.preventDefault();void retry();}}><p>This queues the same notification. Previously acknowledged email recipients will be skipped.</p><label>What was checked or fixed?<textarea required minLength={5} maxLength={500} value={reason} onChange={event=>setReason(event.target.value)}/></label>{error&&<p role="alert">{error}</p>}<button className={styles.primaryAction} disabled={busy}>{busy?'Queuing…':'Queue retry'}</button></form></AdminDialog></>;
}
