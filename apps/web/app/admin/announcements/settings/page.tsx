import { assertAdmin } from '@/lib/user-sync';
import { db } from '@stemory/database';
import Link from 'next/link';
import styles from '../../dashboard.module.css';
import { updateBarSettings } from '../actions';
import SettingsForm from './SettingsForm';

export default async function AnnouncementSettingsPage() {
  await assertAdmin();
  const settings = await db.query.announcementBarSettings.findFirst();

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}><div><Link href="/admin/announcements" style={{fontSize:12,color:'#7e8e6d',textDecoration:'none'}}>← Announcements</Link><h1 className={styles.pageTitle}>Announcement bar settings</h1><p>Review your message and presentation before applying changes.</p></div></header>

      <div className={styles.card} style={{ maxWidth: 700 }}>
        <SettingsForm settings={settings} updateAction={updateBarSettings} />
      </div>
    </div>
  );
}
