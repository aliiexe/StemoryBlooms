'use client';

import React, { useState } from 'react';
import { updateOrderStatus, pushOrderToInfinidis } from './actions';
import CustomDropdown from '../components/CustomDropdown';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Truck, Eye } from 'lucide-react';
import Link from 'next/link';

export function OrderActions({ orderId, currentStatus, sentToInfinidis }: { orderId: string; currentStatus: string; sentToInfinidis: boolean }) {
  const initialStatus = currentStatus === 'DELIVERED' ? 'COMPLETED' : currentStatus;
  const [status, setStatus] = useState(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (nextStatus: string) => {
    setIsSubmitting(true);
    await updateOrderStatus(orderId, nextStatus);
    setStatus(nextStatus);
    toast.success(`Order status updated to ${nextStatus}`);
    setIsSubmitting(false);
  };

  const handlePushInfinidis = async () => {
    setIsSubmitting(true);
    const res = await pushOrderToInfinidis(orderId);
    if (res.success) {
      toast.success('Order successfully sent to Infinidis');
    } else {
      toast.error(res.error || 'Failed to send to Infinidis');
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div style={{ width: '150px' }}>
        <CustomDropdown
          value={status}
          onChange={(val) => handleAction(val)}
          options={[
            { value: 'NEW', label: 'New' },
            { value: 'IN_PRODUCTION', label: 'In production' },
            { value: 'READY', label: 'Ready' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'DELIVERED', label: 'Delivered' },
            { value: 'CANCELLED', label: 'Cancelled' }
          ]}
        />
      </div>

      <Link href={`/admin/orders/${orderId}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', border: '1px solid #E5E7EB', borderRadius: '6px', backgroundColor: 'white', color: '#374151', textDecoration: 'none' }} title="View Details">
        <Eye size={16} />
      </Link>

      {sentToInfinidis ? (
        <button type="button" disabled style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', backgroundColor: '#FDFBF7', border: '1px solid #D6CFE6', color: 'var(--brand-primary)', borderRadius: '6px' }} title="Sent to Delivery">
          <Truck size={16} />
        </button>
      ) : (
        <button type="button" onClick={handlePushInfinidis} disabled={isSubmitting || status === 'CANCELLED'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', backgroundColor: '#fff', border: '1px solid #E5E7EB', color: '#5A5551', borderRadius: '6px', cursor: (isSubmitting || status === 'CANCELLED') ? 'not-allowed' : 'pointer' }} title="Send to Delivery">
          <Truck size={16} />
        </button>
      )}
    </div>
  );
}
