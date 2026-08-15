import { db } from '@stemory/database';
import styles from '../../dashboard.module.css';
import { createAnnouncement } from '../actions';
import AnnouncementEditorForm from '../AnnouncementEditorForm';

export default async function NewAnnouncementPage(props: { searchParams: { templateId?: string } }) {
  const templates = await db.query.announcementTemplate.findMany({ where: (table, { eq }) => eq(table.active, true), orderBy: (table, { asc }) => [asc(table.name)] });
  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 500 }}>New Announcement</h1>
      </header>
      <AnnouncementEditorForm action={createAnnouncement} templates={templates} preselectedTemplateId={props.searchParams?.templateId} />
    </div>
  );
}
