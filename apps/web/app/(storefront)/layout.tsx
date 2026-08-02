import { Header, Footer } from "@stemory/ui";
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@stemory/database';
import { Suspense } from 'react';
import { ClerkAuthSlot } from './ClerkAuthSlot';
import WaitlistPage from './WaitlistPage';
import MaintenancePage from './MaintenancePage';
import AnnouncementBar from './components/AnnouncementBar';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, { userId }] = await Promise.all([
    prisma.siteSettings.findFirst(),
    auth()
  ]);

  const isWaitlist = settings?.mode === 'WAITLIST';
  const isMaintenance = settings?.mode === 'MAINTENANCE';

  let isAdmin = false;
  if (userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { role: true }
      });
      isAdmin = user?.role?.name === 'ADMIN';
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

