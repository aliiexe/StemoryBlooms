import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminLayoutUI from './AdminLayoutUI';
import { getUserRoleName, syncClerkUserToDatabase } from '@/lib/user-sync';

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

  return <AdminLayoutUI>{children}</AdminLayoutUI>;
}
