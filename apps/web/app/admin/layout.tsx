import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@stemory/database';
import AdminLayoutUI from './AdminLayoutUI';



export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/');
  }

  try {
    const user = await db.query.user.findFirst({
      where: (user, { eq }) => eq(user.clerkId, userId),
      with: { role: true }
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
