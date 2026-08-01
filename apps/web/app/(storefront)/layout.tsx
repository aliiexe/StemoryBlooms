import { Header, Footer } from "@stemory/ui";
import { ClerkAuthSlot } from "./ClerkAuthSlot";
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@stemory/database';

const prisma = new PrismaClient();

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  let isAdmin = false;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { role: true }
    });
    isAdmin = user?.role?.name === 'ADMIN';
  }

  return (
    <>
      <Header authSlot={<ClerkAuthSlot isAdmin={isAdmin} />} />
      <main style={{ minHeight: '100vh' }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
