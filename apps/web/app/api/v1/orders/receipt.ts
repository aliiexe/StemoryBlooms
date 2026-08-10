import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export function buildReceiptHtml(order: any) {
  const items = order.items || [];
  const itemRows = items.map((item: any) => `
    <tr>
      <td style="padding: 0.7rem 0; border-bottom: 1px solid #eee;">${item.productName || item.name}</td>
      <td style="padding: 0.7rem 0; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 0.7rem 0; border-bottom: 1px solid #eee; text-align: right;">${item.totalPrice ?? item.unitPrice * item.quantity} MAD</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #2f2a24; max-width: 700px; margin: 0 auto;">
      <h2 style="margin-bottom: 0.25rem;">Stemory Blooms Receipt</h2>
      <p style="margin-top: 0; color: #6b655e;">Order #${order.orderNumber}</p>
      <div style="border: 1px solid #e8e2d8; border-radius: 12px; padding: 1.25rem; margin-top: 1rem;">
        <p><strong>Customer:</strong> ${order.customerName || 'Guest'}</p>
        <p><strong>Phone:</strong> ${order.phoneNumber || 'N/A'}</p>
        <p><strong>Address:</strong> ${order.address || 'N/A'}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-top: 1rem;">
        <thead>
          <tr>
            <th style="text-align: left; padding-bottom: 0.5rem;">Item</th>
            <th style="text-align: center; padding-bottom: 0.5rem;">Qty</th>
            <th style="text-align: right; padding-bottom: 0.5rem;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <div style="margin-top: 1rem; border-top: 1px solid #eee; padding-top: 0.75rem;">
        <p style="margin: 0.25rem 0; display: flex; justify-content: space-between;"><span>Subtotal</span><span>${order.subtotal} MAD</span></p>
        <p style="margin: 0.25rem 0; display: flex; justify-content: space-between;"><span>Discount</span><span>${order.discount || 0} MAD</span></p>
        <p style="margin: 0.25rem 0; display: flex; justify-content: space-between;"><span>Delivery Fee</span><span>${order.deliveryFee || 0} MAD</span></p>
        <p style="margin: 0.75rem 0 0; display: flex; justify-content: space-between; font-weight: 700;"><span>Total</span><span>${order.total} MAD</span></p>
      </div>
    </div>
  `;
}

export async function sendReceiptEmail(order: any) {
  if (!process.env.RESEND_API_KEY) {
    return { ok: true, skipped: true };
  }

  const recipient = process.env.ADMIN_EMAIL || 'stemoryblooms@gmail.com';
  await resend.emails.send({
    from: 'Stemory Blooms <onboarding@resend.dev>',
    to: [recipient],
    subject: `New order receipt ${order.orderNumber}`,
    html: buildReceiptHtml(order)
  });

  return { ok: true, skipped: false };
}
