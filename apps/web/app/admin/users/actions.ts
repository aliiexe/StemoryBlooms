'use server';

import { db, eq, user as userTable, role as roleTable } from '@stemory/database';
import { revalidatePath } from 'next/cache';

export async function updateUserRole(formData: FormData) {
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
