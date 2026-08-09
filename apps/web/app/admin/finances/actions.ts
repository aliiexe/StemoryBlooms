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
      await db.update(expense).set({ description, category, amount: Math.round(amount), date, updatedAt: new Date() }).where(eq(expense.id, id));
    } else {
      await db.insert(expense).values({ id: crypto.randomUUID(), description, category, amount: Math.round(amount), date, updatedAt: new Date() });
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
