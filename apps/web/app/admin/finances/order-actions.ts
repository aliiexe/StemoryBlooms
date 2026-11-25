'use server';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { recordFinanceEntry, recordInspectedReturn } from '@/lib/commerce/finance';
import { publicError } from '@/lib/commerce/errors';
import { recordReceivedPayment, confirmCarrierBalance } from '@/lib/commerce/payments';
function refresh(id: string) { for (const path of ['/admin', '/admin/orders', `/admin/orders/${id}`, '/admin/finances', '/admin/reports', '/admin/deliveries', '/admin/production', '/admin/inventory/movements', '/shop', '/custom-bouquet']) revalidatePath(path); }
export async function recordOrderReceivedPayment(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await recordReceivedPayment(input, actor.id); refresh(result.orderId); return { success: true as const }; }
  catch (error) { return { success: false as const, error: publicError(error).message }; }
}
export async function confirmOrderCarrierBalance(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await confirmCarrierBalance(input, actor.id); refresh(result.orderId); return { success: true as const }; }
  catch (error) { return { success: false as const, error: publicError(error).message }; }
}
export async function recordOrderFinance(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await recordFinanceEntry(input, actor.id); refresh(result.orderId); return { success: true as const }; }
  catch (error) { return { success: false as const, error: publicError(error).message }; }
}
export async function recordOrderReturn(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await recordInspectedReturn(input, actor.id); refresh(result.orderId); return { success: true as const }; }
  catch (error) { return { success: false as const, error: publicError(error).message }; }
}
