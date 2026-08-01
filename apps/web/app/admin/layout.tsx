import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PrismaClient } from '@stemory/database';
import AdminLayoutUI from './AdminLayoutUI';

const prisma = new PrismaClient();

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { role: true }
    });

    if (user?.role?.name !== 'ADMIN') {
      redirect('/');
    }
  } catch (err) {
    console.error('Failed to verify admin status:', err);
    redirect('/');
  }

  return <AdminLayoutUI>{children}</AdminLayoutUI>;
}
