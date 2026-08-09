import { db, announcementBarSettings as settingsTable, announcement as announcementTable, eq, and, or, isNull, lte, gte, asc } from '@stemory/database';
import { Suspense } from 'react';
import AnnouncementCarousel from './AnnouncementCarousel';

async function getActiveAnnouncements(pathname?: string) {
  const settings = await db.query.announcementBarSettings.findFirst();
  if (!settings?.enabled) return { announcements: [], settings: null };

  const now = new Date();
  const announcements = await db.query.announcement.findMany({
    where: and(
      eq(announcementTable.status, 'ACTIVE'),
      eq(announcementTable.showDesktop, true),
      or(
        isNull(announcementTable.startAt),
        lte(announcementTable.startAt, now)
      ),
      or(
        eq(announcementTable.noEndDate, true),
        isNull(announcementTable.endAt),
        gte(announcementTable.endAt, now)
      )
    ),
    orderBy: [asc(announcementTable.order)]
  });

  return { announcements, settings };
}

export default async function AnnouncementBar({ pathname }: { pathname?: string }) {
  try {
    const { announcements, settings } = await getActiveAnnouncements(pathname);
    if (!settings || announcements.length === 0) return null;

    return (
      <div id="announcement-bar" role="region" aria-label="Announcements">
        <AnnouncementCarousel announcements={announcements} settings={settings} />
      </div>
    );
  } catch {
    // Never break the layout if announcement fetch fails
    return null;
  }
}
