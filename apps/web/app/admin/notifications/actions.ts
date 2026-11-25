'use server';
import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { retryNotificationJob } from '@/lib/commerce/notification-jobs';
import { processNotificationOutbox } from '@/lib/commerce/outbox';
export async function retryNotification(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await retryNotificationJob(input, actor.id); after(async () => { await processNotificationOutbox(1, undefined, result.id); }); revalidatePath('/admin/notifications'); return { success: true as const }; }
  catch (error) { return { error: error instanceof Error ? error.message : 'The retry could not be queued.' }; }
}
