'use server';

import { db, order } from '@stemory/database';
import { eq } from 'drizzle-orm';
import { getInfinidisTrackingState } from '@/lib/infinidis';

export async function getOrderStatus(orderNumber: string) {
  if (!orderNumber || typeof orderNumber !== 'string') {
    return { error: 'Invalid order number' };
  }

  const cleanOrderNumber = orderNumber.trim().toUpperCase();

  try {
    const foundOrder = await db.query.order.findFirst({
      where: eq(order.orderNumber, cleanOrderNumber),
      columns: {
        orderNumber: true,
        status: true,
        createdAt: true,
      }
    });

    if (!foundOrder) {
      return { error: 'Order not found. Please check your order number and try again.' };
    }

    // Try to fetch live tracking from Infinidis
    const infinidisState = await getInfinidisTrackingState(cleanOrderNumber);
    
    // We can inject the live state into the returned order object
    const finalOrder = {
      ...foundOrder,
      infinidisState: infinidisState || null
    };

    return { success: true, order: finalOrder };
  } catch (err) {
    console.error('Error fetching order status:', err);
    return { error: 'An error occurred while fetching your order. Please try again later.' };
  }
}
