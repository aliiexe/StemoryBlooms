import { db, eq, and, sql, notificationOutbox, order, waitlistEntry, communicationToken } from '@stemory/database';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { OrderConfirmationTemplate } from '@/components/emails/OrderConfirmation';
import { updateInfinidisState } from '@/lib/infinidis';
import { processCarrierRegistrations } from './delivery';
import { createHash } from 'node:crypto';
import type { CommerceDatabase } from './orders';
import { receiptUrl, type OrderAddress } from './receipt-access';
import { orderPaymentState } from './payments';

type EmailMessage = { from: string; to: string; subject: string; html: string };
type EmailSender = (message: EmailMessage, idempotencyKey: string) => Promise<void>;
const sendEmail: EmailSender = async (message, idempotencyKey) => {
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send(message, { idempotencyKey });
  if (result.error) throw new Error('Email provider did not acknowledge delivery.');
};
export async function processNotificationOutbox(limit = 10, orderId?: string, jobId?: string, database: CommerceDatabase = db, emailSender: EmailSender = sendEmail) {
  let completed = jobId ? 0 : (await processCarrierRegistrations(Math.min(limit, 5), orderId, database)).completed;
  for (let index = 0; index < limit; index++) {
    const job = await database.transaction(async tx => {
      const [next] = await tx.select().from(notificationOutbox).where(and(
        sql`${notificationOutbox.attempts} < 5`,
        sql`${notificationOutbox.type} <> 'COURIER_DISPATCH'`,
        sql`(${notificationOutbox.status} IN ('PENDING', 'FAILED') OR (${notificationOutbox.status} = 'PROCESSING' AND ${notificationOutbox.lastAttempt} < NOW() - INTERVAL '10 minutes'))`,
        sql`(${notificationOutbox.lastAttempt} IS NULL OR ${notificationOutbox.lastAttempt} < NOW() - INTERVAL '5 minutes')`,
        ...(jobId ? [eq(notificationOutbox.id, jobId)] : []),
        ...(orderId ? [sql`${notificationOutbox.payload}->>'orderId' = ${orderId}`] : []),
      )).orderBy(notificationOutbox.createdAt).limit(1).for('update', { skipLocked: true });
      if (!next) return null;
      await tx.update(notificationOutbox).set({ status: 'PROCESSING', attempts: next.attempts + 1, lastAttempt: new Date(), updatedAt: new Date() }).where(eq(notificationOutbox.id, next.id));
      return next;
    });
    if (!job) break;
    try {
      let payload = job.payload as { orderId: string; orderNumber?: string; status?: string; emailRecipients?: string[]; sentRecipients?: string[] };
      if (!payload || (job.type !== 'WAITLIST_VERIFICATION' && typeof payload.orderId !== 'string')) throw new Error('Invalid notification record.');
      if (job.type === 'WAITLIST_VERIFICATION') {
        const data = job.payload as { subscriberId: string; verifyToken: string; unsubscribeToken: string };
        if (!data || !/^[A-Za-z0-9_-]{43}$/.test(data.verifyToken) || !/^[A-Za-z0-9_-]{43}$/.test(data.unsubscribeToken)) throw new Error('Invalid verification job.');
        const subscriber = await database.query.waitlistEntry.findFirst({ where: eq(waitlistEntry.id,data.subscriberId) });
        const token = await database.query.communicationToken.findFirst({ where: eq(communicationToken.tokenHash,createHash('sha256').update(data.verifyToken).digest('hex')) });
        if (!subscriber || subscriber.isVerified && !subscriber.unsubscribed || !token || token.usedAt || token.expiresAt < new Date()) {
          await database.update(notificationOutbox).set({status:'CANCELLED',updatedAt:new Date()}).where(eq(notificationOutbox.id,job.id)); continue;
        }
        if (emailSender === sendEmail && !process.env.RESEND_API_KEY) throw new Error('Email delivery is not configured.');
        const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://stemoryblooms.com';
        const verifyUrl = new URL(`/subscriptions/verify?token=${data.verifyToken}`,origin).toString();
        const unsubscribeUrl = new URL(`/subscriptions/unsubscribe?token=${data.unsubscribeToken}`,origin).toString();
        const escape = (value: string) => value.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
        await emailSender({from:process.env.ORDER_EMAIL_FROM || 'Stemory Blooms <onboarding@resend.dev>',to:subscriber.email,subject:'Confirm your Stemory Blooms waitlist request',html:`<h1>Confirm your waitlist request</h1><p>Confirm to receive our launch update. This link expires in 24 hours.</p><p><a href="${escape(verifyUrl)}">Confirm my email</a></p><p>If you did not request this, ignore this email or <a href="${escape(unsubscribeUrl)}">unsubscribe</a>.</p>`},job.id);
      } else if (job.type === 'COURIER_STATUS') {
        const current = await database.query.order.findFirst({where:eq(order.id,payload.orderId)});
        if(!current || (current.status !== payload.status && !(payload.status==='DELIVERED' && current.status==='COMPLETED'))) {
          await database.update(notificationOutbox).set({status:'CANCELLED',error:'Superseded by the current order status.',updatedAt:new Date()}).where(eq(notificationOutbox.id,job.id));continue;
        }
        if (!payload.orderNumber || !payload.status || !await updateInfinidisState(payload.orderNumber, payload.status)) throw new Error('Carrier status was not acknowledged.');
      } else if (job.type === 'ORDER_CONFIRMATION') {
        if (emailSender === sendEmail && !process.env.RESEND_API_KEY) throw new Error('Order email delivery is not configured.');
        const current = await database.query.order.findFirst({ where: eq(order.id, payload.orderId), with: { customer: true, orderItems: true } });
        if (!current) throw new Error('Order no longer exists.');
        const address = current.deliveryAddress as OrderAddress;
        const buyer = address.customerSnapshot || current.customer;
        const payment = await orderPaymentState(current, database);
        const html = await render(OrderConfirmationTemplate({ receivedAmount: payment.collected/100, remainingAmount: payment.remaining/100, paymentLabel: payment.label, customerName: `${buyer.firstName} ${buyer.lastName}`.trim(),
          customerEmail: buyer.email || '', orderNumber: current.orderNumber, subtotal: current.subtotal,
          deliveryFee: current.deliveryFee, discount: current.discount, total: current.total,
          city: address.city || '', address: address.addressLine1 || '', receiptUrl: new URL(receiptUrl(current.orderNumber, address), process.env.NEXT_PUBLIC_SITE_URL || 'https://stemoryblooms.com').toString(),
          items: current.orderItems.map(line => ({ name: line.productName, quantity: line.quantity, price: line.unitPrice })) }));
        const recipients = payload.emailRecipients || [...new Set([process.env.ORDER_NOTIFICATION_EMAIL || 'stemoryblooms@gmail.com', ...(buyer.email ? [buyer.email] : [])])];
        payload = { ...payload, emailRecipients: recipients, sentRecipients: payload.sentRecipients || [] };
        await database.update(notificationOutbox).set({ payload, updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
        for (let recipientIndex = 0; recipientIndex < recipients.length; recipientIndex++) {
          const recipient = recipients[recipientIndex];
          if (payload.sentRecipients!.includes(recipient)) continue;
          await emailSender({ from: process.env.ORDER_EMAIL_FROM || 'Stemory Blooms <onboarding@resend.dev>', to: recipient, subject: `Order ${current.orderNumber} received`, html }, `${job.id}-${recipientIndex}`);
          payload = { ...payload, sentRecipients: [...payload.sentRecipients!, recipient] };
          await database.update(notificationOutbox).set({ payload, updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
        }
      } else throw new Error('Unsupported notification type.');
      await database.update(notificationOutbox).set({ status: 'SENT', error: null, updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
      completed++;
    } catch (error) {
      await database.update(notificationOutbox).set({ status: 'FAILED', error: error instanceof Error ? error.message.slice(0, 500) : 'Delivery failed', updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
    }
  }
  return { completed };
}
