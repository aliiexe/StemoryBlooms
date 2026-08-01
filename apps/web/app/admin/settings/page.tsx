import React from 'react';
import { PrismaClient } from '@stemory/database';
import styles from '../dashboard.module.css';

const prisma = new PrismaClient();

export default async function AdminSettingsPage() {
  const settings = await prisma.siteSettings.findFirst();

  return (
    <div className={styles.dashboard}>
      <header className={styles.shopHeader} style={{ padding: '0', marginBottom: '2rem' }}>
        <h1 className={styles.shopTitle} style={{ fontSize: '1.75rem' }}>Store Settings</h1>
      </header>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Global Configuration</h3>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Setting</th>
              <th>Value</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Store Mode</td>
              <td>
                <span className={styles.badge} style={{ backgroundColor: '#E0F7FA', color: '#006064' }}>
                  {settings?.mode || 'LIVE'}
                </span>
              </td>
              <td>{settings ? new Date(settings.updatedAt).toLocaleDateString() : 'Never'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
