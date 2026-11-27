import ReturnLink from '@/components/navigation/ReturnLink';
import { assertAdmin } from '@/lib/user-sync';
import { db } from '@stemory/database';
import styles from '../../dashboard.module.css';
import { createAnnouncement } from '../actions';
import AnnouncementEditorForm from '../AnnouncementEditorForm';

export default async function NewAnnouncementPage(props: { searchParams: Promise<{ templateId?: string }> }) {
  await assertAdmin();
  const query=await props.searchParams;
  const templates = await db.query.announcementTemplate.findMany({ where: (table, { eq }) => eq(table.active, true), orderBy: (table, { asc }) => [asc(table.name)] });
  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}><div><ReturnLink href="/admin/announcements" style={{fontSize:12,color:'#7e8e6d',textDecoration:'none'}}>← Announcements</ReturnLink><h1 className={styles.pageTitle}>Create announcement</h1><p>Save a draft, review it, then publish from the announcement list.</p></div></header>
      <AnnouncementEditorForm action={createAnnouncement} templates={templates} preselectedTemplateId={query.templateId} />
    </div>
  );
}
