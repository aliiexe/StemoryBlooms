import { auth } from '@clerk/nextjs/server';
import { db, eq, user as userTable, role as roleTable } from '@stemory/database';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import UsersClient from './UsersClient';

async function getUsers() {
  return db.query.user.findMany({
    with: { role: true },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

export default async function AdminUsersPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const users = await getUsers();

  return <UsersClient users={users} />;
}
