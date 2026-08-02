import { prisma } from '@stemory/database';
import styles from '../../dashboard.module.css';
import { createAnnouncement } from '../actions';
import AnnouncementEditorForm from '../AnnouncementEditorForm';

export default async function NewAnnouncementPage() {
  const templates = await prisma.announcementTemplate.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500 }}>New Announcement</h1>
      </header>
      <AnnouncementEditorForm action={createAnnouncement} templates={templates} />
    </div>
  );
}
