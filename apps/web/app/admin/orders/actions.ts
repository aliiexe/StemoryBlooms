'use server';

import { db, eq, sql, promoCode as promoCodeTable, giftCard as giftCardTable, customer, order, orderItem, socialOrderMetadata, deliveryZone } from '@stemory/database';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '../../../lib/user-sync';
import { recordAuditLog } from '@/lib/audit';
import crypto from 'crypto';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { OrderConfirmationTemplate } from '@/components/emails/OrderConfirmation';
import { calculateOrderTotals } from '@/app/api/v1/orders/orderUtils';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

export async function updateOrderStatus(orderId: string, status: string) {
  await assertAdmin();
  
  const currentOrder = await db.query.order.findFirst({ where: eq(order.id, orderId) });
  
  // If transitioning to CANCELLED from another status, restock items
  if (status === 'CANCELLED' && currentOrder?.status !== 'CANCELLED') {
    const items = await db.query.orderItem.findMany({ where: eq(orderItem.orderId, orderId) });
    for (const item of items) {
      if (item.productId) {
        await db.execute(
          sql`UPDATE "Product" SET "stock" = "stock" + ${item.quantity}, "isAvailable" = true WHERE "id" = ${item.productId}`
        );
      } else if (item.configuration) {
        for (const [cId, qty] of Object.entries(item.configuration as Record<string, number>)) {
          const totalRestock = qty * item.quantity;
          await db.execute(
            sql`UPDATE "BuilderComponent" SET "stock" = "stock" + ${totalRestock}, "isAvailable" = true WHERE "id" = ${cId}`
          );
        }
      }
    }
  } 
  // If transitioning FROM CANCELLED back to a valid state, deduct stock again
  else if (currentOrder?.status === 'CANCELLED' && status !== 'CANCELLED') {
    const items = await db.query.orderItem.findMany({ where: eq(orderItem.orderId, orderId) });
    for (const item of items) {
      if (item.productId) {
        await db.execute(
          sql`UPDATE "Product" SET "stock" = GREATEST(0, "stock" - ${item.quantity}), "isAvailable" = CASE WHEN ("stock" - ${item.quantity}) > 0 THEN true ELSE false END WHERE "id" = ${item.productId}`
        );
      } else if (item.configuration) {
        for (const [cId, qty] of Object.entries(item.configuration as Record<string, number>)) {
          const totalDeduct = qty * item.quantity;
          await db.execute(
            sql`UPDATE "BuilderComponent" SET "stock" = GREATEST(0, "stock" - ${totalDeduct}), "isAvailable" = CASE WHEN ("stock" - ${totalDeduct}) > 0 THEN true ELSE false END WHERE "id" = ${cId}`
          );
        }
      }
    }
  }

  await db.update(order).set({ status, updatedAt: new Date() }).where(eq(order.id, orderId));
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  
  await recordAuditLog({
    action: 'UPDATE',
    target: 'ORDER',
    summary: `Updated order status to ${status}`,
    details: { orderId, status },
  });
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
  promoCode?: string;
  isHandDelivered?: boolean;
  items: { productId: string; quantity: number; customName?: string; customPrice?: number }[];
};

export async function createAssistedOrder(payload: AssistedOrderPayload) {
  await assertAdmin();

  const { source, customerName, phoneNumber, email, city, address, notes, deliveryZoneId, manualDiscount, promoCode, isHandDelivered, items } = payload;

  if (items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  // Auto-append phone number to address (if provided)
  const fullAddress = isHandDelivered 
    ? 'Hand Delivered' 
    : (address ? `${address} - Tel: ${phoneNumber}` : '');

  // 1. Fetch products
  const productIds = items
    .filter(i => i.productId !== 'CUSTOM' && !i.productId.startsWith('COMPONENT_'))
    .map(i => i.productId);
    
  const componentIds = items
    .filter(i => i.productId.startsWith('COMPONENT_'))
    .map(i => i.productId.replace('COMPONENT_', ''));

  const dbProducts = productIds.length > 0 ? await db.query.product.findMany({
    where: (table, { inArray }) => inArray(table.id, productIds)
  }) : [];
  const productMap = new Map(dbProducts.map(p => [p.id, p]));
  
  const dbComponents = componentIds.length > 0 ? await db.query.builderComponent.findMany({
    where: (table, { inArray }) => inArray(table.id, componentIds)
  }) : [];
  const componentMap = new Map(dbComponents.map(c => [c.id, c]));

  // 2. Fetch delivery zone
  let deliveryFee = 0;
  if (isHandDelivered) {
    deliveryFee = 0;
  } else if (deliveryZoneId) {
    const zone = await db.query.deliveryZone.findFirst({ where: eq(deliveryZone.id, deliveryZoneId) });
    if (zone) deliveryFee = zone.fee;
  } else {
    // fallback default
    const activeZone = await db.query.deliveryZone.findFirst({ where: (table, { eq }) => eq(table.isActive, true) });
    if (activeZone) deliveryFee = activeZone.fee;
  }

  // 3. Calculate subtotal & build items list
  let subtotal = 0;
  const finalOrderItems = items.map(item => {
    if (item.productId === 'CUSTOM') {
      const price = item.customPrice || 0;
      const name = item.customName || 'Custom Item';
      subtotal += price * item.quantity;
      return {
        productId: null,
        componentId: null,
        configuration: null,
        name,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: price * item.quantity
      };
    } else if (item.productId.startsWith('COMPONENT_')) {
      const compId = item.productId.replace('COMPONENT_', '');
      const c = componentMap.get(compId);
      if (!c) throw new Error(`Component not found: ${compId}`);
      const price = c.unitPrice;
      subtotal += price * item.quantity;
      return {
        productId: null,
        componentId: c.id,
        configuration: { [c.id]: 1 },
        name: `[Element] ${c.name}`,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: price * item.quantity
      };
    } else {
      const p = productMap.get(item.productId);
      if (!p) throw new Error(`Product not found: ${item.productId}`);
      const price = p.salePrice ?? p.basePrice;
      subtotal += price * item.quantity;
      return {
        productId: p.id,
        componentId: null,
        configuration: null,
        name: p.name,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: price * item.quantity
      };
    }
  });

  const createdOrderResult = await db.transaction(async (tx) => {
    let promoDiscountAmount = 0;
    let appliedPromoId: string | null = null;
    let promoDetails: { type: 'PERCENTAGE' | 'FIXED'; value: number } | null = null;

    if (promoCode) {
      const dbPromo = await tx.query.promoCode.findFirst({
        where: eq(promoCodeTable.code, promoCode.toUpperCase().trim())
      });
      if (!dbPromo || !dbPromo.isActive || (dbPromo.usageLimit && dbPromo.usageCount >= dbPromo.usageLimit)) {
        throw new Error('Invalid or expired promo code');
      }
      appliedPromoId = dbPromo.id;
      promoDetails = { type: dbPromo.type as 'PERCENTAGE' | 'FIXED', value: dbPromo.value };
    }

    const orderTotals = calculateOrderTotals({ subtotal, promoCode, promoDetails, deliveryFee });
    promoDiscountAmount = orderTotals.discountAmount;

    // Total discount is manual + promo
    const totalDiscount = manualDiscount + promoDiscountAmount;
    const total = Math.max(0, subtotal - totalDiscount) + deliveryFee;

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
      status: 'CONFIRMED', // Assisted orders start as CONFIRMED
      source: source,
      subtotal,
      deliveryFee,
      discount: totalDiscount,
      total,
      notes,
      deliveryAddress: { city, addressLine1: fullAddress },
      updatedAt: new Date()
    }).returning({ id: order.id, orderNumber: order.orderNumber });

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
        configuration: item.configuration,
        updatedAt: new Date()
      });

      if (item.productId) {
        await tx.execute(
          sql`UPDATE "Product" SET "stock" = "stock" - ${item.quantity}, "isAvailable" = CASE WHEN ("stock" - ${item.quantity}) > 0 THEN true ELSE false END WHERE "id" = ${item.productId} AND "stock" >= ${item.quantity}`
        );
      } else if (item.componentId) {
        await tx.execute(
          sql`UPDATE "BuilderComponent" SET "stock" = "stock" - ${item.quantity}, "isAvailable" = CASE WHEN ("stock" - ${item.quantity}) > 0 THEN true ELSE false END WHERE "id" = ${item.componentId} AND "stock" >= ${item.quantity}`
        );
      }
    }

    if (appliedPromoId) {
      await tx.execute(sql`UPDATE "PromoCode" SET "usageCount" = "usageCount" + 1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ${appliedPromoId} AND ("usageLimit" IS NULL OR "usageCount" < "usageLimit")`);
    }

    if (['INSTAGRAM', 'TIKTOK'].includes(source)) {
      await tx.insert(socialOrderMetadata).values({
        id: crypto.randomUUID(),
        orderId: createdOrder.id,
        handle: customerName,
        platform: source
      });
    }

    return { createdOrder, totalDiscount, total };
  });

  const { createdOrder, totalDiscount, total } = createdOrderResult;

  // Send Email
  try {
    const html = await render(
      OrderConfirmationTemplate({
        customerName,
        customerEmail: email || 'stemoryblooms@gmail.com', // fallback to default
        orderNumber: createdOrder.orderNumber,
        subtotal,
        deliveryFee,
        discount: totalDiscount,
        total,
        city,
        address: fullAddress,
        items: finalOrderItems.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.unitPrice
        })),
      })
    );
    await resend.emails.send({
      from: 'Stemory Blooms <onboarding@resend.dev>',
      to: ['stemoryblooms@gmail.com'], // The user wanted it sent to the personal email they already have
      subject: `🌸 New Assisted Order #${createdOrder.orderNumber} — ${customerName}`,
      html,
    });
  } catch (e) {
    console.error('Email send failed', e);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/orders');
  
  await recordAuditLog({
    action: 'CREATE',
    target: 'ORDER',
    summary: `Created assisted order ${createdOrder.orderNumber}`,
    details: { orderId: createdOrder.id, orderNumber: createdOrder.orderNumber, total },
  });
  
  // Returning the orderNumber to redirect to receipt page
  return { success: true, orderId: createdOrder.id, orderNumber: createdOrder.orderNumber };
}

export async function deleteOrder(orderId: string) {
  await assertAdmin();

  // Restock items if the order wasn't already CANCELLED
  const currentOrder = await db.query.order.findFirst({ where: eq(order.id, orderId) });
  if (currentOrder && currentOrder.status !== 'CANCELLED') {
    const items = await db.query.orderItem.findMany({ where: eq(orderItem.orderId, orderId) });
    for (const item of items) {
      if (item.productId) {
        await db.execute(
          sql`UPDATE "Product" SET "stock" = "stock" + ${item.quantity}, "isAvailable" = true WHERE "id" = ${item.productId}`
        );
      } else if (item.configuration) {
        for (const [cId, qty] of Object.entries(item.configuration as Record<string, number>)) {
          const totalRestock = qty * item.quantity;
          await db.execute(
            sql`UPDATE "BuilderComponent" SET "stock" = "stock" + ${totalRestock}, "isAvailable" = true WHERE "id" = ${cId}`
          );
        }
      }
    }
  }

  // Delete related data first
  await db.delete(orderItem).where(eq(orderItem.orderId, orderId));
  await db.delete(socialOrderMetadata).where(eq(socialOrderMetadata.orderId, orderId));
  
  // Then delete the order itself
  await db.delete(order).where(eq(order.id, orderId));

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  
  await recordAuditLog({
    action: 'DELETE',
    target: 'ORDER',
    summary: `Deleted order`,
    details: { orderId },
  });
  
  return { success: true };
}
