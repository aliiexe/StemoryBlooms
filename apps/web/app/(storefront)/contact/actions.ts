'use server';

import { prisma } from '@stemory/database';

export async function submitContactMessage(formData: FormData) {
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const email = formData.get('email') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;

  if (!firstName || !lastName || !email || !message) {
    return { error: 'Please fill out all required fields.' };
  }

  try {
    await prisma.contactMessage.create({
      data: { firstName, lastName, email, subject, message }
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to submit contact message:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}
