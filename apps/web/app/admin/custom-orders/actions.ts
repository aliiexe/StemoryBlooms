'use server';

import { randomUUID } from 'node:crypto';
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

function draftFailure(operation: 'save' | 'convert', error: unknown) {
  const result = publicError(error);
  if (result.code !== 'INTERNAL_ERROR') return { success: false as const, ...result };

  const reference = randomUUID().slice(0, 8);
  const cause = error instanceof Error ? error.cause : error;
  const code = cause && typeof cause === 'object' && 'code' in cause ? cause.code : undefined;
  const databaseCode = typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code) ? code : undefined;
  // Query errors can contain buyer details, request parameters, or connection information.
  console.error('Assisted order action failed', { operation, reference, databaseCode });
  const message = operation === 'save'
    ? 'The draft save could not be confirmed. Your fields are still here. Retry this form to use the same draft.'
    : 'Order creation could not be confirmed. Reload the saved draft to check whether an order was created.';
  return { success: false as const, ...result, message: `${message} Reference: ${reference}.` };
}

export async function saveCustomOrderDraft(input: unknown) {
  const actor = await assertAdmin();
  try {
    const draft = await saveOrderDraft(input, actor.id);
    refreshDraft(draft.id);
    return { success: true as const, draft };
  } catch (error) { return draftFailure('save', error); }
}
export async function convertCustomOrderDraft(input: unknown) {
  const actor = await assertAdmin();
  try {
    const created = await convertOrderDraft(input, actor.id);
    after(() => processNotificationOutbox(2, created.id).catch(console.error));
    for (const path of ['/admin', '/admin/custom-orders', '/admin/orders', '/admin/inventory', '/admin/builder', '/admin/products', '/shop', '/custom-bouquet']) revalidatePath(path);
    return { success: true as const, order: created };
  } catch (error) { return draftFailure('convert', error); }
}
export async function archiveCustomOrderDraft(id: string, expectedRevision: number, archived: boolean) {
  const actor = await assertAdmin();
  try {
    const draft = await setDraftArchived(id, expectedRevision, archived, actor.id);
    refreshDraft(id);
    return { success: true as const, draft };
  } catch (error) { return { success: false as const, ...publicError(error) }; }
}
