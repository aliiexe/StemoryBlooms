import React from 'react';
import { db, deliveryZone } from '@stemory/database';
import { asc } from 'drizzle-orm';
import styles from '../../dashboard.module.css';
import { saveDeliveryZone, deleteDeliveryZone, toggleDeliveryZone } from './actions';
import Link from 'next/link';

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '10px',
  border: '1px solid #E2DDD6',
  backgroundColor: '#FDFBF7',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  color: '#3A3531',
  boxSizing: 'border-box' as const,
};

export default async function DeliveryZonesPage() {
  const zones = await db.query.deliveryZone.findMany({
    orderBy: [asc(deliveryZone.name)],
  });

  const activeCount = zones.filter(z => z.isActive).length;

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Link href="/admin/deliveries" style={{ fontSize: '0.85rem', color: '#7A7571', textDecoration: 'none' }}>← Deliveries</Link>
          </div>
          <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem', margin: 0 }}>Delivery Zones</h1>
          <p style={{ margin: '0.4rem 0 0', color: '#7A7571', fontSize: '0.9rem' }}>
            {zones.length} zones · {activeCount} active — these appear as city options at checkout
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Add zone form */}
        <div className={styles.card} style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: '#3A3531' }}>Add New Zone</h3>
          <form action={async (formData) => { 'use server'; await saveDeliveryZone(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 500, color: '#5A5551' }}>City / Zone Name *</label>
              <input name="name" required placeholder="Casablanca" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 500, color: '#5A5551' }}>Delivery Fee (MAD) *</label>
              <input name="fee" type="number" required min="0" placeholder="30" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.82rem', fontWeight: 500, color: '#5A5551' }}>Estimated Delivery Time</label>
              <input name="deliveryTime" placeholder="1–2 business days" style={inputStyle} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.9rem', color: '#3A3531' }}>
              <input type="checkbox" name="isActive" defaultChecked />
              Active (visible at checkout)
            </label>
            <button type="submit" className={styles.submitBtn} style={{ margin: 0 }}>Add Zone</button>
          </form>
        </div>

        {/* Zones list */}
        <div className={styles.card} style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#3A3531' }}>All Zones</h3>
            <span style={{ fontSize: '0.82rem', color: '#9A9591' }}>{zones.length} total</span>
          </div>

          {zones.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#B0A89E', fontSize: '0.9rem', border: '1px dashed #E2DDD6', borderRadius: '10px' }}>
              No delivery zones yet. Add one to enable checkout.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {zones.map((zone) => (
                <div key={zone.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1rem', borderRadius: '10px', border: '1px solid #EAE6DF', backgroundColor: zone.isActive ? '#FDFBF7' : '#F7F5F2', opacity: zone.isActive ? 1 : 0.65 }}>
                  {/* Toggle active */}
                  <form action={async () => { 'use server'; await toggleDeliveryZone(zone.id, !zone.isActive); }}>
                    <button type="submit" title={zone.isActive ? 'Deactivate' : 'Activate'} style={{ width: '36px', height: '20px', borderRadius: '999px', border: 'none', cursor: 'pointer', backgroundColor: zone.isActive ? '#5F7161' : '#D0CBC3', position: 'relative', flexShrink: 0, padding: 0 }}>
                      <span style={{ position: 'absolute', top: '2px', left: zone.isActive ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s' }} />
                    </button>
                  </form>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#3A3531' }}>{zone.name}</span>
                      {!zone.isActive && <span style={{ fontSize: '0.72rem', color: '#9A9591', backgroundColor: '#EEEBE6', padding: '1px 7px', borderRadius: '999px' }}>Inactive</span>}
                    </div>
                    {zone.deliveryTime && <span style={{ fontSize: '0.8rem', color: '#7A7571' }}>{zone.deliveryTime}</span>}
                  </div>

                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#5F7161', flexShrink: 0 }}>{zone.fee} MAD</span>

                  {/* Edit inline form */}
                  <details style={{ flexShrink: 0 }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#7A7571', listStyle: 'none', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid #E2DDD6', backgroundColor: '#F5F2EC' }}>Edit</summary>
                    <div style={{ position: 'absolute', zIndex: 10, marginTop: '0.5rem', backgroundColor: '#fff', border: '1px solid #EAE6DF', borderRadius: '12px', padding: '1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '280px' }}>
                      <form action={async (formData) => { 'use server'; await saveDeliveryZone(formData); }} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input type="hidden" name="id" value={zone.id} />
                        <input name="name" defaultValue={zone.name} required style={inputStyle} />
                        <input name="fee" type="number" defaultValue={zone.fee} required style={inputStyle} />
                        <input name="deliveryTime" defaultValue={zone.deliveryTime ?? ''} placeholder="Delivery time" style={inputStyle} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                          <input type="checkbox" name="isActive" defaultChecked={zone.isActive} />
                          Active
                        </label>
                        <button type="submit" className={styles.submitBtn} style={{ margin: 0, padding: '0.6rem' }}>Save</button>
                      </form>
                    </div>
                  </details>

                  <form action={async () => { 'use server'; await deleteDeliveryZone(zone.id); }}>
                    <button type="submit" style={{ background: 'none', border: 'none', color: '#C62828', cursor: 'pointer', fontSize: '0.8rem', padding: '0.25rem 0.5rem', borderRadius: '6px', flexShrink: 0 }}>Delete</button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
