import { Header, Footer } from "@stemory/ui";
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { db, siteSettings } from '@stemory/database';
import { Suspense } from 'react';
import { ClerkAuthSlot } from './ClerkAuthSlot';
import WaitlistPage from './WaitlistPage';
import MaintenancePage from './MaintenancePage';
import AnnouncementBar from './components/AnnouncementBar';
import { getUserRoleName, syncClerkUserToDatabase } from '@/lib/user-sync';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, { userId }] = await Promise.all([
    db.query.siteSettings.findFirst(),
    auth()
  ]);

  const isWaitlist = settings?.mode === 'WAITLIST';
  const isMaintenance = settings?.mode === 'MAINTENANCE';

  let isAdmin = false;
  if (userId) {
    try {
      await syncClerkUserToDatabase(userId);
      const roleName = await getUserRoleName(userId);
      isAdmin = roleName === 'ADMIN';
    } catch {}
  }

  // Admins can bypass waitlist/maintenance
  if (isWaitlist && !isAdmin) {
    return (
      <ClerkProvider>
        <WaitlistPage />
      </ClerkProvider>
    );
  }

  if (isMaintenance && !isAdmin) {
    return (
      <ClerkProvider>
        <MaintenancePage />
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider>
      {/* Sticky top chrome: announcement bar + nav stick together as one unit */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, width: '100%' }}>
        {isAdmin && (isWaitlist || isMaintenance) && (
          <div style={{ backgroundColor: '#FFEBEE', color: '#C62828', padding: '0.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
            ADMIN MODE: The public site is currently in {isWaitlist ? 'WAITLIST' : 'MAINTENANCE'} mode.
          </div>
        )}
        <Suspense fallback={null}>
          <AnnouncementBar />
        </Suspense>
        <Header authSlot={<ClerkAuthSlot isAdmin={isAdmin} />} />
      </div>
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
      <Footer />
    </ClerkProvider>
  );
}

