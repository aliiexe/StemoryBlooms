'use server';

import { db, eq, material } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { parseIntegerInput, parseOptionalDecimalInput } from '../../../lib/form-values';
import { assertAdmin } from '../../../lib/user-sync';
import { recordAuditLog } from '@/lib/audit';

export async function saveMaterial(formData: FormData) {
  await assertAdmin();
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
      const newId = crypto.randomUUID();
      await db.insert(material).values({
        id: newId,
        name, 
        quantity, 
        updatedAt: new Date(), 
        cost,
        lowStockThreshold: lowStockThreshold === null ? null : lowStockThreshold
      });

      if (quantity > 0) {
        const { expense } = await import('@stemory/database');
        const totalCost = quantity * cost;
        await db.insert(expense).values({
          id: crypto.randomUUID(),
          amount: Math.round(totalCost),
          description: `Initial stock: ${quantity}x ${name}`,
          category: 'SUPPLIES',
          relatedMaterialId: newId,
          date: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    revalidatePath('/admin/materials');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin/finances');
    
    await recordAuditLog({
      action: id ? 'UPDATE' : 'CREATE',
      target: 'MATERIAL',
      summary: `${id ? 'Updated' : 'Created'} material "${name}"`,
      details: { materialId: id, name, quantity, cost },
    });
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to save material' };
  }
}

export async function deleteMaterial(id: string) {
  await assertAdmin();
  try {
    await db.delete(material).where(eq(material.id, id));
    revalidatePath('/admin/materials');
    
    await recordAuditLog({
      action: 'DELETE',
      target: 'MATERIAL',
      summary: `Deleted material`,
      details: { materialId: id },
    });
    return { success: true };
  } catch {
    return { error: 'Failed to delete material' };
  }
}

export async function updateMaterialInline(id: string, updates: Partial<typeof material.$inferInsert>) {
  await assertAdmin();
  try {
    await db.update(material).set({ ...updates, updatedAt: new Date() }).where(eq(material.id, id));
    revalidatePath('/admin/materials');
    
    await recordAuditLog({
      action: 'UPDATE',
      target: 'MATERIAL',
      summary: `Inline updated material`,
      details: { materialId: id, updates },
    });
    return { success: true };
  } catch (error) {
    return { error: 'Failed to update material inline' };
  }
}

export async function restockMaterial(id: string, restockQty: number) {
  await assertAdmin();
  try {
    const { expense } = await import('@stemory/database');
    const existing = await db.query.material.findFirst({ where: eq(material.id, id) });
    if (!existing) return { error: 'Material not found' };

    await db.update(material)
      .set({ quantity: existing.quantity + restockQty, updatedAt: new Date() })
      .where(eq(material.id, id));

    const totalCost = restockQty * (existing.cost ?? 0);
    
    await db.insert(expense).values({
      id: crypto.randomUUID(),
      amount: Math.round(totalCost),
      description: `Restock: ${restockQty}x ${existing.name}`,
      category: 'SUPPLIES',
      relatedMaterialId: existing.id,
      date: new Date(),
      updatedAt: new Date()
    });

    revalidatePath('/admin/materials');
    revalidatePath('/admin/finances');
    
    await recordAuditLog({
      action: 'UPDATE',
      target: 'MATERIAL',
      summary: `Restocked material by ${restockQty}`,
      details: { materialId: id, restockQty },
    });
    return { success: true };
  } catch (error) {
    return { error: 'Failed to restock material' };
  }
}
