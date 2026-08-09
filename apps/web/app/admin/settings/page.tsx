import React from 'react';
import { db } from '@stemory/database';
import styles from '../dashboard.module.css';
import { setSiteMode } from './actions';

const MODE_CONFIG = {
  LIVE:        { label: 'Live',        bg: '#E8F5E9', color: '#1B5E20', desc: 'Store is fully open. All pages accessible.' },
  WAITLIST:    { label: 'Waitlist',    bg: '#FFF8E1', color: '#E65100', desc: 'Public is redirected to the email capture waitlist page.' },
  MAINTENANCE: { label: 'Maintenance', bg: '#FCE4EC', color: '#880E4F', desc: 'Store is offline for all visitors.' },
  DRAFT:       { label: 'Draft',       bg: '#F3E5F5', color: '#4A148C', desc: 'Internal preview mode. Admin access only.' },
} as const;

export default async function AdminSettingsPage() {
  const settings = await db.query.siteSettings.findFirst();
  const currentMode = (settings?.mode ?? 'WAITLIST') as keyof typeof MODE_CONFIG;

  return (
    <div className={styles.dashboard}>
      <header style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500 }}>Store Settings</h1>
      </header>

      {/* Site Mode */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Site Mode</h3>
        <p style={{ color: '#7A7571', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Controls what visitors see when they land on the storefront. Changes take effect immediately.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {(Object.keys(MODE_CONFIG) as (keyof typeof MODE_CONFIG)[]).map((mode) => {
            const cfg = MODE_CONFIG[mode];
            const isActive = currentMode === mode;
            return (
              <form key={mode} action={setSiteMode.bind(null, mode)}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: isActive ? `2px solid ${cfg.color}` : '2px solid #EAE6DF',
                    background: isActive ? cfg.bg : 'white',
                    textAlign: 'left',
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-sans)',
                  }}
                  disabled={isActive}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
                    <strong style={{ fontSize: '0.95rem', color: cfg.color }}>{cfg.label}</strong>
                    {isActive && <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>ACTIVE</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#7A7571', margin: 0, lineHeight: 1.5 }}>{cfg.desc}</p>
                </button>
              </form>
            );
          })}
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#7A7571' }}>
          Last updated: {settings ? new Date(settings.updatedAt).toLocaleString('en-GB', { timeZone: 'Africa/Casablanca' }) : 'Never'}
        </p>
      </div>
    </div>
  );
}
