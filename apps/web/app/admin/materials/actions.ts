'use server';

import { db, eq, material } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { recordAuditLog } from '@/lib/audit';
import { saveInventoryMaterial, correctMaterial, purchaseMaterial } from '@/lib/commerce/inventory';
import { publicError } from '@/lib/commerce/errors';

function refreshInventory() { for (const path of ['/admin/inventory', '/admin/materials', '/admin/finances', '/admin']) revalidatePath(path); }
export async function saveMaterial(formData: FormData) {
  const actor = await assertAdmin();
  try {
    const nullableNumber = (name: string) => formData.get(name) === '' || formData.get(name) === null ? null : Number(formData.get(name));
    const saved = await saveInventoryMaterial(formData.get('id')?.toString() || null, {
      expectedQuantity: formData.has('expectedQuantity') ? Number(formData.get('expectedQuantity')) : undefined,
      name: formData.get('name'), quantity: nullableNumber('quantity'), cost: nullableNumber('cost'),
      lowStockThreshold: nullableNumber('lowStockThreshold'), supplierId: formData.get('supplierId')?.toString() || null,
    }, actor.id);
    refreshInventory();
    await recordAuditLog({ action: 'SAVE', target: 'MATERIAL', summary: `Saved material ${saved.name}`, details: { materialId: saved.id } });
    return { success: true };
  } catch (error) { return { error: publicError(error).message }; }
}
export async function deleteMaterial(id: string) {
  await assertAdmin();
  try {
    await db.delete(material).where(eq(material.id, id)); refreshInventory();
    await recordAuditLog({ action: 'DELETE', target: 'MATERIAL', summary: 'Deleted unused material', details: { materialId: id } });
    return { success: true };
  } catch { return { error: 'This material may have recipes or stock history. Retain it for those records.' }; }
}
export async function updateMaterialInline(id: string, updates: unknown) {
  const actor = await assertAdmin();
  try { const saved = await correctMaterial(id, updates, actor.id); refreshInventory(); return { success: true, material: saved }; }
  catch (error) { return { error: publicError(error).message }; }
}
export async function restockMaterial(id: string, quantity: number) {
  const actor = await assertAdmin();
  try { const saved = await purchaseMaterial(id, quantity, actor.id); refreshInventory(); return { success: true, material: saved }; }
  catch (error) { return { error: publicError(error).message }; }
}
