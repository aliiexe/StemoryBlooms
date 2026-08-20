import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminLayoutUI from './AdminLayoutUI';
import { getUserRoleName, syncClerkUserToDatabase } from '@/lib/user-sync';
import { db } from '@stemory/database';
import { Toaster } from 'sonner';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  try {
    await syncClerkUserToDatabase(userId);
    const roleName = await getUserRoleName(userId);

    if (roleName !== 'ADMIN') {
      redirect('/');
    }
  } catch (err) {
    console.error('Failed to verify admin status:', err);
    redirect('/');
  }

  const settings = await db.query.siteSettings.findFirst();
  const currentMode = (settings?.mode ?? 'LIVE') as 'LIVE' | 'WAITLIST' | 'MAINTENANCE' | 'DRAFT';

  return (
    <>
      <Toaster position="top-right" richColors />
      <AdminLayoutUI currentMode={currentMode}>{children}</AdminLayoutUI>
    </>
  );
}
