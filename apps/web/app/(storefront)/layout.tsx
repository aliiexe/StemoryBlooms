import './storefront.css';
import { Header, Footer } from "@stemory/ui";
import { auth } from '@clerk/nextjs/server';
import { db } from '@stemory/database';
import { Suspense } from 'react';
import { ClerkAuthSlot } from './ClerkAuthSlot';
import WaitlistPage from './WaitlistPage';
import MaintenancePage from './MaintenancePage';
import AnnouncementBar from './components/AnnouncementBar';
import { getUserRoleName } from '@/lib/user-sync';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, { userId }] = await Promise.all([
    db.query.siteSettings.findFirst(),
    auth()
  ]);

  const isWaitlist = !settings || settings.mode === 'WAITLIST';
  const isMaintenance = settings?.mode === 'MAINTENANCE' || settings?.mode === 'DRAFT';

  const config = settings?.config as Record<string, unknown> | null;
  const heroImages = (config?.heroImages as string[]) || [];
  const heroFadeSpeed = (config?.heroFadeSpeed as number) || 5;

  let isAdmin = false;
  if (userId) {
    try {
      const roleName = await getUserRoleName(userId);
      isAdmin = roleName === 'ADMIN';
    } catch {}
  }

  // Admins can bypass waitlist/maintenance
  if (isWaitlist && !isAdmin) {
    return (
      <>
        <WaitlistPage heroImages={heroImages} heroFadeSpeed={heroFadeSpeed} />
      </>
    );
  }

  if (isMaintenance && !isAdmin) {
    return (
      <>
        <MaintenancePage heroImages={heroImages} heroFadeSpeed={heroFadeSpeed} />
      </>
    );
  }

  return (
    <>
      <div data-storefront>
      {/* Sticky top chrome: announcement bar + nav stick together as one unit */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, width: '100%' }}>
        {isAdmin && (isWaitlist || isMaintenance) && (
          <div style={{ backgroundColor: '#edf0e7', color: '#66765a', padding: '0.5rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 400 }}>
            Store preview · Visitors currently see the {isWaitlist?'waitlist':'maintenance'} page.
          </div>
        )}
        <Suspense fallback={null}>
          <AnnouncementBar />
        </Suspense>
        <Header isAdmin={isAdmin} authSlot={<ClerkAuthSlot isAdmin={isAdmin} />} />
      </div>
      <div id="store-content" style={{ minHeight: '70vh' }}>
        {children}
      </div>
      <Footer />
      </div>
    </>
  );
}

