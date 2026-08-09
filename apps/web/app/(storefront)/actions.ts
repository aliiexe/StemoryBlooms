'use server';

import { db, waitlistEntry, eq } from '@stemory/database';
import crypto from 'crypto';

export async function joinWaitlist(email: string) {
  if (!email || !email.includes('@')) {
    return { error: 'Invalid email address' };
  }

  try {
    await db.insert(waitlistEntry).values({ id: crypto.randomUUID(), email }).onConflictDoNothing();
    return { success: true };
  } catch (error) {
    console.error('Waitlist submission failed:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}
