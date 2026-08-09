'use server';

import { db, contactMessage } from '@stemory/database';
import crypto from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

function buildContactEmailHtml(details: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}) {
  return `
    <div style="font-family: Arial, sans-serif; color: #2f2a24; max-width: 640px; margin: 0 auto; line-height: 1.6;">
      <h2 style="margin-bottom: 0.25rem;">New contact message</h2>
      <p style="margin-top: 0; color: #6b655e;">From ${details.firstName} ${details.lastName} &lt;${details.email}&gt;</p>
      <div style="border: 1px solid #e8e2d8; border-radius: 12px; padding: 1rem 1.25rem; margin: 1rem 0; background: #fffdf9;">
        <p style="margin: 0 0 0.75rem;"><strong>Subject:</strong> ${details.subject}</p>
        <p style="margin: 0; white-space: pre-wrap;">${details.message}</p>
      </div>
    </div>
  `;
}

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
    await db.insert(contactMessage).values({ id: crypto.randomUUID(), firstName, lastName, email, subject, message, updatedAt: new Date() });

    if (process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: 'Stemory Blooms <orders@stemoryblooms.com>',
          to: ['stemoryblooms@gmail.com'],
          subject: `New contact message from ${firstName} ${lastName}`,
          replyTo: email,
          html: buildContactEmailHtml({ firstName, lastName, email, subject, message })
        });
      } catch (emailError) {
        console.error('Failed to send contact notification email:', emailError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to submit contact message:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}
