import { prisma } from '@stemory/database';
import { Suspense } from 'react';
import AnnouncementCarousel from './AnnouncementCarousel';

async function getActiveAnnouncements(pathname?: string) {
  const settings = await prisma.announcementBarSettings.findFirst();
  if (!settings?.enabled) return { announcements: [], settings: null };

  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      status: 'ACTIVE',
      showDesktop: true,
      OR: [
        { startAt: null },
        { startAt: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { noEndDate: true },
            { endAt: null },
            { endAt: { gte: now } }
          ]
        }
      ]
    },
    orderBy: { order: 'asc' }
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
