'use server';
import { revalidatePath } from 'next/cache';
import { after } from 'next/server';
import { assertAdmin } from '@/lib/user-sync';
import { transitionOrder } from '@/lib/commerce/order-lifecycle';
import { queueCarrierRegistration, resolveCarrierRegistration, stopQueuedRegistration, recordDeliveryHandoff } from '@/lib/commerce/delivery';
import { publicError } from '@/lib/commerce/errors';
import { processNotificationOutbox } from '@/lib/commerce/outbox';
function refresh(orderId: string) { for (const path of ['/admin', '/admin/deliveries', '/admin/orders', `/admin/orders/${orderId}`, '/admin/settings']) revalidatePath(path); }
export async function updateOrderStatus(orderId: string, status: string) {
  const actor = await assertAdmin();
  try { await transitionOrder(orderId, status, actor.id); after(() => processNotificationOutbox(2, orderId).catch(console.error)); refresh(orderId); return { success: true }; }
  catch (error) { return { error: publicError(error).message }; }
}
export async function createDeliveryHandoff(orderId: string, companyId: string, reference: string) {
  const actor = await assertAdmin();
  try { await recordDeliveryHandoff({ orderId, companyId, reference }, actor.id); refresh(orderId); return { success: true as const }; }
  catch (error) { return { success: false as const, error: publicError(error).message }; }
}
export async function queueRegistration(input: unknown) {
  const actor = await assertAdmin();
  try { const job = await queueCarrierRegistration(input, actor.id); after(() => processNotificationOutbox(2, job.orderId).catch(console.error)); refresh(job.orderId); return { success: true as const, job }; }
  catch (error) { return { success: false as const, error: publicError(error).message }; }
}
export async function reconcileRegistration(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await resolveCarrierRegistration(input, actor.id); refresh(result.orderId); return { success: true as const }; }
  catch (error) { return { success: false as const, error: publicError(error).message }; }
}
export async function stopRegistration(jobId: string) {
  const actor = await assertAdmin();
  try { const result = await stopQueuedRegistration(jobId, actor.id); refresh(result.orderId); return { success: true as const }; }
  catch (error) { return { success: false as const, error: publicError(error).message }; }
}
