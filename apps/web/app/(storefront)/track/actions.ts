'use server';

import { db, order } from '@stemory/database';
import { eq,sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { enforceSubmissionLimit } from '@/lib/commerce/rate-limit';
import { publicError } from '@/lib/commerce/errors';
import { getInfinidisTrackingState } from '@/lib/infinidis';

export async function getOrderStatus(orderNumber: string) {
  if (typeof orderNumber !== 'string' || !/^[A-Za-z0-9-]{4,64}$/.test(orderNumber.trim())) {
    return { error: 'Invalid order number' };
  }

  const cleanOrderNumber = orderNumber.trim().toUpperCase();

  try {
    await enforceSubmissionLimit('tracking', await headers(), 15);
    const [foundOrder] = await db.select({orderNumber:order.orderNumber,status:order.status,createdAt:order.createdAt,sentToInfinidis:order.sentToInfinidis,fulfillment:sql<string>`COALESCE(${order.deliveryAddress}->>'fulfillmentMethod',CASE WHEN ${order.deliveryAddress}->>'addressLine1'='Hand delivered' THEN 'HAND_DELIVERY' ELSE 'DELIVERY' END)`}).from(order).where(eq(order.orderNumber,cleanOrderNumber)).limit(1);

    if (!foundOrder) {
      return { error: 'Order not found. Please check your order number and try again.' };
    }

    // Try to fetch live tracking from Infinidis
    const infinidisState = foundOrder.fulfillment==='DELIVERY'&&foundOrder.sentToInfinidis ? await getInfinidisTrackingState(cleanOrderNumber) : null;

    // We can inject the live state into the returned order object
    const finalOrder = {
      orderNumber:foundOrder.orderNumber,status:foundOrder.status,createdAt:foundOrder.createdAt,
      fulfillment:foundOrder.fulfillment, infinidisState: infinidisState || null
    };

    return { success: true, order: finalOrder };
  } catch (err) {
    console.error('Error fetching order status:', err);
    return { error: publicError(err).message };
  }
}
