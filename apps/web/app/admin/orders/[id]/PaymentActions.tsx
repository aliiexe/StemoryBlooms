'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { recordOrderPayment, rotateReceiptLink } from '../actions';
import styles from '../../dashboard.module.css';
import ConfirmModal from '../../components/ConfirmModal';

export default function PaymentActions({ orderId, paid, delivered }: { orderId: string; paid: boolean; delivered: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  return <div style={{ display: 'grid', gap: 8 }}>
    {delivered && !paid && <button className={styles.secondaryAction} type="button" disabled={busy} onClick={() => setConfirm(true)}>Record cash collected</button>}
    <button className={styles.secondaryAction} type="button" disabled={busy} onClick={async () => {
      setBusy(true);
      try { const result = await rotateReceiptLink(orderId); await navigator.clipboard.writeText(new URL(result.url, location.origin).toString()); toast.success('New private receipt link copied. Previous guest links are revoked.'); }
      catch { toast.error('Could not create or copy a private receipt link.'); }
      finally { setBusy(false); }
    }}>Create new private receipt link</button>
    <ConfirmModal isOpen={confirm} title="Record cash collected" message="Confirm only after the cash has actually been received. This records a payment event; delivery status alone does not prove payment." confirmText="Confirm collection" isDestructive={false}
      onCancel={() => setConfirm(false)} onConfirm={async () => {
        setConfirm(false); setBusy(true);
        try { const result = await recordOrderPayment(orderId); if (result.error) toast.error(result.error); else toast.success('Cash collection recorded'); }
        catch { toast.error('Could not record collection.'); } finally { setBusy(false); }
      }} />
  </div>;
}
