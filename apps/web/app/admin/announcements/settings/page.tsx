import { assertAdmin } from '@/lib/user-sync';
import { db } from '@stemory/database';
import styles from '../../dashboard.module.css';
import { updateBarSettings } from '../actions';
import SettingsForm from './SettingsForm';

export default async function AnnouncementSettingsPage() {
  await assertAdmin();
  const settings = await db.query.announcementBarSettings.findFirst();

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 500 }}>Announcement Bar Settings</h1>
      </header>

      <div className={styles.card} style={{ maxWidth: 700 }}>
        <SettingsForm settings={settings} updateAction={updateBarSettings} />
      </div>
    </div>
  );
}
