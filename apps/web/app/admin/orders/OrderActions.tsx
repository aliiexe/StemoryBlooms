'use client';

import { useState } from 'react';
import { updateOrderStatus, pushOrderToInfinidis } from './actions';
import CustomDropdown from '../components/CustomDropdown';
import ConfirmModal from '../components/ConfirmModal';
import { nextOrderStatuses, ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';
import { toast } from 'sonner';
import { Truck, Eye } from 'lucide-react';
import Link from 'next/link';

export function OrderActions({ orderId, currentStatus, sentToInfinidis }: { orderId: string; currentStatus: string; sentToInfinidis: boolean }) {
  const [busy, setBusy] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const next = nextOrderStatuses(currentStatus);
  const change = async (status: string) => {
    setBusy(true);
    try {
      const result = await updateOrderStatus(orderId, status);
      if (result.error) toast.error(result.error); else toast.success(`Order ${ORDER_STATUS_LABELS[status]?.toLowerCase() || status}`);
    } catch { toast.error('Could not change the order. Please retry.'); }
    finally { setBusy(false); }
  };
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
    <div style={{ width: 170 }}><CustomDropdown label="Order status" value={currentStatus} disabled={busy || next.length === 0}
      onChange={status => status === 'CANCELLED' || currentStatus === 'CANCELLED' ? setConfirmStatus(status) : void change(status)}
      options={[currentStatus, ...next].map(value => ({ value, label: ORDER_STATUS_LABELS[value] || value }))} /></div>
    <Link href={`/admin/orders/${orderId}`} aria-label="View order details" title="View order details" style={{ padding: 10, border: '1px solid #D6CFE6', borderRadius: 8 }}><Eye size={18} /></Link>
    {sentToInfinidis ? <span title="Carrier submission acknowledged"><Truck size={18} aria-label="Sent to carrier" /></span> :
      <button type="button" disabled={busy || currentStatus !== 'READY'} aria-label="Send to carrier" title={currentStatus === 'READY' ? 'Send to carrier' : 'Mark the order ready before dispatch'}
        style={{ padding: 10, border: '1px solid #D6CFE6', borderRadius: 8 }} onClick={async () => {
          setBusy(true);
          try { const result = await pushOrderToInfinidis(orderId); if (result.success) toast.success('Carrier submission acknowledged'); else toast.error(result.error || 'Dispatch failed'); }
          catch { toast.error('Could not confirm dispatch. Review the carrier dashboard before retrying.'); } finally { setBusy(false); }
        }}><Truck size={18} /></button>}
    <ConfirmModal isOpen={Boolean(confirmStatus)} title={confirmStatus === 'CANCELLED' ? 'Cancel order' : 'Reopen order'}
      message={confirmStatus === 'CANCELLED' ? 'Cancel this order and release its stock? Any recorded gift-card or promotion use will be reversed.' : 'Reopening checks stock again. Orders with reversed discounts require a new quote.'}
      confirmText={confirmStatus === 'CANCELLED' ? 'Cancel order' : 'Reopen order'} onCancel={() => setConfirmStatus(null)}
      onConfirm={() => { const status = confirmStatus; setConfirmStatus(null); if (status) void change(status); }} />
  </div>;
}
