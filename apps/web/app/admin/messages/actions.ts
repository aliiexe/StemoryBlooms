'use server';

import { db } from '@stemory/database';
import { contactMessage } from '@stemory/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function markMessageRead(id: string) {
  await db.update(contactMessage).set({ status: 'READ' }).where(eq(contactMessage.id, id));
  revalidatePath('/admin/messages');
}

export async function markMessageResolved(id: string) {
  await db.update(contactMessage).set({ status: 'RESOLVED' }).where(eq(contactMessage.id, id));
  revalidatePath('/admin/messages');
}
