'use server';

import { db, waitlistEntry } from '@stemory/database';
import crypto from 'crypto';
import { headers } from 'next/headers';
import { publicEmail } from '@/lib/commerce/public-input';
import { enforceSubmissionLimit } from '@/lib/commerce/rate-limit';
import { publicError } from '@/lib/commerce/errors';

export async function joinWaitlist(email: string) {
  const parsed = publicEmail.safeParse(email);
  if (!parsed.success) return { error: 'Invalid email address' };
  try {
    await enforceSubmissionLimit('waitlist', await headers(), 5);
    await db.insert(waitlistEntry).values({ id: crypto.randomUUID(), email: parsed.data }).onConflictDoNothing();
    return { success: true };
  } catch (error) {
    console.error('Waitlist submission failed:', error);
    return { error: publicError(error).message };
  }
}
