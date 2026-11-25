'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrderStatus } from './actions';
import { Package, Hammer, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './track.module.css';

const STATUS_STEPS = [
  { id: 'NEW', title: 'Order Placed', desc: 'We have received your order.', icon: Package },
  { id: 'CONFIRMED', title: 'Confirmed', desc: 'Our team has confirmed your order.', icon: CheckCircle2 },
  { id: 'IN_PRODUCTION', title: 'In Production', desc: 'We are hand-crafting your everlasting bouquet.', icon: Hammer },
  { id: 'READY', title: 'Ready for Dispatch', desc: 'Your order is packed and waiting for the courier.', icon: Package },
  { id: 'SHIPPED', title: 'On the Way', desc: 'Your order is out for delivery.', icon: Truck },
  { id: 'DELIVERED', title: 'Delivered', desc: 'Enjoy your beautiful bouquet!', icon: CheckCircle2 }
];

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const requestId=useRef(0);const lastAutomatic=useRef('');
  
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [order, setOrder] = useState<{orderNumber:string;status:string;createdAt:Date;infinidisState:string|null;fulfillment:string}|null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (value:string,updateUrl=true) => {
    const reference=value.trim().toUpperCase();if(!reference)return;
    const attempt=++requestId.current;setLoading(true);setError(null);setOrder(null);
    try{const result=await getOrderStatus(reference);if(attempt!==requestId.current)return;
      if(result.error)setError(result.error);else if(result.order){setOrder(result.order);if(updateUrl){lastAutomatic.current=reference;const url=new URL(window.location.href);url.searchParams.set('order',reference);window.history.replaceState({},'',url);}}
    }catch{if(attempt===requestId.current)setError('Tracking could not be loaded. Please try again.');}finally{if(attempt===requestId.current)setLoading(false);}
  },[]);
  const reference=searchParams.get('order')||'';
  useEffect(()=>{if(!reference||lastAutomatic.current===reference)return;lastAutomatic.current=reference;void handleSearch(reference,false);},[reference,handleSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(orderNumber);
  };

  const steps=STATUS_STEPS.filter(step=>order?.fulfillment==='DELIVERY'||step.id!=='SHIPPED').map(step=>order?.fulfillment==='PICKUP'&&step.id==='READY'?{...step,title:'Ready for pickup',desc:'Your order is ready. Contact us to arrange collection.'}:order?.fulfillment==='PICKUP'&&step.id==='DELIVERED'?{...step,title:'Picked up',desc:'Your order has been collected. Enjoy your bouquet!'}:order?.fulfillment==='HAND_DELIVERY'&&step.id==='READY'?{...step,title:'Ready for handover',desc:'Your order is ready. We’ll arrange the handover with you.'}:step);
  const currentStep=order?order.status==='COMPLETED'?steps.length-1:steps.findIndex(step=>step.id===(order.status==='PROCESSING'?'IN_PRODUCTION':order.status)):-1;
  const fillPercentage=currentStep>=0?(currentStep/(steps.length-1))*100:0;

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
                
                {steps.map((step, index) => {
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
