'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from './actions';
import CustomDropdown from '../components/CustomDropdown';
import ConfirmModal from '../components/ConfirmModal';
import { nextOrderStatuses, ORDER_STATUS_LABELS } from '@/lib/commerce/order-status';
import { toast } from 'sonner';
import Link from 'next/link';
import styles from '../workspace.module.css';
export function OrderActions({ orderId, currentStatus, pickup = false }: { orderId: string; currentStatus: string; sentToInfinidis: boolean; pickup?: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [confirmStatus, setConfirmStatus] = useState<string | null>(null);
  const next = nextOrderStatuses(currentStatus).filter(status => status !== 'SHIPPED');
  async function change(status: string) { if (busy) return; setBusy(true); try { const result = await updateOrderStatus(orderId, status); if (result.error) toast.error(result.error); else { toast.success(pickup && status === 'DELIVERED' ? 'Pickup recorded' : `Order ${ORDER_STATUS_LABELS[status]?.toLowerCase() || status}`); router.refresh(); } } catch { toast.error('The change could not be confirmed. Check the order before retrying.'); } finally { setBusy(false); } }
  return <div className={styles.actions}>{next.length ? <div style={{width:165}}><CustomDropdown label="Update order status" value={currentStatus} disabled={busy} onChange={status => ['CANCELLED','DELIVERED'].includes(status) || currentStatus === 'CANCELLED' ? setConfirmStatus(status) : void change(status)} options={[currentStatus,...next].map(value => ({value,label:pickup&&value==='DELIVERED'?'Picked up':ORDER_STATUS_LABELS[value] || value}))} /></div> : <span className={styles.status}>{pickup&&currentStatus==='DELIVERED'?'Picked up':ORDER_STATUS_LABELS[currentStatus] || currentStatus}</span>}{currentStatus==='READY'&&!pickup&&<Link href="/admin/deliveries?status=READY" className={styles.tab}>Arrange handoff</Link>}<ConfirmModal busy={busy} isOpen={Boolean(confirmStatus)} title={confirmStatus==='CANCELLED'?'Cancel order':confirmStatus==='DELIVERED'?(pickup?'Confirm pickup':'Confirm delivery'):'Reopen order'} message={confirmStatus==='CANCELLED'?'Cancel this order? Any stock actually reserved by this order will be released. Received payments remain recorded and must be refunded separately.':confirmStatus==='DELIVERED'?(pickup?'Confirm that the customer has collected their order. This does not record a payment.':'Confirm that the customer has received their order. This does not record a payment.'):'Reopen this order? Tracked stock and any reversed discounts are checked again.'} confirmText={confirmStatus==='CANCELLED'?'Cancel order':confirmStatus==='DELIVERED'?(pickup?'Mark picked up':'Mark delivered'):'Reopen order'} isDestructive={confirmStatus==='CANCELLED'} onCancel={()=>setConfirmStatus(null)} onConfirm={()=>{const status=confirmStatus;setConfirmStatus(null);if(status)void change(status);}} /></div>;
}
