'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { updateOrderStatus, createDeliveryHandoff } from './actions';
import styles from '../dashboard.module.css';
import { CustomSelect } from '../../../components/ui/CustomSelect';

interface OrderDeliveryItem {
  id: string;
  orderNumber: string;
  total: number;
  deliveryFee: number;
  status: string;
  createdAt: Date;
  deliveryAddress: any;
  customer?: { firstName: string; phone: string | null; email: string | null } | null;
  deliveryHandoff?: { reference?: string | null; companyId?: string } | null;
}

interface DeliveryCompany {
  id: string;
  name: string;
  contact: string | null;
  email: string | null;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string }> = {
  NEW:        { bg: '#F0F4FF', color: '#3451B2', dot: '#3451B2' },
  PROCESSING: { bg: '#FFF8E1', color: '#B45309', dot: '#D97706' },
  SHIPPED:    { bg: '#E0F2FE', color: '#0369A1', dot: '#0EA5E9' },
  DELIVERED:  { bg: '#DCFCE7', color: '#166534', dot: '#22C55E' },
  CANCELLED:  { bg: '#FEE2E2', color: '#991B1B', dot: '#EF4444' },
};

const ALL_STATUSES = ['ALL', 'NEW', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function AdminDeliveriesClient({ initialOrders, deliveryCompany }: { initialOrders: OrderDeliveryItem[], deliveryCompany?: DeliveryCompany | null }) {
  const [orders, setOrders] = useState<OrderDeliveryItem[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [handoffOrder, setHandoffOrder] = useState<OrderDeliveryItem | null>(null);

  React.useEffect(() => {
    if (handoffOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [handoffOrder]);

  const filtered = orders.filter(o => statusFilter === 'ALL' || o.status === statusFilter);
  const counts = ALL_STATUSES.slice(1).reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {} as Record<string, number>);

  return (
    <div className={styles.dashboard}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Deliveries</h1>
          <p style={{ color: '#7A7571', fontSize: '0.9rem', marginTop: '0.25rem' }}>Track shipments and dispatch orders to couriers</p>
        </div>
        <Link href="/admin/deliveries/zones" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: '10px', border: '1px solid #E2DDD6', backgroundColor: '#FDFBF7', fontSize: '0.85rem', fontWeight: 600, color: '#3A3531', textDecoration: 'none' }}>
          🗺️ Manage Zones
        </Link>
      </header>

      {/* Status summary pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button onClick={() => setStatusFilter('ALL')} style={{ padding: '0.45rem 1rem', borderRadius: '999px', border: '1px solid', borderColor: statusFilter === 'ALL' ? '#3A3531' : '#E2DDD6', backgroundColor: statusFilter === 'ALL' ? '#3A3531' : '#fff', color: statusFilter === 'ALL' ? '#fff' : '#3A3531', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          All ({orders.length})
        </button>
        {ALL_STATUSES.slice(1).map(s => {
          const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG.NEW;
          const active = statusFilter === s;
          return (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '0.45rem 1rem', borderRadius: '999px', border: '1px solid', borderColor: active ? cfg.color : '#E2DDD6', backgroundColor: active ? cfg.bg : '#fff', color: active ? cfg.color : '#5A5551', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: cfg.dot, display: 'inline-block' }} />
              {s} ({counts[s] ?? 0})
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className={styles.card} style={{ textAlign: 'center', padding: '3rem', color: '#B0A89E' }}>
          No orders with status "{statusFilter}"
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((o) => {
            const cfg = STATUS_CONFIG[o.status] ?? STATUS_CONFIG.NEW;
            const addr = o.deliveryAddress as any;
            return (
              <div key={o.id} style={{ backgroundColor: '#fff', border: '1px solid #EAE6DF', borderRadius: '14px', padding: '1.1rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr auto', gap: '1.25rem', alignItems: 'center', minWidth: 0 }}>
                  {/* Status badge */}
                  <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: cfg.bg, color: cfg.color, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.dot, display: 'inline-block' }} />
                    {o.status}
                  </span>

                  {/* Order + customer */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#3A3531' }}>#{o.orderNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: '#7A7571' }}>{o.customer?.firstName || 'Guest'} · {o.customer?.phone || '—'}</div>
                  </div>

                  {/* Destination */}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#3A3531' }}>{addr?.city || '—'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#9A9591', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{addr?.addressLine1 || '—'}</div>
                  </div>

                  {/* Totals */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#5F7161' }}>{o.total} MAD</div>
                    <div style={{ fontSize: '0.78rem', color: '#9A9591' }}>Delivery: {o.deliveryFee} MAD</div>
                  </div>

                  {/* Courier ref */}
                  <div style={{ textAlign: 'right' }}>
                    {o.deliveryHandoff?.reference
                      ? <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0369A1', backgroundColor: '#E0F2FE', padding: '3px 8px', borderRadius: '6px' }}>{o.deliveryHandoff.reference}</span>
                      : <span style={{ fontSize: '0.78rem', color: '#B0A89E' }}>No ref</span>
                    }
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => setHandoffOrder(o)}
                    style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid #D6CFE6', background: '#FDFBF7', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: '#3A3531', whiteSpace: 'nowrap' }}
                  >
                    🚚 Dispatch
                  </button>
                  <div style={{ width: '130px' }}>
                    <CustomSelect
                      value={o.status}
                      onChange={(newSt) => {
                        startTransition(async () => {
                          await updateOrderStatus(o.id, newSt);
                          setOrders(prev => prev.map(item => item.id === o.id ? { ...item, status: newSt } : item));
                        });
                      }}
                      options={ALL_STATUSES.slice(1).map(s => ({ value: s, label: s }))}
                      style={{ minWidth: '100px' }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dispatch modal */}
      {handoffOrder && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#fff', borderRadius: '20px', padding: '2rem', boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', fontWeight: 700, color: '#3A3531' }}>Dispatch #{handoffOrder.orderNumber}</h3>
            <p style={{ fontSize: '0.85rem', color: '#7A7571', marginBottom: '1.5rem' }}>
              Hand over to <strong>{deliveryCompany?.name || 'courier'}</strong> and mark as Shipped.
            </p>
            <form action={async (fd) => {
              const ref = fd.get('reference') as string;
              startTransition(async () => {
                const res = await createDeliveryHandoff(handoffOrder.id, deliveryCompany?.id || 'default', ref);
                if (res?.success) {
                  setOrders(prev => prev.map(o => o.id === handoffOrder.id ? { ...o, status: 'SHIPPED', deliveryHandoff: { reference: ref } } : o));
                  setHandoffOrder(null);
                }
              });
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', fontWeight: 500, color: '#5A5551' }}>Tracking Reference (optional)</label>
                <input name="reference" placeholder="e.g. INF-994821" style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #D6CFE6', fontSize: '0.9rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setHandoffOrder(null)} style={{ padding: '0.7rem 1.25rem', borderRadius: '10px', border: '1px solid #EAE6DF', background: '#F8F6F2', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                <button type="submit" disabled={isPending} className={styles.submitBtn} style={{ width: 'auto', margin: 0, padding: '0.7rem 1.5rem' }}>
                  {isPending ? 'Dispatching…' : 'Mark as Shipped'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
