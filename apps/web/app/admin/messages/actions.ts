'use server';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { changeSupportStatus } from '@/lib/commerce/support';
export async function updateMessageStatus(input: unknown) {
  const actor = await assertAdmin();
  try { await changeSupportStatus('MESSAGE', input, actor.id); revalidatePath('/admin/messages'); return { success: true as const }; }
  catch (error) { return { error: error instanceof Error ? error.message : 'Message could not be updated.' }; }
}
