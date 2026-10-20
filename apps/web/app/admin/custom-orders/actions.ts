'use server';

import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { assertAdmin } from '@/lib/user-sync';
import { publicError } from '@/lib/commerce/errors';
import { saveOrderDraft, convertOrderDraft, setDraftArchived } from '@/lib/commerce/drafts';
import { processNotificationOutbox } from '@/lib/commerce/outbox';

function refreshDraft(id: string) {
  revalidatePath('/admin/custom-orders');
  revalidatePath(`/admin/custom-orders/${id}`);
}
export async function saveCustomOrderDraft(input: unknown) {
  const actor = await assertAdmin();
  try {
    const draft = await saveOrderDraft(input, actor.id);
    refreshDraft(draft.id);
    return { success: true as const, draft };
  } catch (error) { return { success: false as const, ...publicError(error) }; }
}
export async function convertCustomOrderDraft(input: unknown) {
  const actor = await assertAdmin();
  try {
    const created = await convertOrderDraft(input, actor.id);
    after(() => processNotificationOutbox(2, created.id).catch(console.error));
    for (const path of ['/admin', '/admin/custom-orders', '/admin/orders', '/admin/inventory', '/admin/builder', '/admin/products', '/shop', '/custom-bouquet']) revalidatePath(path);
    return { success: true as const, order: created };
  } catch (error) { return { success: false as const, ...publicError(error) }; }
}
export async function archiveCustomOrderDraft(id: string, expectedRevision: number, archived: boolean) {
  const actor = await assertAdmin();
  try {
    const draft = await setDraftArchived(id, expectedRevision, archived, actor.id);
    refreshDraft(id);
    return { success: true as const, draft };
  } catch (error) { return { success: false as const, ...publicError(error) }; }
}
