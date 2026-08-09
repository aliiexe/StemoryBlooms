import { db, eq, sql, announcement, announcementBarSettings, asc, desc } from '@stemory/database';
import Link from 'next/link';
import styles from '../dashboard.module.css';
import {
  publishAnnouncement, pauseAnnouncement,
  archiveAnnouncement, duplicateAnnouncement
} from './actions';
import DeleteButton from './DeleteButton';

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  DRAFT:     { bg: '#F5F5F5', color: '#616161' },
  SCHEDULED: { bg: '#E3F2FD', color: '#0D47A1' },
  ACTIVE:    { bg: '#E8F5E9', color: '#1B5E20' },
  PAUSED:    { bg: '#FFF8E1', color: '#E65100' },
  EXPIRED:   { bg: '#FCE4EC', color: '#880E4F' },
  ARCHIVED:  { bg: '#ECEFF1', color: '#37474F' },
};

export default async function Page(props: { searchParams: { page?: string, limit?: string } }) {
  const page = Number(props.searchParams.page) || 1;
  const limit = Number(props.searchParams.limit) || 10;
  const offset = (page - 1) * limit;

  const [announcements, settings] = await Promise.all([
    db.query.announcement.findMany({ orderBy: [asc(announcement.order), desc(announcement.createdAt)] }),
    db.query.announcementBarSettings.findFirst(),
  ]);

  return (
    <div className={styles.dashboard}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-editorial)', fontWeight: 500 }}>Announcement Bar</h1>
          <p style={{ color: '#7A7571', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Bar is currently <strong>{settings?.enabled ? '🟢 Enabled' : '🔴 Disabled'}</strong>.
            <Link href="/admin/announcements/settings" style={{ marginLeft: '0.5rem', color: 'var(--brand-primary)', fontSize: '0.85rem' }}>
              Manage settings →
            </Link>
          </p>
        </div>
        <Link
          href="/admin/announcements/new"
          style={{
            padding: '0.65rem 1.25rem',
            background: 'var(--brand-primary)',
            color: 'white',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          + New Announcement
        </Link>
      </header>

      <div className={styles.card}>
        {announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#7A7571' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>No announcements yet.</p>
            <Link href="/admin/announcements/new" style={{ color: 'var(--brand-primary)' }}>
              Create your first announcement →
            </Link>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Message</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(announcements as Array<(typeof announcements)[number]>).map((ann) => {
                const sc = STATUS_COLORS[ann.status] ?? STATUS_COLORS.DRAFT;
                return (
                  <tr key={ann.id}>
                    <td style={{ color: '#7A7571', fontSize: '0.8rem' }}>{ann.order}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span
                          style={{
                            width: 10, height: 10, borderRadius: '50%', display: 'inline-block',
                            background: ann.backgroundColor, border: '1px solid #EAE6DF', flexShrink: 0
                          }}
                        />
                        <strong style={{ fontSize: '0.875rem' }}>{ann.internalTitle}</strong>
                      </div>
                    </td>
                    <td style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#7A7571', fontSize: '0.85rem' }}>
                      {ann.message}
                    </td>
                    <td>
                      <span className={styles.badge} style={{ background: sc.bg, color: sc.color }}>{ann.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: '#7A7571' }}>
                      {ann.startAt ? new Date(ann.startAt).toLocaleDateString('en-GB') : '—'}
                      {ann.endAt && !ann.noEndDate ? ` → ${new Date(ann.endAt).toLocaleDateString('en-GB')}` : ''}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link href={`/admin/announcements/${ann.id}`} style={actionStyle()}>Edit</Link>
                        {ann.status !== 'ACTIVE' && ann.status !== 'ARCHIVED' && (
                          <form action={publishAnnouncement.bind(null, ann.id)} style={{ display: 'inline' }}>
                            <button type="submit" style={actionStyle('#E8F5E9', '#1B5E20')}>Publish</button>
                          </form>
                        )}
                        {ann.status === 'ACTIVE' && (
                          <form action={pauseAnnouncement.bind(null, ann.id)} style={{ display: 'inline' }}>
                            <button type="submit" style={actionStyle('#FFF8E1', '#E65100')}>Pause</button>
                          </form>
                        )}
                        <form action={duplicateAnnouncement.bind(null, ann.id)} style={{ display: 'inline' }}>
                          <button type="submit" style={actionStyle()}>Duplicate</button>
                        </form>
                        {ann.status !== 'ARCHIVED' && (
                          <form action={archiveAnnouncement.bind(null, ann.id)} style={{ display: 'inline' }}>
                            <button type="submit" style={actionStyle()}>Archive</button>
                          </form>
                        )}
                        <DeleteButton id={ann.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function actionStyle(bg = '#F5F5F5', color = '#4A4A4A'): React.CSSProperties {
  return {
    padding: '3px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 500,
    background: bg, color, border: 'none', cursor: 'pointer', textDecoration: 'none',
    display: 'inline-block', fontFamily: 'var(--font-sans)',
  };
}
