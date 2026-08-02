import { Header, Footer } from "@stemory/ui";
import { ClerkProvider } from '@clerk/nextjs';
import { prisma } from '@stemory/database';
import { ClerkAuthSlot } from './ClerkAuthSlot';
import WaitlistPage from './WaitlistPage';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await prisma.siteSettings.findFirst();
  const isWaitlist = settings?.mode === 'WAITLIST';

  if (isWaitlist) {
    return (
      <ClerkProvider>
        <WaitlistPage />
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider>
      <Header authSlot={<ClerkAuthSlot />} />
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
      <Footer />
    </ClerkProvider>
  );
}
