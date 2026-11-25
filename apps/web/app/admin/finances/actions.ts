'use server';
import { db, eq, expense, auditLog } from '@stemory/database';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
const expenseSchema = z.object({ id: z.string().min(1).max(128), description: z.string().trim().min(3).max(500), category: z.enum(['SUPPLIES', 'PACKAGING', 'MARKETING', 'RENT', 'SOFTWARE', 'DELIVERY', 'OTHER']), amount: z.coerce.number().positive().max(10000000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, 'Use at most two decimal places.'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
function refresh() { for (const path of ['/admin', '/admin/finances', '/admin/reports']) revalidatePath(path); }
export async function saveExpense(formData: FormData) {
  const actor = await assertAdmin();
  const parsed = expenseSchema.safeParse(Object.fromEntries(['id', 'description', 'category', 'amount', 'date'].map(key => [key, formData.get(key)])));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message || 'Check the expense fields.' };
  const data = parsed.data; const date = new Date(`${data.date}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== data.date) return { error: 'Choose a valid expense date.' };
  try {
    await db.transaction(async tx => {
      const [existing] = await tx.select().from(expense).where(eq(expense.id, data.id)).for('update');
      if (existing?.relatedMaterialId || existing?.relatedOrderId) throw new Error('Linked stock or order expenses are immutable. Record a separate documented correction.');
      if (existing && formData.get('isNew') === 'true') {
        if (existing.description === data.description && existing.amount === data.amount && existing.category === data.category && existing.date.getTime() === date.getTime()) return;
        throw new Error('This expense reference was already saved with different values.');
      }
      if (existing && formData.get('expectedUpdatedAt') !== existing.updatedAt.toISOString()) throw new Error('This expense changed. Reload it before editing.');
      if (!existing && formData.get('isNew') !== 'true') throw new Error('Expense not found.');
      const values = { description: data.description, category: data.category, amount: data.amount, date, updatedAt: new Date() };
      if (existing) await tx.update(expense).set(values).where(eq(expense.id, data.id)); else await tx.insert(expense).values({ id: data.id, ...values });
      await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action: existing ? 'UPDATE' : 'CREATE', target: 'EXPENSE', summary: data.description, details: { expenseId: data.id, before: existing || null, after: values } });
    }); refresh(); return { success: true };
  } catch (error) { return { error: error instanceof Error ? error.message : 'Expense could not be saved.' }; }
}
export async function deleteExpense(id: string, reason: string, expectedUpdatedAt: string) {
  const actor = await assertAdmin();
  if (!reason || reason.trim().length < 3 || reason.length > 500) return { error: 'Enter the reason for voiding this erroneous expense.' };
  try { await db.transaction(async tx => {
    const [existing] = await tx.select().from(expense).where(eq(expense.id, id)).for('update');
    if (!existing) throw new Error('Expense not found.');
    if (existing.category === 'VOIDED') return;
    if (existing.relatedMaterialId || existing.relatedOrderId) throw new Error('Linked purchase and order expenses cannot be voided separately from their recorded operation.');
    if (existing.updatedAt.toISOString() !== expectedUpdatedAt) throw new Error('Expense changed. Reload before voiding.');
    await tx.update(expense).set({ amount: 0, category: 'VOIDED', description: `Voided: ${reason.trim()}`, updatedAt: new Date() }).where(eq(expense.id, id));
    await tx.insert(auditLog).values({ id: randomUUID(), actorId: actor.id, action: 'VOID', target: 'EXPENSE', summary: reason.trim(), details: { expenseId: id, original: existing } });
  }); refresh(); return { success: true }; } catch (error) { return { error: error instanceof Error ? error.message : 'Could not void the expense.' }; }
}
export async function backfillMaterialExpenses() {
  await assertAdmin();
  return { error: 'Automatic historical expense backfill is disabled. Reconcile purchases against actual receipts.' };
}
