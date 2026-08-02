import { Header, Footer } from "@stemory/ui";
import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@stemory/database';
import { Suspense } from 'react';
import { ClerkAuthSlot } from './ClerkAuthSlot';
import WaitlistPage from './WaitlistPage';
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

  if (isWaitlist) {
    return (
      <ClerkProvider>
        <WaitlistPage />
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider>
      <Suspense fallback={null}>
        <AnnouncementBar />
      </Suspense>
      <Header authSlot={<ClerkAuthSlot isAdmin={isAdmin} />} />
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
      <Footer />
    </ClerkProvider>
  );
}

