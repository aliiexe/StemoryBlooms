import { db, announcement as announcementTable, eq, and, or, isNull, lte, gte, asc } from '@stemory/database';
import AnnouncementCarousel from './AnnouncementCarousel';

async function getActiveAnnouncements() {
  const settings = await db.query.announcementBarSettings.findFirst();
  if (!settings?.enabled) return { announcements: [], settings: null };

  const now = new Date();
  const announcements = await db.query.announcement.findMany({
    where: and(
      eq(announcementTable.status, 'ACTIVE'),
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

export default async function AnnouncementBar() {
  let result:Awaited<ReturnType<typeof getActiveAnnouncements>>;
  try{result=await getActiveAnnouncements();}catch{return null;}
  if(!result.settings||!result.announcements.length)return null;
  return <div id="announcement-bar" role="region" aria-label="Announcements"><AnnouncementCarousel announcements={result.announcements} settings={result.settings}/></div>;
}
