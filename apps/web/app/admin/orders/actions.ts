'use server';

import { db, eq, sql, customer, order, orderItem, product, socialOrderMetadata, deliveryZone } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '../../../lib/user-sync';
import crypto from 'crypto';

export async function updateOrderStatus(orderId: string, status: string) {
  await assertAdmin();
  await db.update(order).set({ status, updatedAt: new Date() }).where(eq(order.id, orderId));
  revalidatePath('/admin/orders');
}

export type AssistedOrderPayload = {
  source: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  city: string;
  address: string;
  notes?: string;
  deliveryZoneId?: string;
  manualDiscount: number;
  items: { productId: string; quantity: number }[];
};

export async function createAssistedOrder(payload: AssistedOrderPayload) {
  await assertAdmin();

  const { source, customerName, phoneNumber, email, city, address, notes, deliveryZoneId, manualDiscount, items } = payload;

  if (items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // 1. Fetch products
  const productIds = items.map(i => i.productId);
  const dbProducts = await db.query.product.findMany({
    where: (table, { inArray }) => inArray(table.id, productIds)
  });
  const productMap = new Map(dbProducts.map(p => [p.id, p]));

  // 2. Fetch delivery zone
  let deliveryFee = 0;
  if (deliveryZoneId) {
    const zone = await db.query.deliveryZone.findFirst({ where: eq(deliveryZone.id, deliveryZoneId) });
    if (zone) deliveryFee = zone.fee;
  } else {
    // fallback default
    const activeZone = await db.query.deliveryZone.findFirst({ where: (table, { eq }) => eq(table.isActive, true) });
    if (activeZone) deliveryFee = activeZone.fee;
  }

  // 3. Calculate subtotal
  let subtotal = 0;
  const finalOrderItems = items.map(item => {
    const p = productMap.get(item.productId);
    if (!p) throw new Error(`Product not found: ${item.productId}`);
    const price = p.salePrice ?? p.basePrice;
    subtotal += price * item.quantity;
    return {
      productId: p.id,
      name: p.name,
      quantity: item.quantity,
      unitPrice: price,
      totalPrice: price * item.quantity
    };
  });

  const total = Math.max(0, subtotal - manualDiscount) + deliveryFee;

  await db.transaction(async (tx) => {
    // Upsert customer
    const [dbCustomer] = await tx.insert(customer).values({
      id: crypto.randomUUID(),
      firstName: customerName,
      lastName: '',
      email: email || undefined,
      phone: phoneNumber,
      updatedAt: new Date()
    }).onConflictDoUpdate({
      target: customer.phone,
      set: { firstName: customerName, email: email || undefined, updatedAt: new Date() }
    }).returning({ id: customer.id });

    const orderNumber = `AST-${Date.now().toString().slice(-6)}`;
    
    const [createdOrder] = await tx.insert(order).values({
      id: crypto.randomUUID(),
      orderNumber,
      customerId: dbCustomer.id,
      status: 'CONFIRMED',
      source: source,
      subtotal,
      deliveryFee,
      discount: manualDiscount,
      total,
      notes,
      deliveryAddress: { city, addressLine1: address },
      updatedAt: new Date()
    }).returning({ id: order.id });

    // Insert items & deduct stock
    for (const item of finalOrderItems) {
      await tx.insert(orderItem).values({
        id: crypto.randomUUID(),
        orderId: createdOrder.id,
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        updatedAt: new Date()
      });

      await tx.execute(
        sql`UPDATE "Product" SET "stock" = "stock" - ${item.quantity}, "isAvailable" = CASE WHEN ("stock" - ${item.quantity}) > 0 THEN true ELSE false END WHERE "id" = ${item.productId} AND "stock" >= ${item.quantity}`
      );
    }

    if (['INSTAGRAM', 'TIKTOK'].includes(source)) {
      await tx.insert(socialOrderMetadata).values({
        id: crypto.randomUUID(),
        orderId: createdOrder.id,
        handle: customerName,
        platform: source
      });
    }
  });

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  return { success: true };
}
