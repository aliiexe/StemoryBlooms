'use server';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { changeSupportStatus } from '@/lib/commerce/support';
export async function moderateReview(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await changeSupportStatus('REVIEW', input, actor.id); if (result.slug) revalidatePath(`/shop/${result.slug}`); revalidatePath('/reviews'); revalidatePath('/admin/reviews'); return { success: true as const }; }
  catch (error) { return { error: error instanceof Error ? error.message : 'Review could not be updated.' }; }
}
