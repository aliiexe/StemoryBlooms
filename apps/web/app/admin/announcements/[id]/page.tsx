import { db } from '@stemory/database';
import { notFound } from 'next/navigation';
import styles from '../../dashboard.module.css';
import { updateAnnouncement } from '../actions';
import AnnouncementEditorForm from '../AnnouncementEditorForm';

export default async function EditAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [ann, templates] = await Promise.all([
    db.query.announcement.findFirst({ where: (table, { eq }) => eq(table.id, id) }),
    db.query.announcementTemplate.findMany({ where: (table, { eq }) => eq(table.active, true), orderBy: (table, { asc }) => [asc(table.name)] }),
  ]);

  if (!ann) notFound();

  const actionWithId = updateAnnouncement.bind(null, id);

  return (
    <div className={styles.dashboard}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500 }}>Edit: {ann.internalTitle}</h1>
      </header>
      <AnnouncementEditorForm
        action={actionWithId}
        templates={templates}
        existing={{
          ...ann,
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
