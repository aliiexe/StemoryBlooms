import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AdminLayoutUI from './AdminLayoutUI';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { getToken } = await auth();
  const token = await getToken();
  
  if (!token) {
    redirect('/');
  }

  // Fetch the role from the backend
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Admin Auth Failed: ${res.status} - ${errorText}`);
      redirect('/');
    }

    const user = await res.json();
    if (user.role?.name !== 'ADMIN') {
      redirect('/');
    }
  } catch (err) {
    console.error('Failed to verify admin status:', err);
    redirect('/');
  }

  return <AdminLayoutUI>{children}</AdminLayoutUI>;
}
