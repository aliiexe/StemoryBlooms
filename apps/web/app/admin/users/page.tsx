import { auth } from '@clerk/nextjs/server';
import {  db, eq, user as userTable, role as roleTable , sql } from '@stemory/database';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function getUsers() {
  return db.query.user.findMany({
    with: { role: true },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

export default async function Page(props: { searchParams: { page?: string, limit?: string } }) {
  const page = Number(props.searchParams.page) || 1;
  const limit = Number(props.searchParams.limit) || 10;
  const offset = (page - 1) * limit;

  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const users = await getUsers();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h2 style={{ marginBottom: '0.25rem' }}>User Management</h2>
        <p style={{ margin: 0, color: '#666' }}>Review synced users and update their access level.</p>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Role</th>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.75rem 1rem' }}>
                  {user.firstName || user.lastName ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() : '—'}
                </td>
                <td style={{ padding: '0.75rem 1rem' }}>{user.email}</td>
                <td style={{ padding: '0.75rem 1rem' }}>{user.role?.name ?? 'CUSTOMER'}</td>
                <td style={{ padding: '0.75rem 1rem' }}>
                  <form action={updateUserRole}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="nextRole" value={user.role?.name === 'ADMIN' ? 'CUSTOMER' : 'ADMIN'} />
                    <button type="submit" style={{ border: '1px solid #d1d5db', background: 'white', borderRadius: '999px', padding: '0.35rem 0.75rem', cursor: 'pointer' }}>
                      {user.role?.name === 'ADMIN' ? 'Demote to Customer' : 'Promote to Admin'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export async function updateUserRole(formData: FormData) {
  'use server';

  const userId = formData.get('userId')?.toString();
  const nextRole = formData.get('nextRole')?.toString();

  if (!userId || !nextRole) {
    return;
  }

  const targetRole = await db.query.role.findFirst({ where: eq(roleTable.name, nextRole) });
  if (!targetRole) {
    return;
  }

  await db.update(userTable).set({ roleId: targetRole.id, updatedAt: new Date() }).where(eq(userTable.id, userId));

  revalidatePath('/admin/users');
}
