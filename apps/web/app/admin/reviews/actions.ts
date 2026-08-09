'use server';

import { db } from '@stemory/database';
import { review } from '@stemory/database/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function approveReview(id: string) {
  try {
    const [rev] = await db.update(review).set({ status: 'APPROVED' }).where(eq(review.id, id)).returning();
    revalidatePath(`/shop/${rev.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to approve review' };
  }
}

export async function rejectReview(id: string) {
  try {
    const [rev] = await db.update(review).set({ status: 'REJECTED' }).where(eq(review.id, id)).returning();
    revalidatePath(`/shop/${rev.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to reject review' };
  }
}

export async function deleteReview(id: string) {
  try {
    const [rev] = await db.delete(review).where(eq(review.id, id)).returning();
    revalidatePath(`/shop/${rev.productId}`);
    revalidatePath('/reviews');
    revalidatePath('/admin/reviews');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete review' };
  }
}
