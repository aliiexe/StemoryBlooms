'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getOrderStatus } from './actions';
import { Package, Hammer, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './track.module.css';

const STATUS_STEPS = [
  { id: 'NEW', title: 'Order Placed', desc: 'We have received your order.', icon: Package },
  { id: 'IN_PRODUCTION', title: 'In Production', desc: 'We are hand-crafting your everlasting bouquet.', icon: Hammer },
  { id: 'READY', title: 'Ready for Dispatch', desc: 'Your order is packed and waiting for the courier.', icon: Package },
  { id: 'SHIPPED', title: 'On the Way', desc: 'Your order is out for delivery.', icon: Truck },
  { id: 'DELIVERED', title: 'Delivered', desc: 'Enjoy your beautiful bouquet!', icon: CheckCircle2 }
];

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If order number is in URL, fetch it automatically
  useEffect(() => {
    const initialOrder = searchParams.get('order');
    if (initialOrder) {
      handleSearch(initialOrder);
    }
  }, [searchParams]);

  const handleSearch = async (searchOrderNumber: string) => {
    if (!searchOrderNumber) return;
    
    setLoading(true);
    setError(null);
    setOrder(null);
    
    const res = await getOrderStatus(searchOrderNumber);
    
    if (res.error) {
      setError(res.error);
    } else if (res.order) {
      setOrder(res.order);
      // Update URL without full reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('order', searchOrderNumber);
      window.history.pushState({}, '', newUrl);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(orderNumber);
  };

  const getCurrentStepIndex = () => {
    if (!order) return -1;
    if (order.status === 'COMPLETED') return 4;
    if (order.status === 'PROCESSING') return 2;
    return STATUS_STEPS.findIndex(s => s.id === order.status);
  };

  const currentStep = getCurrentStepIndex();
  const fillPercentage = currentStep >= 0 ? (currentStep / (STATUS_STEPS.length - 1)) * 100 : 0;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Track Order</h1>
        <p className={styles.subtitle}>Enter your order number to check its current status.</p>

        {error && (
          <div className={styles.errorBox}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input 
              type="text" 
              placeholder="e.g. ORD-12345" 
              className={styles.input}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Searching...' : 'Track'}
            </button>
          </div>
        </form>

        {order && (
          <div className={styles.timelineContainer}>
            <div className={styles.orderHeader}>
              <div style={{ marginBottom: '0.75rem' }}>
                <span className={styles.orderLabel}>Tracking</span>
                <span className={styles.orderNumber}>{order.orderNumber}</span>
              </div>
              {order.infinidisState && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#FDFBF7', border: '1px solid #D6CFE6', padding: '6px 12px', borderRadius: '20px' }}>
                  <Truck size={14} color="#5A5551" />
                  <span style={{ fontSize: '0.85rem', color: '#5A5551', fontWeight: 500 }}>Courier Status:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-primary)' }}>{order.infinidisState}</span>
                </div>
              )}
            </div>

            {order.status === 'CANCELLED' ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#C62828' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Order Cancelled</h3>
                <p>This order has been cancelled. If you believe this is an error, please contact us.</p>
              </div>
            ) : (
              <div className={styles.timeline}>
                <div className={styles.timelineLine} />
                <div className={styles.timelineLineFill} style={{ height: `calc(${fillPercentage}% - 0px)` }} />
                
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index < currentStep || order.status === 'COMPLETED';
                  const isActive = index === currentStep && order.status !== 'COMPLETED';
                  const Icon = step.icon;
                  
                  return (
                    <div key={step.id} className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isActive ? styles.active : ''}`}>
                      <div className={styles.circle}>
                        <Icon size={24} />
                      </div>
                      <div className={styles.stepContent}>
                        <h4 className={styles.stepTitle}>{step.title}</h4>
                        <p className={styles.stepDesc}>{step.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
