import ReturnLink from '@/components/navigation/ReturnLink';
import { assertAdmin } from '@/lib/user-sync';
import { db } from '@stemory/database';
import { notFound } from 'next/navigation';
import styles from '../../dashboard.module.css';
import { updateAnnouncement } from '../actions';
import AnnouncementEditorForm from '../AnnouncementEditorForm';

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  await assertAdmin();
  const { id } = await params;
  const [ann, templates] = await Promise.all([
    db.query.announcement.findFirst({ where: (table, { eq }) => eq(table.id, id) }),
    db.query.announcementTemplate.findMany({ where: (table, { eq }) => eq(table.active, true), orderBy: (table, { asc }) => [asc(table.name)] }),
  ]);

  if (!ann) notFound();

  const actionWithId = updateAnnouncement.bind(null, id);

  return (
    <div className={styles.dashboard}>
      <header className={styles.pageHeader}><div><ReturnLink href="/admin/announcements" style={{fontSize:12,color:'#7e8e6d',textDecoration:'none'}}>← Announcements</ReturnLink><h1 className={styles.pageTitle}>Edit announcement</h1><p>Review your message and presentation before applying changes.</p></div></header>
      <AnnouncementEditorForm
        action={actionWithId}
        templates={templates}
        existing={{
          ...ann,
          updatedAt:ann.updatedAt.toISOString(),
          startAt: ann.startAt?.toISOString() ?? undefined,
          endAt: ann.endAt?.toISOString() ?? undefined,
          countdownTarget: ann.countdownTarget?.toISOString() ?? undefined,
          countdownReplacementText: ann.countdownReplacementText ?? undefined,
          highlightedText: ann.highlightedText ?? undefined,
          ctaLabel: ann.ctaLabel ?? undefined,
          linkUrl: ann.linkUrl ?? undefined,
          decorativeAsset: ann.decorativeAsset ?? undefined,
          templateId: ann.templateId ?? undefined,
        }}
      />
    </div>
  );
}
