'use server';

import { db, eq, material } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { parseIntegerInput, parseOptionalDecimalInput } from '../../../lib/form-values';

export async function saveMaterial(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const quantity = parseIntegerInput(formData.get('quantity') as string | null);
  const cost = parseOptionalDecimalInput(formData.get('cost') as string | null);
  const lowStockThreshold = parseIntegerInput(formData.get('lowStockThreshold') as string | null);

  if (!name || quantity === null || cost === null) {
    return { error: 'Name, valid quantity, and cost are required' };
  }

  try {
    if (id) {
      await db.update(material)
        .set({ name, quantity, updatedAt: new Date(), cost, lowStockThreshold: lowStockThreshold === null ? null : lowStockThreshold })
        .where(eq(material.id, id));
    } else {
      await db.insert(material).values({
        id: crypto.randomUUID(),
        name, 
        quantity, 
        updatedAt: new Date(), 
        cost,
        lowStockThreshold: lowStockThreshold === null ? null : lowStockThreshold
      });
    }
    
    revalidatePath('/admin/materials');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save material' };
  }
}

export async function deleteMaterial(id: string) {
  try {
    await db.delete(material).where(eq(material.id, id));
    revalidatePath('/admin/materials');
    return { success: true };
  } catch {
    return { error: 'Failed to delete material' };
  }
}
