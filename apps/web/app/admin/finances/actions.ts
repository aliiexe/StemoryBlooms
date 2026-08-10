'use server';

import { db, eq, sql, expense } from '@stemory/database';
import { asc, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { parseOptionalDecimalInput } from '../../../lib/form-values';

export async function saveExpense(formData: FormData) {
  const id = formData.get('id') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const amount = parseOptionalDecimalInput(formData.get('amount') as string | null);
  const dateStr = formData.get('date') as string;

  if (!description || amount === null || !category) {
    return { error: 'Description, category, and valid amount are required' };
  }

  const date = dateStr ? new Date(dateStr) : new Date();

  try {
    if (id) {
      await db.update(expense).set({ description, category, amount, date, updatedAt: new Date() }).where(eq(expense.id, id));
    } else {
      await db.insert(expense).values({ id: crypto.randomUUID(), description, category, amount, date, updatedAt: new Date() });
    }
    
    revalidatePath('/admin/finances');
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to save expense' };
  }
}

export async function deleteExpense(id: string) {
  try {
    await db.delete(expense).where(eq(expense.id, id));
    revalidatePath('/admin/finances');
    return { success: true };
  } catch (err) {
    return { error: 'Failed to delete expense' };
  }
}

export async function backfillMaterialExpenses() {
  try {
    // We need to import material here. The best way is to import it at the top,
    // but we can just use dynamic import or require if it's tricky, or add the import at the top.
    // I will use a different replace_file_content chunk to add the import if needed.
    const { material } = await import('@stemory/database');
    const materials = await db.query.material.findMany();
    const expenses = await db.query.expense.findMany();

    const unlinked = materials.filter(m => !expenses.some(e => e.relatedMaterialId === m.id));

    if (unlinked.length === 0) return { backfilled: 0 };

    await db.insert(expense).values(
      unlinked.map(m => ({
        id: crypto.randomUUID(),
        amount: Math.round(m.quantity * (m.cost ?? 0)),
        description: `Initial stock (backfill): ${m.quantity}x ${m.name}`,
        category: 'SUPPLIES',
        relatedMaterialId: m.id,
        date: new Date(),
        updatedAt: new Date()
      }))
    );

    revalidatePath('/admin/finances');
    return { backfilled: unlinked.length };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to backfill material expenses' };
  }
}
