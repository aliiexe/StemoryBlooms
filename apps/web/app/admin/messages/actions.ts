'use server';

import { db } from '@stemory/database';
import { contactMessage } from '@stemory/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { recordAuditLog } from '@/lib/audit';
import { assertAdmin } from '@/lib/user-sync';

export async function markMessageRead(id: string) {
  await assertAdmin();
  await db.update(contactMessage).set({ status: 'READ' }).where(eq(contactMessage.id, id));
  revalidatePath('/admin/messages');
  await recordAuditLog({
    action: 'UPDATE',
    target: 'MESSAGE',
    summary: `Marked message as read`,
    details: { messageId: id },
  });
}

export async function markMessageResolved(id: string) {
  await assertAdmin();
  await db.update(contactMessage).set({ status: 'RESOLVED' }).where(eq(contactMessage.id, id));
  revalidatePath('/admin/messages');
  await recordAuditLog({
    action: 'UPDATE',
    target: 'MESSAGE',
    summary: `Marked message as resolved`,
    details: { messageId: id },
  });
}
