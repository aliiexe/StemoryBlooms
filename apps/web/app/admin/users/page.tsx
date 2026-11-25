import { assertAdmin } from '@/lib/user-sync';
import { auth } from '@clerk/nextjs/server';
import { db } from '@stemory/database';
import { redirect } from 'next/navigation';
import UsersClient from './UsersClient';

async function getUsers() {
  return db.query.user.findMany({
    with: { role: true },
    orderBy: (users, { desc }) => [desc(users.createdAt)],
  });
}

export default async function AdminUsersPage() {
  const actor=await assertAdmin();
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const users = await getUsers();

  return <UsersClient users={users} currentUserId={actor.id} />;
}
