'use server';

import { prisma } from '@stemory/database';

export async function joinWaitlist(email: string) {
  if (!email || !email.includes('@')) {
    return { error: 'Invalid email address' };
  }

  try {
    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {}, // Do nothing if it already exists
      create: { email }
    });
    return { success: true };
  } catch (error) {
    console.error('Waitlist submission failed:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}
