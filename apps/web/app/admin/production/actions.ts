'use server';

import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { quoteProduction, recordProduction } from '@/lib/commerce/production';
import { correctStock } from '@/lib/commerce/stock-ledger';
import { publicError } from '@/lib/commerce/errors';
function refreshStock() { for (const path of ['/admin', '/admin/production', '/admin/inventory', '/admin/inventory/movements', '/admin/products', '/admin/builder', '/shop', '/custom-bouquet']) revalidatePath(path); }
export async function getProductionQuote(input: unknown) {
  await assertAdmin();
  try { return { success: true as const, quote: await quoteProduction(input) }; }
  catch (error) { return { success: false as const, ...publicError(error) }; }
}
export async function completeProduction(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await recordProduction(input, actor.id); refreshStock(); return { success: true as const, result }; }
  catch (error) { return { success: false as const, ...publicError(error) }; }
}
export async function correctInventoryCount(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await correctStock(input, actor.id); refreshStock(); return { success: true as const, result }; }
  catch (error) { return { success: false as const, ...publicError(error) }; }
}
