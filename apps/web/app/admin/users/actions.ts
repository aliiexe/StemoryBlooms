'use server';

import { db, eq, sql, user as userTable, role as roleTable } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { recordAuditLog } from '@/lib/audit';
import { assertAdmin } from '@/lib/user-sync';

export async function updateUserRole(formData: FormData) {
  const actor = await assertAdmin();
  const userId = formData.get('userId')?.toString();
  const nextRole = formData.get('nextRole')?.toString();

  if (!userId || !nextRole || !['ADMIN', 'CUSTOMER'].includes(nextRole)) return { error: 'Choose a valid role.' };

  const targetRole = await db.query.role.findFirst({ where: eq(roleTable.name, nextRole) });
  if (!targetRole) {
    return { error: 'The requested role is not configured.' };
  }

  try {
    await db.transaction(async tx => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('admin-role-changes', 0))`);
      const currentActor = await tx.query.user.findFirst({ where: eq(userTable.id, actor.id), with: { role: true } });
      if (currentActor?.role?.name !== 'ADMIN') throw new Error('Admin access is required.');
      const existing = await tx.query.user.findFirst({ where: eq(userTable.id, userId), with: { role: true } });
      if (!existing) throw new Error('User not found.');
      if (existing.role?.name === 'ADMIN' && nextRole === 'CUSTOMER') {
        const admins = await tx.select({ id: userTable.id }).from(userTable).innerJoin(roleTable, eq(userTable.roleId, roleTable.id)).where(eq(roleTable.name, 'ADMIN'));
        if (admins.length <= 1) throw new Error('Add another administrator before removing the last admin.');
      }
      await tx.update(userTable).set({ roleId: targetRole.id, updatedAt: new Date() }).where(eq(userTable.id, userId));
    });
  } catch (error) { return { error: error instanceof Error ? error.message : 'Unable to change role.' }; }

  revalidatePath('/admin/users');
  await recordAuditLog({
    action: 'UPDATE',
    target: 'USER_ROLE',
    summary: `Updated user role to ${nextRole}`,
    details: { userId, nextRole },
  });
  return { success: true };
}
