import React from 'react';
import { db, deliveryCompany } from '@stemory/database';
import { asc } from 'drizzle-orm';
import styles from '../dashboard.module.css';
import { deleteDeliveryCompany, saveDeliveryCompany, setSiteMode } from './actions';
import { HeroSettingsForm } from './HeroSettingsForm';
import { CustomBuilderSettingsForm } from './CustomBuilderSettingsForm';

const MODE_CONFIG = {
  LIVE:        { label: 'Live',        bg: '#E8F5E9', color: '#1B5E20', desc: 'Store is fully open. All pages accessible.' },
  WAITLIST:    { label: 'Waitlist',    bg: '#FFF8E1', color: '#E65100', desc: 'Public is redirected to the email capture waitlist page.' },
  MAINTENANCE: { label: 'Maintenance', bg: '#FCE4EC', color: '#880E4F', desc: 'Store is offline for all visitors.' },
} as const;

export default async function AdminSettingsPage() {
  const settings = await db.query.siteSettings.findFirst();
  const currentMode = (settings?.mode ?? 'WAITLIST') as keyof typeof MODE_CONFIG;
  const companies = await db.query.deliveryCompany.findMany({
    orderBy: [asc(deliveryCompany.name)],
  });

  return (
    <div className={styles.dashboard}>
      <header style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 500 }}>Store Settings</h1>
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
            const actionWithMode = async () => {
              'use server';
              await setSiteMode(mode);
            };
            return (
              <form key={mode} action={actionWithMode}>
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '1.5rem 1.25rem',
                    borderRadius: '16px',
                    border: isActive ? `2px solid ${cfg.color}` : '1px solid #EAE6DF',
                    background: isActive ? cfg.bg : 'white',
                    textAlign: 'left',
                    cursor: isActive ? 'default' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontFamily: 'var(--font-sans)',
                    boxShadow: isActive ? `0 4px 12px ${cfg.color}15` : '0 2px 4px rgba(0,0,0,0.02)',
                    opacity: isActive ? 1 : 0.85,
                  }}
                  disabled={isActive}
                  className={styles.modeBtn}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: cfg.color, display: 'inline-block', boxShadow: `0 0 0 3px ${cfg.bg}` }} />
                    <strong style={{ fontSize: '1rem', color: isActive ? cfg.color : '#3A3531', fontWeight: 600 }}>{cfg.label}</strong>
                    {isActive && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', letterSpacing: '0.05em', background: cfg.color, color: 'white', padding: '3px 8px', borderRadius: '20px', fontWeight: 600 }}>ACTIVE</span>}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: isActive ? cfg.color : '#7A7571', margin: 0, lineHeight: 1.5, opacity: isActive ? 0.9 : 1 }}>{cfg.desc}</p>
                </button>
              </form>
            );
          })}
        </div>

        <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#7A7571' }}>
          Last updated: {settings ? new Date(settings.updatedAt).toLocaleString('en-GB', { timeZone: 'Africa/Casablanca' }) : 'Never'}
        </p>
      </div>

      {/* Hero Slideshow Configuration */}
      <HeroSettingsForm 
        initialImages={((settings?.config as any)?.heroImages as string[]) || ['/hero-bouquet.png']} 
        initialFadeSpeed={((settings?.config as any)?.heroFadeSpeed as number) || 5} 
      />

      <CustomBuilderSettingsForm 
        initialBaseFee={((settings?.config as any)?.customBouquetBaseFee as number) ?? 19}
      />

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Delivery Companies</h3>
        <p style={{ color: '#7A7571', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Delivery fees are predefined by the delivery company and used during checkout as a separate line item.
        </p>

        <form action={async (formData) => { 'use server'; await saveDeliveryCompany(formData); }} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Company name</label>
            <input name="name" required placeholder="Rapid Delivery" style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Email</label>
            <input name="email" type="email" placeholder="contact@company.com" style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Contact</label>
            <input name="contact" placeholder="06 00 00 00 00" style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.9rem', color: '#5A5551' }}>Fee (MAD)</label>
            <input name="fee" type="number" min="0" required placeholder="50" style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.9rem', fontSize: '0.9rem', color: '#5A5551' }}>
              <input name="isActive" type="checkbox" defaultChecked />
              Active
            </label>
            <button type="submit" className={styles.submitBtn} style={{ margin: 0, width: 'auto', paddingInline: '1.25rem' }}>Add company</button>
          </div>
        </form>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {companies.map((company) => (
            <div key={company.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', padding: '1rem', borderRadius: '14px', border: '1px solid #EAE6DF', backgroundColor: company.isActive ? '#FFFFFF' : '#FAFAFA' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <strong style={{ color: '#3A3531' }}>{company.name}</strong>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '999px', backgroundColor: company.isActive ? '#E8F5E9' : '#F5F5F5', color: company.isActive ? '#1B5E20' : '#616161' }}>{company.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div style={{ color: '#7A7571', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                  Fee: {company.fee} MAD{company.email ? ` · ${company.email}` : ''}{company.contact ? ` · ${company.contact}` : ''}
                </div>
              </div>
              <form action={async () => { 'use server'; await deleteDeliveryCompany(company.id); }}>
                <button type="submit" style={{ padding: '0.75rem 1rem', borderRadius: '999px', border: '1px solid #FFEBEE', backgroundColor: '#FFEBEE', color: '#C62828', cursor: 'pointer' }}>Delete</button>
              </form>
            </div>
          ))}

          {companies.length === 0 && (
            <div style={{ padding: '1.5rem', borderRadius: '14px', border: '1px dashed #D6CFE6', color: '#7A7571' }}>
              No delivery companies have been added yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
