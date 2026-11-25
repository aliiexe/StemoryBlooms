import { createHmac, timingSafeEqual } from 'node:crypto';

export type OrderAddress = {
  fulfillmentMethod?: 'DELIVERY' | 'PICKUP' | 'HAND_DELIVERY';
  stockReserved?: boolean;
  carrierBalanceReviewRequired?: boolean;
  priceOverrides?: { line: number; unitPrice: number; reason: string }[];
  paymentRecords?: { id: string; amountCents: number; method: 'CARD' | 'CASH' | 'BANK_TRANSFER'; allocation: 'ORDER' | 'ITEMS' | 'DELIVERY'; channel: 'DIRECT' | 'CARRIER'; reference: string; reason: string; actorId: string; at: string; requestHash: string }[];
  city?: string;
  addressLine1?: string;
  deliveryZoneId?: string;
  deliveryEstimate?: string | null;
  customerSnapshot?: { firstName: string; lastName: string; email: string | null; phone: string };
  recipientSnapshot?: { name: string; phone: string };
  manualDiscount?: number;
  manualDiscountReason?: string;
  ownerClerkId?: string | null;
  receiptNonce?: string;
  requestFingerprint?: string;
  redemptions?: { promoId?: string; giftCardId?: string; giftAmount: number; promoAmount: number };
  carrierHandoff?: { companyId: string; companyName: string; reference: string; at: string };
  archivedAt?: string;
};

export function receiptToken(orderNumber: string, nonce: string, secret: string): string {
  return createHmac('sha256', secret).update(`receipt:v1:${orderNumber}:${nonce}`).digest('base64url');
}

export function verifyReceiptToken(token: unknown, orderNumber: string, nonce: unknown, secret: string): boolean {
  if (typeof token !== 'string' || typeof nonce !== 'string' || nonce.length < 32 || !secret || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const expected = receiptToken(orderNumber, nonce, secret);
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function getReceiptSecret() {
  const secret = process.env.RECEIPT_SIGNING_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret) throw new Error('Receipt signing is not configured.');
  return secret;
}

export function receiptUrl(orderNumber: string, address: OrderAddress) {
  const path = `/receipt/${encodeURIComponent(orderNumber)}`;
  return address.receiptNonce ? `${path}?token=${receiptToken(orderNumber, address.receiptNonce, getReceiptSecret())}` : path;
}
