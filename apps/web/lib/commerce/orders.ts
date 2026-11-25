import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { db, eq, and, inArray, sql, product, builderComponent, deliveryZone, promoCode, giftCard,
  customer, order, orderItem, notificationOutbox, adminNotification, orderStatusHistory } from '@stemory/database';
import { AssistedOrderSchema, AssistedQuoteSchema, CheckoutPayloadSchema, CheckoutQuoteSchema } from '@stemory/contracts';
import type { AssistedQuoteInput, CheckoutCartItem } from '@stemory/contracts';
import { finishStockOperation, inventorySchemaReady, type StockChange } from './stock-ledger';
import { CommerceError } from './errors';
import { getReceiptSecret, receiptUrl } from './receipt-access';
import type { OrderAddress } from './receipt-access';
import { recordPaymentInTransaction } from './payments';

export type CommerceDatabase = typeof db;
export type CommerceTransaction = Parameters<Parameters<CommerceDatabase['transaction']>[0]>[0];
type Reader = CommerceDatabase | CommerceTransaction;
type ManualLine = { kind: 'MANUAL'; cartLineId: string; name: string; unitPrice: number; quantity: number };
type OrderLine = (CheckoutCartItem | ManualLine) & { unitPriceOverride?: number; priceOverrideReason?: string };
type QuoteInput = { cartItems: OrderLine[]; city: string; deliveryZoneId?: string; promoCode?: string; giftCardCode?: string; manualDiscount?: number; handDelivered?: boolean; fulfillmentMethod?: OrderAddress['fulfillmentMethod']; trackInventory?: boolean };
export type PricedLine = { productId: string | null; productName: string; quantity: number; unitPrice: number; totalPrice: number; configuration: { components: Record<string, number>; componentNames?: Record<string, string>; cardMessage?: string } | null };
export type OrderQuote = {
  items: PricedLine[]; subtotal: number; deliveryFee: number; discount: number; promoDiscount: number;
  giftAmount: number; total: number; city: string; deliveryEstimate: string | null;
};
type InternalQuote = OrderQuote & { productDemand: Map<string, number>; componentDemand: Map<string, number>; promoId?: string; giftCardId?: string; stockReserved: boolean };

function fail(message: string, code = 'INVALID_ORDER', status = 400): never { throw new CommerceError(message, code, status); }
function money(value: number) {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10000000) fail('This order contains an invalid amount.');
  return value;
}
function addDemand(demand: Map<string, number>, id: string, quantity: number) {
  demand.set(id, (demand.get(id) || 0) + quantity);
}
export function normalizePhone(value: string) { return `+212${value.replace(/\D/g, '').slice(-9)}`; }
function publicQuote({ items, subtotal, deliveryFee, discount, promoDiscount, giftAmount, total, city, deliveryEstimate }: InternalQuote): OrderQuote {
  return { items, subtotal, deliveryFee, discount, promoDiscount, giftAmount, total, city, deliveryEstimate };
}

async function priceOrder(reader: Reader, input: QuoteInput, lock: boolean, website: boolean): Promise<InternalQuote> {
  const settings = await reader.query.siteSettings.findFirst();
  if (website && settings?.mode !== 'LIVE') fail('The store is not accepting orders right now. Please check back soon.', 'STORE_CLOSED', 503);
  const config = (settings?.config || {}) as { customBouquetBaseFee?: number; inventoryTrackingEnabled?: boolean };
  const reserveStock = website ? config.inventoryTrackingEnabled !== false : input.trackInventory !== false;
  const baseFee = money(config.customBouquetBaseFee ?? 19);
  const productIds = [...new Set(input.cartItems.flatMap(line => line.kind === 'PRODUCT' ? [line.productId] : []))].sort();
  const componentIds = [...new Set(input.cartItems.flatMap(line => line.kind === 'CUSTOM' ? Object.keys(line.configuration.components) : []))].sort();
  const productQuery = reader.select().from(product).where(inArray(product.id, productIds)).orderBy(product.id);
  const componentQuery = reader.select().from(builderComponent).where(inArray(builderComponent.id, componentIds)).orderBy(builderComponent.id);
  const products = productIds.length ? await (lock ? productQuery.for('update') : productQuery) : [];
  const components = componentIds.length ? await (lock ? componentQuery.for('update') : componentQuery) : [];
  const productsById = new Map(products.map(value => [value.id, value]));
  const componentsById = new Map(components.map(value => [value.id, value]));
  const productDemand = new Map<string, number>();
  const componentDemand = new Map<string, number>();

  const items: PricedLine[] = input.cartItems.map(line => {
    if (line.kind === 'PRODUCT') {
      const found = productsById.get(line.productId);
      if (!found || found.status !== 'PUBLISHED' || !found.isAvailable) fail('An item in your cart is no longer available.', 'UNAVAILABLE', 409);
      const unitPrice = money(!website && line.unitPriceOverride !== undefined ? line.unitPriceOverride : found.isSaleEnabled && found.salePrice !== null ? found.salePrice : found.basePrice);
      addDemand(productDemand, found.id, line.quantity);
      return { productId: found.id, productName: found.name, quantity: line.quantity, unitPrice,
        totalPrice: money(unitPrice * line.quantity), configuration: null };
    }
    if (line.kind === 'MANUAL') {
      if (website) fail('Manual items are only available to staff.');
      return { productId: null, productName: line.name, quantity: line.quantity, unitPrice: money(line.unitPrice), totalPrice: money(line.unitPrice * line.quantity), configuration: null };
    }
    let unitPrice = baseFee;
    let hasFlowers = false;
    const typeCounts: Record<string, number> = {};
    for (const [id, quantity] of Object.entries(line.configuration.components)) {
      const found = componentsById.get(id);
      if (!found || !found.isAvailable) fail('A selected bouquet component is no longer available.', 'UNAVAILABLE', 409);
      if (quantity < Math.max(1, found.minQuantity) || quantity > (found.maxQuantity ?? 100)) fail(`Please check the quantity for ${found.name}.`);
      typeCounts[found.type] = (typeCounts[found.type] || 0) + quantity;
      if (!['WRAPPING', 'CARD'].includes(found.type)) hasFlowers = true;
      unitPrice += ['WRAPPING', 'CARD'].includes(found.type) ? 0 : money(found.unitPrice) * quantity;
      addDemand(componentDemand, id, quantity * line.quantity);
    }
    if (!hasFlowers) fail('Choose at least one flower or decorative component for your bouquet.');
    if ((typeCounts.WRAPPING || 0) > 1 || (typeCounts.CARD || 0) > 1) fail('Choose at most one wrapping and one card per bouquet.');
    if (!website && line.unitPriceOverride !== undefined) unitPrice = line.unitPriceOverride;
    return { productId: null, productName: 'Custom Built Bouquet', quantity: line.quantity, unitPrice: money(unitPrice),
      totalPrice: money(unitPrice * line.quantity), configuration: { ...line.configuration, componentNames: Object.fromEntries(Object.keys(line.configuration.components).map(id => [id, componentsById.get(id)!.name])) } };
  });
  if (reserveStock) {
    for (const [id, quantity] of productDemand) if ((productsById.get(id)?.stock ?? 0) < quantity) fail('There is not enough stock for an item in your cart.', 'OUT_OF_STOCK', 409);
    for (const [id, quantity] of componentDemand) if ((componentsById.get(id)?.stock ?? 0) < quantity) fail('There is not enough stock for your selected bouquet components.', 'OUT_OF_STOCK', 409);
  } else { productDemand.clear(); componentDemand.clear(); }

  let deliveryFee = 0;
  let city = input.city;
  let deliveryEstimate: string | null = null;
  if (!input.handDelivered && (!input.fulfillmentMethod || input.fulfillmentMethod === 'DELIVERY')) {
    if (!input.deliveryZoneId) fail('Please select a delivery city.');
    const query = reader.select().from(deliveryZone).where(and(eq(deliveryZone.id, input.deliveryZoneId), eq(deliveryZone.isActive, true)));
    const [zone] = await (lock ? query.for('share') : query);
    if (!zone || zone.name.trim().toLocaleLowerCase() !== input.city.trim().toLocaleLowerCase()) fail('Please select a valid delivery city.', 'INVALID_ZONE');
    deliveryFee = money(zone.fee);
    city = zone.name;
    deliveryEstimate = zone.deliveryTime;
  }
  const subtotal = money(items.reduce((sum, line) => sum + line.totalPrice, 0));
  let promoDiscount = 0;
  let promoId: string | undefined;
  if (input.promoCode) {
    const query = reader.select().from(promoCode).where(eq(promoCode.code, input.promoCode.trim().toUpperCase()));
    const [promo] = await (lock ? query.for('update') : query);
    if (!promo || !promo.isActive || (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit)) fail('This promo code is invalid or has reached its usage limit.', 'INVALID_PROMO');
    if (!['PERCENTAGE', 'FIXED'].includes(promo.type) || promo.value < 0 || (promo.type === 'PERCENTAGE' && promo.value > 100)) fail('This promo code is not configured correctly.', 'INVALID_PROMO');
    promoDiscount = Math.min(subtotal, promo.type === 'PERCENTAGE' ? Math.round(subtotal * promo.value / 100) : promo.value);
    promoId = promo.id;
  }
  const manualDiscount = money(input.manualDiscount || 0);
  if (manualDiscount + promoDiscount > subtotal) fail('The discount cannot exceed the merchandise subtotal.');
  const discountBeforeGift = promoDiscount + manualDiscount;
  let giftAmount = 0;
  let giftCardId: string | undefined;
  if (input.giftCardCode) {
    const query = reader.select().from(giftCard).where(eq(giftCard.code, input.giftCardCode.trim().toUpperCase()));
    const [card] = await (lock ? query.for('update') : query);
    if (!card || !card.isActive || card.currentBalance <= 0) fail('This gift card is invalid or has no remaining balance.', 'INVALID_GIFT');
    giftAmount = Math.min(card.currentBalance, subtotal - discountBeforeGift);
    giftCardId = card.id;
  }
  const discount = discountBeforeGift + giftAmount;
  return { items, subtotal, deliveryFee, discount, promoDiscount, giftAmount,
    total: money(subtotal - discount + deliveryFee), city, deliveryEstimate, productDemand, componentDemand, promoId, giftCardId, stockReserved: reserveStock };
}

export async function quoteCheckout(payload: unknown, database: CommerceDatabase = db) {
  const parsed = CheckoutQuoteSchema.safeParse(payload);
  if (!parsed.success) fail(parsed.error.issues[0]?.message || 'Please check your cart and delivery city.');
  return publicQuote(await priceOrder(database, parsed.data, false, true));
}

async function resolveCustomer(tx: CommerceTransaction, name: string, email: string | null, phone: string) {
  // Serialize both identifiers in a stable order to prevent duplicate customer inserts.
  for (const key of [`phone:${phone}`, ...(email ? [`email:${email}`] : [])].sort()) {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
  }
  const matches = await tx.select().from(customer).where(sql`right(regexp_replace(${customer.phone}, '[^0-9]', '', 'g'), 9) = ${phone.slice(-9)} OR (${email}::text IS NOT NULL AND lower(trim(${customer.email})) = ${email})`).orderBy(customer.id).for('update');
  const phoneMatch = matches.find(value => normalizePhone(value.phone) === phone);
  const emailMatch = email ? matches.find(value => value.email?.trim().toLowerCase() === email) : undefined;
  if (emailMatch && emailMatch.id !== phoneMatch?.id) fail('These contact details conflict with an existing customer. Please use the original details or contact support.', 'CONTACT_CONFLICT', 409);
  if (phoneMatch) return phoneMatch;
  const [created] = await tx.insert(customer).values({ id: randomUUID(), firstName: name, lastName: '', email, phone, updatedAt: new Date() }).returning();
  return created;
}

type CreateInput = QuoteInput & { customerName: string; email?: string; phoneNumber: string; address: string; notes?: string; source: string; expectedTotal?: number; quoteVersion?: string; recipientName?: string; recipientPhone?: string; manualDiscountReason?: string; actorId?: string; ownerClerkId?: string | null; idempotencyKey: string; receivedPayment?: import('@stemory/contracts').AssistedDraftData['receivedPayment'] };

async function commitOrder(input: CreateInput, database: CommerceDatabase) {
  return database.transaction(tx => commitOrderInTransaction(input, tx));
}

async function commitOrderInTransaction(input: CreateInput, tx: CommerceTransaction) {
  getReceiptSecret();
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(input.idempotencyKey)) fail('A valid checkout attempt key is required.');
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${input.idempotencyKey}, 0))`);
  const previous = await tx.query.order.findFirst({ where: eq(order.idempotencyKey, input.idempotencyKey) });
  if (previous) {
    const address = previous.deliveryAddress as OrderAddress;
    if (address.requestFingerprint !== fingerprint) fail('This checkout attempt was already used with different details. Start a new attempt.', 'IDEMPOTENCY_CONFLICT', 409);
    return { id: previous.id, orderNumber: previous.orderNumber, total: previous.total, receiptUrl: receiptUrl(previous.orderNumber, address), replayed: true };
  }
  const quote = await priceOrder(tx, input, true, input.source === 'WEBSITE');
  if (input.expectedTotal !== undefined && quote.total !== input.expectedTotal) fail('Your order total has changed. Review the updated total before placing your order.', 'PRICE_CHANGED', 409);
  if (input.quoteVersion && input.quoteVersion !== staffQuoteVersion(quote)) fail('Prices or discounts changed. Review a fresh quote before creating this order.', 'PRICE_CHANGED', 409);
  const normalizedEmail = input.email?.trim().toLowerCase() || null;
  const phone = normalizePhone(input.phoneNumber);
  const buyer = await resolveCustomer(tx, input.customerName, normalizedEmail, phone);
  const method = input.fulfillmentMethod || (input.handDelivered ? 'HAND_DELIVERY' : 'DELIVERY');
  const address: OrderAddress = { city: quote.city, addressLine1: method === 'PICKUP' ? 'Customer pickup' : method === 'HAND_DELIVERY' ? 'Hand delivered' : input.address,
    fulfillmentMethod: method, stockReserved: quote.stockReserved,
    priceOverrides: input.cartItems.flatMap((line, index) => line.unitPriceOverride !== undefined ? [{ line: index, unitPrice: line.unitPriceOverride, reason: line.priceOverrideReason || '' }] : []),
    recipientSnapshot: input.recipientName && input.recipientPhone ? { name: input.recipientName, phone: normalizePhone(input.recipientPhone) } : undefined,
    manualDiscountReason: input.manualDiscountReason, manualDiscount: input.manualDiscount,
    deliveryZoneId: input.deliveryZoneId, deliveryEstimate: quote.deliveryEstimate,
    customerSnapshot: { firstName: input.customerName, lastName: '', email: normalizedEmail, phone },
    ownerClerkId: input.ownerClerkId || null, receiptNonce: randomBytes(32).toString('hex'), requestFingerprint: fingerprint,
    redemptions: { promoId: quote.promoId, giftCardId: quote.giftCardId, giftAmount: quote.giftAmount, promoAmount: quote.promoDiscount } };
  const now = new Date();
  const orderNumber = `${input.source === 'WEBSITE' ? 'ORD' : 'AST'}-${randomUUID().replaceAll('-', '').slice(0, 20).toUpperCase()}`;
  const [created] = await tx.insert(order).values({ id: randomUUID(), orderNumber, idempotencyKey: input.idempotencyKey,
    customerId: buyer.id, subtotal: quote.subtotal, deliveryFee: quote.deliveryFee, discount: quote.discount, total: quote.total,
    source: input.source, status: input.source === 'WEBSITE' ? 'NEW' : 'CONFIRMED',
    notes: input.notes, deliveryAddress: address, updatedAt: now }).returning();
  await tx.insert(orderItem).values(quote.items.map(line => ({ ...line, id: randomUUID(), orderId: created.id, updatedAt: now })));
  const stockChanges: StockChange[] = [];
  for (const [id, quantity] of [...quote.productDemand].sort(([a], [b]) => a.localeCompare(b))) {
    const updated = await tx.update(product).set({ stock: sql`${product.stock} - ${quantity}`,
      updatedAt: now })
      .where(and(eq(product.id, id), eq(product.isAvailable, true), eq(product.status, 'PUBLISHED'), sql`${product.stock} >= ${quantity}`)).returning({ id: product.id, stock: product.stock, name: product.name });
    if (updated.length !== 1) fail('Stock changed. Please review your cart.', 'OUT_OF_STOCK', 409);
    stockChanges.push({ kind: 'PRODUCT', id, name: updated[0].name, before: updated[0].stock + quantity, after: updated[0].stock, delta: -quantity });
  }
  for (const [id, quantity] of [...quote.componentDemand].sort(([a], [b]) => a.localeCompare(b))) {
    const updated = await tx.update(builderComponent).set({ stock: sql`${builderComponent.stock} - ${quantity}`,
      updatedAt: now })
      .where(and(eq(builderComponent.id, id), eq(builderComponent.isAvailable, true), sql`${builderComponent.stock} >= ${quantity}`)).returning({ id: builderComponent.id, stock: builderComponent.stock, name: builderComponent.name });
    if (updated.length !== 1) fail('Bouquet component stock changed. Please review your cart.', 'OUT_OF_STOCK', 409);
    stockChanges.push({ kind: 'COMPONENT', id, name: updated[0].name, before: updated[0].stock + quantity, after: updated[0].stock, delta: -quantity });
  }
  if (quote.promoId) {
    const updated = await tx.update(promoCode).set({ usageCount: sql`${promoCode.usageCount} + 1`, updatedAt: now })
      .where(and(eq(promoCode.id, quote.promoId), eq(promoCode.isActive, true), sql`(${promoCode.usageLimit} IS NULL OR ${promoCode.usageCount} < ${promoCode.usageLimit})`)).returning({ id: promoCode.id });
    if (updated.length !== 1) fail('This promo code has reached its usage limit.', 'INVALID_PROMO', 409);
  }
  if (quote.giftCardId && quote.giftAmount > 0) {
    const updated = await tx.update(giftCard).set({ currentBalance: sql`${giftCard.currentBalance} - ${quote.giftAmount}`, updatedAt: now })
      .where(and(eq(giftCard.id, quote.giftCardId), eq(giftCard.isActive, true), sql`${giftCard.currentBalance} >= ${quote.giftAmount}`)).returning({ id: giftCard.id });
    if (updated.length !== 1) fail('This gift card balance has changed.', 'INVALID_GIFT', 409);
  }
  if (stockChanges.length && await inventorySchemaReady(tx)) await finishStockOperation(tx, { id: randomUUID(), type: 'ORDER_RESERVATION', actorId: input.actorId || null, reason: `Reserved for order ${orderNumber}`, requestHash: fingerprint, subjectName: orderNumber, finalQuantity: 0, changes: stockChanges });
  await tx.insert(orderStatusHistory).values({ id: randomUUID(), orderId: created.id, status: created.status, note: input.manualDiscount ? `Order created; manual discount ${input.manualDiscount} MAD: ${input.manualDiscountReason}` : 'Order created', actorId: input.actorId, createdAt: now });
  await tx.insert(adminNotification).values({ id: randomUUID(), type: 'ORDER_NEW', title: 'New order received', message: `Order ${created.orderNumber} — ${created.total} MAD`, isRead: false, createdAt: now });
  await tx.insert(notificationOutbox).values({ id: randomUUID(), type: 'ORDER_CONFIRMATION', recipient: normalizedEmail || 'MERCHANT',
    payload: { orderId: created.id }, status: 'PENDING', updatedAt: now });
  if (input.receivedPayment) {
    if (!input.actorId || input.source === 'WEBSITE') fail('Only an administrator may record a received payment.');
    await recordPaymentInTransaction({ operationId: randomUUID(), orderId: created.id, payment: input.receivedPayment, channel: 'DIRECT', reason: 'Payment verified when creating this assisted order' }, input.actorId, tx);
  }
  return { id: created.id, orderNumber: created.orderNumber, total: created.total, receiptUrl: receiptUrl(created.orderNumber, address), replayed: false };
}

export async function createCheckout(payload: unknown, idempotencyKey: string, ownerClerkId: string | null = null, database: CommerceDatabase = db) {
  const parsed = CheckoutPayloadSchema.safeParse(payload);
  if (!parsed.success) fail(parsed.error.issues[0]?.message || 'Please check your order details.');
  return commitOrder({ ...parsed.data, notes: parsed.data.deliveryInstructions, source: 'WEBSITE', ownerClerkId, idempotencyKey }, database);
}

function staffPricingInput(input: AssistedQuoteInput): QuoteInput {
  const { items, isHandDelivered, ...pricing } = input;
  const cartItems: OrderLine[] = [];
  const components: Record<string, number> = {};
  items.forEach((line, index) => {
    const override = { unitPriceOverride: line.unitPriceOverride, priceOverrideReason: line.priceOverrideReason };
    if (line.productId === 'CUSTOM') cartItems.push({ kind: 'MANUAL', cartLineId: `manual-${index}`, name: line.customName!, unitPrice: line.unitPriceOverride ?? line.customPrice!, quantity: line.quantity, ...override });
    else if (line.productId === 'BOUQUET') cartItems.push({ kind: 'CUSTOM', cartLineId: `bouquet-${index}`, quantity: line.quantity, configuration: line.configuration!, ...override });
    else if (line.productId.startsWith('COMPONENT_')) { const id = line.productId.slice(10); components[id] = (components[id] || 0) + line.quantity; }
    else cartItems.push({ kind: 'PRODUCT', cartLineId: `product-${index}`, productId: line.productId, quantity: line.quantity, ...override });
  });
  if (Object.keys(components).length) cartItems.push({ kind: 'CUSTOM', cartLineId: 'staff-bouquet', quantity: 1, configuration: { components } });
  const method = pricing.fulfillmentMethod || (isHandDelivered ? 'HAND_DELIVERY' : 'DELIVERY');
  return { ...pricing, city: method === 'PICKUP' ? 'Customer pickup' : method === 'HAND_DELIVERY' ? 'In person' : pricing.city, cartItems, handDelivered: method !== 'DELIVERY' };
}
function staffQuoteVersion(quote: InternalQuote) {
  return createHash('sha256').update(JSON.stringify({ ...publicQuote(quote), promoId: quote.promoId, giftCardId: quote.giftCardId })).digest('hex');
}
export async function quoteStaffOrder(payload: unknown, database: CommerceDatabase = db) {
  const parsed = AssistedQuoteSchema.safeParse(payload);
  if (!parsed.success) fail(parsed.error.issues[0]?.message || 'Check the items and delivery details.');
  const quote = await priceOrder(database, staffPricingInput(parsed.data), false, false);
  return { ...publicQuote(quote), quoteVersion: staffQuoteVersion(quote) };
}
export type StaffOrderQuote = Awaited<ReturnType<typeof quoteStaffOrder>>;

export async function createStaffOrderInTransaction(payload: unknown, tx: CommerceTransaction, actorId?: string) {
  const parsed = AssistedOrderSchema.safeParse(payload);
  if (!parsed.success) fail(parsed.error.issues[0]?.message || 'Please check the order details.');
  return commitOrderInTransaction({ ...parsed.data, ...staffPricingInput(parsed.data), actorId }, tx);
}
export async function createStaffOrder(payload: unknown, database: CommerceDatabase = db, actorId?: string) {
  return database.transaction(tx => createStaffOrderInTransaction(payload, tx, actorId));
}
