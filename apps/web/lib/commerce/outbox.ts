import { db, eq, and, sql, notificationOutbox, order } from '@stemory/database';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { OrderConfirmationTemplate } from '@/components/emails/OrderConfirmation';
import { updateInfinidisState } from '@/lib/infinidis';
import { receiptUrl, type OrderAddress } from './receipt-access';

export async function processNotificationOutbox(limit = 10, orderId?: string) {
  let completed = 0;
  for (let index = 0; index < limit; index++) {
    const job = await db.transaction(async tx => {
      const [next] = await tx.select().from(notificationOutbox).where(and(
        sql`${notificationOutbox.attempts} < 5`,
        sql`(${notificationOutbox.status} IN ('PENDING', 'FAILED') OR (${notificationOutbox.status} = 'PROCESSING' AND ${notificationOutbox.lastAttempt} < NOW() - INTERVAL '10 minutes'))`,
        sql`(${notificationOutbox.lastAttempt} IS NULL OR ${notificationOutbox.lastAttempt} < NOW() - INTERVAL '5 minutes')`,
        ...(orderId ? [sql`${notificationOutbox.payload}->>'orderId' = ${orderId}`] : []),
      )).orderBy(notificationOutbox.createdAt).limit(1).for('update', { skipLocked: true });
      if (!next) return null;
      await tx.update(notificationOutbox).set({ status: 'PROCESSING', attempts: next.attempts + 1, lastAttempt: new Date(), updatedAt: new Date() }).where(eq(notificationOutbox.id, next.id));
      return next;
    });
    if (!job) break;
    try {
      const payload = job.payload as { orderId: string; orderNumber?: string; status?: string };
      if (job.type === 'COURIER_STATUS') {
        if (!payload.orderNumber || !payload.status || !await updateInfinidisState(payload.orderNumber, payload.status)) throw new Error('Carrier status was not acknowledged.');
      } else if (job.type === 'ORDER_CONFIRMATION') {
        if (!process.env.RESEND_API_KEY) throw new Error('Order email delivery is not configured.');
        const current = await db.query.order.findFirst({ where: eq(order.id, payload.orderId), with: { customer: true, orderItems: true } });
        if (!current) throw new Error('Order no longer exists.');
        const address = current.deliveryAddress as OrderAddress;
        const buyer = address.customerSnapshot || current.customer;
        const html = await render(OrderConfirmationTemplate({ customerName: `${buyer.firstName} ${buyer.lastName}`.trim(),
          customerEmail: buyer.email || '', orderNumber: current.orderNumber, subtotal: current.subtotal,
          deliveryFee: current.deliveryFee, discount: current.discount, total: current.total,
          city: address.city || '', address: address.addressLine1 || '', receiptUrl: new URL(receiptUrl(current.orderNumber, address), process.env.NEXT_PUBLIC_SITE_URL || 'https://stemoryblooms.com').toString(),
          items: current.orderItems.map(line => ({ name: line.productName, quantity: line.quantity, price: line.unitPrice })) }));
        const resend = new Resend(process.env.RESEND_API_KEY);
        const recipients = [...new Set([process.env.ORDER_NOTIFICATION_EMAIL || 'stemoryblooms@gmail.com', ...(buyer.email ? [buyer.email] : [])])];
        for (let recipientIndex = 0; recipientIndex < recipients.length; recipientIndex++) {
          const result = await resend.emails.send({ from: process.env.ORDER_EMAIL_FROM || 'Stemory Blooms <onboarding@resend.dev>', to: recipients[recipientIndex], subject: `Order ${current.orderNumber} received`, html }, { idempotencyKey: `${job.id}-${recipientIndex}` });
          if (result.error) throw new Error(result.error.message);
        }
      } else throw new Error('Unsupported notification type.');
      await db.update(notificationOutbox).set({ status: 'SENT', error: null, updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
      completed++;
    } catch (error) {
      await db.update(notificationOutbox).set({ status: 'FAILED', error: error instanceof Error ? error.message.slice(0, 500) : 'Delivery failed', updatedAt: new Date() }).where(eq(notificationOutbox.id, job.id));
    }
  }
  return { completed };
}
