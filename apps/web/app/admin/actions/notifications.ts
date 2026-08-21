'use server';

import { revalidatePath } from 'next/cache';
import { db, adminNotification } from '@stemory/database';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { assertAdmin } from '@/lib/user-sync';

export async function getNotifications() {
  await assertAdmin();
  const notifications = await db.query.adminNotification.findMany({
    orderBy: [desc(adminNotification.createdAt)],
    limit: 50,
  });
  return notifications;
}

export async function markNotificationAsRead(id: string) {
  await assertAdmin();
  await db.update(adminNotification).set({ isRead: true }).where(eq(adminNotification.id, id));
  revalidatePath('/admin');
  return { success: true };
}

export async function markAllNotificationsAsRead() {
  await assertAdmin();
  await db.update(adminNotification).set({ isRead: true }).where(eq(adminNotification.isRead, false));
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteNotification(id: string) {
  await assertAdmin();
  await db.delete(adminNotification).where(eq(adminNotification.id, id));
  revalidatePath('/admin');
  return { success: true };
}

export async function createNotification(type: string, title: string, message: string) {
  await assertAdmin();
  await db.insert(adminNotification).values({
    id: crypto.randomUUID(),
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date(),
  });
  revalidatePath('/admin');
}
