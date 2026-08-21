'use server';

import { db } from '@stemory/database';
import { review } from '@stemory/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { recordAuditLog } from '@/lib/audit';
import { assertAdmin } from '@/lib/user-sync';

export async function approveReview(id: string) {
  await assertAdmin();
  try {
    const [rev] = await db.update(review).set({ status: 'APPROVED' }).where(eq(review.id, id)).returning();
    revalidatePath(`/shop/${rev.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    await recordAuditLog({
      action: 'UPDATE',
      target: 'REVIEW',
      summary: `Approved review`,
      details: { reviewId: id },
    });
    return { success: true };
  } catch (error) {
    return { error: 'Failed to approve review' };
  }
}

export async function rejectReview(id: string) {
  await assertAdmin();
  try {
    const [rev] = await db.update(review).set({ status: 'REJECTED' }).where(eq(review.id, id)).returning();
    revalidatePath(`/shop/${rev.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    await recordAuditLog({
      action: 'UPDATE',
      target: 'REVIEW',
      summary: `Rejected review`,
      details: { reviewId: id },
    });
    return { success: true };
  } catch (error) {
    return { error: 'Failed to reject review' };
  }
}

export async function deleteReview(id: string) {
  await assertAdmin();
  try {
    const [rev] = await db.delete(review).where(eq(review.id, id)).returning();
    revalidatePath(`/shop/${rev.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    await recordAuditLog({
      action: 'DELETE',
      target: 'REVIEW',
      summary: `Deleted review`,
      details: { reviewId: id },
    });
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete review' };
  }
}
