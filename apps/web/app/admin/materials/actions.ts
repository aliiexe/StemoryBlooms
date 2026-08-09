'use server';

import { db } from '@stemory/database';
import { material } from '@stemory/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function saveMaterial(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const quantity = parseInt(formData.get('quantity') as string, 10);
  const cost = parseInt(formData.get('cost') as string, 10);
  const lowStockThreshold = parseInt(formData.get('lowStockThreshold') as string, 10);

  if (!name || isNaN(quantity)) {
    return { error: 'Name and valid quantity are required' };
  }

  try {
    if (id) {
      await db.update(material).set({
        name, quantity, cost: isNaN(cost) ? null : cost, lowStockThreshold: isNaN(lowStockThreshold) ? null : lowStockThreshold, updatedAt: new Date()
      }).where(eq(material.id, id));
    } else {
      await db.insert(material).values({
        id: crypto.randomUUID(), updatedAt: new Date(),
        name, quantity, cost: isNaN(cost) ? null : cost, lowStockThreshold: isNaN(lowStockThreshold) ? null : lowStockThreshold
      });
    }
    
    revalidatePath('/admin/materials');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to save material' };
  }
}

export async function deleteMaterial(id: string) {
  try {
    await db.delete(material).where(eq(material.id, id));
    revalidatePath('/admin/materials');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete material' };
  }
}

export async function updateMaterialInline(id: string, updates: Partial<any>) {
  try {
    await db.update(material).set({ ...updates, updatedAt: new Date() }).where(eq(material.id, id));
    revalidatePath('/admin/inventory');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to update material' };
  }
}

export async function restockMaterial(id: string, qty: number) {
  try {
    const existing = await db.query.material.findFirst({ where: eq(material.id, id) });
    if (!existing) return { error: 'Not found' };
    await db.update(material).set({ quantity: existing.quantity + qty, updatedAt: new Date() }).where(eq(material.id, id));
    revalidatePath('/admin/inventory');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to restock' };
  }
}
