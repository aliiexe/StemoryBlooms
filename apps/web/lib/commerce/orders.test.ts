import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as tables from '../../../../packages/database/schema';
import * as relations from '../../../../packages/database/relations';
import { createCheckout, createStaffOrder, quoteCheckout, type CommerceDatabase } from './orders';
import { transitionOrder, archiveOrder, recordCashCollection } from './order-lifecycle';
import { receiptToken, verifyReceiptToken } from './receipt-access';
import { checkoutCartLines } from './cart-lines';
import { purchaseMaterial, saveInventoryMaterial, correctMaterial } from './inventory';

let pg: PGlite;
let database: CommerceDatabase;
const key = (suffix: string) => `checkout-test-${suffix.padStart(16, '0')}`;
const payload = () => ({ customerName: 'Test Buyer', email: 'buyer@example.com', phoneNumber: '0612345678',
  city: 'Casablanca', address: 'Test street number 10', deliveryZoneId: 'zone', expectedTotal: 120,
  cartItems: [{ kind: 'PRODUCT', cartLineId: 'line-1', productId: 'product', quantity: 1 }],
  termsAccepted: true, deliveryPolicyAccepted: true, privacyNoticeAccepted: true, codConditionsAccepted: true });

before(async () => {
  process.env.RECEIPT_SIGNING_SECRET = 'isolated-test-secret-only';
  pg = new PGlite();
  for (const filename of ['0000_right_doctor_doom.sql', '0001_order_delivery_flag.sql']) {
    await pg.exec(readFileSync(new URL(`../../../../packages/database/drizzle/${filename}`, import.meta.url), 'utf8'));
  }
  database = drizzle(pg, { schema: { ...tables, ...relations } }) as unknown as CommerceDatabase;
});
beforeEach(async () => {
  await pg.exec('TRUNCATE "Order", "Customer", "Product", "BuilderComponent", "DeliveryZone", "PromoCode", "GiftCard", "SiteSettings", "AdminNotification", "NotificationOutbox", "User", "Material", "Supplier", "Expense", "StockMovement" CASCADE');
  const now = new Date();
  await database.insert(tables.siteSettings).values({ id: 'settings', mode: 'LIVE', config: { customBouquetBaseFee: 19 }, updatedAt: now });
  await database.insert(tables.product).values({ id: 'product', name: 'Trusted product name', basePrice: 100, stock: 1, status: 'PUBLISHED', isAvailable: true, updatedAt: now });
  await database.insert(tables.deliveryZone).values({ id: 'zone', name: 'Casablanca', fee: 20, isActive: true, updatedAt: now });
  await database.insert(tables.builderComponent).values([
    { id: 'flower', name: 'Rose', type: 'FLOWER', unitPrice: 30, stock: 10, minQuantity: 1, maxQuantity: 5, updatedAt: now },
    { id: 'wrap', name: 'Wrapping', type: 'WRAPPING', unitPrice: 15, stock: 10, updatedAt: now },
    { id: 'card', name: 'Card', type: 'CARD', unitPrice: 12, stock: 10, updatedAt: now },
  ]);
});
after(async () => { await pg.close(); });

test('catalog purchase commits stock, immutable contact, history, and a durable notification together', async () => {
  const result = await createCheckout(payload(), key('purchase'), 'signed-in-owner', database);
  assert.equal(result.total, 120);
  assert.match(result.receiptUrl, /token=/);
  assert.equal((await database.query.product.findFirst())?.stock, 0);
  assert.equal((await database.query.orderItem.findFirst())?.productName, 'Trusted product name');
  const address = (await database.query.order.findFirst())?.deliveryAddress as Record<string, unknown>;
  assert.equal(address.ownerClerkId, 'signed-in-owner');
  assert.deepEqual(address.customerSnapshot, { firstName: 'Test Buyer', lastName: '', email: 'buyer@example.com', phone: '+212612345678' });
  assert.equal((await database.query.orderStatusHistory.findMany()).length, 1);
  assert.equal((await database.query.notificationOutbox.findMany()).length, 1);
});

test('a retry returns the same order even after stock is exhausted; changed details cannot reuse the key', async () => {
  const first = await createCheckout(payload(), key('retry'), null, database);
  const second = await createCheckout(payload(), key('retry'), null, database);
  assert.equal(first.id, second.id); assert.equal(second.replayed, true); assert.equal(first.receiptUrl, second.receiptUrl);
  await assert.rejects(createCheckout({ ...payload(), address: 'A different address' }, key('retry'), null, database), /different details/);
  assert.equal((await database.query.order.findMany()).length, 1);
});

test('competing requests for the final unit accept exactly one order', async () => {
  const results = await Promise.allSettled([createCheckout(payload(), key('race-a'), null, database), createCheckout(payload(), key('race-b'), null, database)]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await database.query.order.findMany()).length, 1);
  assert.equal((await database.query.product.findFirst())?.stock, 0);
});

test('duplicate cart lines cannot oversell; rejection leaves no order, customer, or notification', async () => {
  const input = payload(); input.cartItems.push({ ...input.cartItems[0], cartLineId: 'line-2' }); input.expectedTotal = 220;
  await assert.rejects(createCheckout(input, key('aggregate'), null, database), /not enough stock/);
  assert.equal((await database.query.order.findMany()).length, 0);
  assert.equal((await database.query.customer.findMany()).length, 0);
  assert.equal((await database.query.notificationOutbox.findMany()).length, 0);
});

test('fractional, negative, unknown, unavailable, and out-of-range custom selections cannot create orders', async () => {
  for (const quantity of [-1, 0, 1.5, 101]) {
    await assert.rejects(createCheckout({ ...payload(), cartItems: [{ kind: 'CUSTOM', cartLineId: 'custom', quantity: 1, configuration: { components: { flower: quantity } } }] }, key(`bad-${quantity}`), null, database));
  }
  for (const components of [{ missing: 1 }, { flower: 6 }, { wrap: 1 }]) {
    await assert.rejects(createCheckout({ ...payload(), cartItems: [{ kind: 'CUSTOM', cartLineId: 'custom', quantity: 1, configuration: { components } }] }, key('bad-components'), null, database));
  }
  assert.equal((await database.query.order.findMany()).length, 0);
});

test('custom cart migration preserves card text and included wrapping/card prices match the committed order', async () => {
  const cartItems = checkoutCartLines([{ id: 'custom-123', quantity: 1, configuration: { flower: 2, wrap: 1, card: 1, cardMessage: 'For you' } }]);
  const input = { ...payload(), cartItems, expectedTotal: 99 };
  const quote = await quoteCheckout(input, database); assert.equal(quote.total, 99);
  const created = await createCheckout(input, key('custom'), null, database); assert.equal(created.total, quote.total);
  assert.deepEqual((await database.query.orderItem.findFirst())?.configuration, { components: { flower: 2, wrap: 1, card: 1 }, cardMessage: 'For you', componentNames: { flower: 'Rose', wrap: 'Wrapping', card: 'Card' } });
  const components = await database.query.builderComponent.findMany();
  assert.equal(components.find(value => value.id === 'flower')?.stock, 8);
  assert.equal(components.find(value => value.id === 'card')?.stock, 9);
});

test('store mode, destination, publication, and changed price are enforced at the write boundary', async () => {
  await assert.rejects(createCheckout({ ...payload(), city: 'Another city' }, key('city'), null, database), /delivery city/);
  await assert.rejects(createCheckout({ ...payload(), expectedTotal: 1 }, key('price'), null, database), /total has changed/);
  await pg.exec('UPDATE "SiteSettings" SET mode = \'MAINTENANCE\'');
  await assert.rejects(createCheckout(payload(), key('closed'), null, database), /not accepting orders/);
  await pg.exec('UPDATE "SiteSettings" SET mode = \'LIVE\'; UPDATE "Product" SET status = \'DRAFT\'');
  await assert.rejects(createCheckout(payload(), key('draft'), null, database), /no longer available/);
  assert.equal((await database.query.order.findMany()).length, 0);
});

test('promo limits and gift balance cannot be spent by a second order', async () => {
  await pg.exec('UPDATE "Product" SET stock = 3');
  await database.insert(tables.promoCode).values({ id: 'promo', code: 'ONCE', type: 'FIXED', value: 10, usageLimit: 1, updatedAt: new Date() });
  await database.insert(tables.giftCard).values({ id: 'gift', code: 'GIFT', initialBalance: 50, currentBalance: 50, updatedAt: new Date() });
  await createCheckout({ ...payload(), promoCode: 'ONCE', giftCardCode: 'GIFT', expectedTotal: 60 }, key('benefit-first'), null, database);
  await assert.rejects(createCheckout({ ...payload(), promoCode: 'ONCE', expectedTotal: 110 }, key('benefit-second'), null, database), /usage limit/);
  await assert.rejects(createCheckout({ ...payload(), giftCardCode: 'GIFT', expectedTotal: 70 }, key('gift-second'), null, database), /remaining balance/);
  assert.equal((await database.query.giftCard.findFirst())?.currentBalance, 0);
  assert.equal((await database.query.promoCode.findFirst())?.usageCount, 1);
});

test('cancellation reverses stock and benefits once; archival retains records and does not restock delivered orders', async () => {
  const created = await createCheckout(payload(), key('cancel'), null, database);
  await transitionOrder(created.id, 'CANCELLED', 'test-admin', database);
  await transitionOrder(created.id, 'CANCELLED', 'test-admin', database);
  assert.equal((await database.query.product.findFirst())?.stock, 1);
  await transitionOrder(created.id, 'CONFIRMED', 'test-admin', database);
  await transitionOrder(created.id, 'READY', 'test-admin', database);
  await transitionOrder(created.id, 'DELIVERED', 'test-admin', database);
  await assert.rejects(transitionOrder(created.id, 'CANCELLED', 'test-admin', database), /not allowed/);
  await recordCashCollection(created.id, 'test-admin', database);
  await recordCashCollection(created.id, 'test-admin', database);
  assert.equal((await database.query.paymentStatusHistory.findMany()).length, 1);
  await archiveOrder(created.id, 'test-admin', database);
  assert.equal((await database.query.orderItem.findMany()).length, 1);
  assert.equal((await database.query.product.findFirst())?.stock, 0);
});

test('staff orders use the same stock protections and reject malformed or negative input', async () => {
  const input = { source: 'PHONE', customerName: 'Staff buyer', phoneNumber: '0612345678', city: 'Casablanca', address: 'Test address 10', deliveryZoneId: 'zone', manualDiscount: 0, items: [{ productId: 'product', quantity: 1 }], idempotencyKey: key('staff') };
  const created = await createStaffOrder(input, database); assert.equal(created.total, 120);
  await assert.rejects(createStaffOrder({ ...input, idempotencyKey: key('staff-again') }, database), /available|stock/);
  await assert.rejects(createStaffOrder({ ...input, manualDiscount: -1 }, database));
});

test('receipt tokens are bound to both the order and its revocable nonce', () => {
  const nonce = 'a'.repeat(64); const secret = 'test-key'; const token = receiptToken('ORD-one', nonce, secret);
  assert.equal(verifyReceiptToken(token, 'ORD-one', nonce, secret), true);
  for (const [candidate, reference, seed, keyValue] of [[undefined, 'ORD-one', nonce, secret], [token, 'ORD-two', nonce, secret], [token, 'ORD-one', 'b'.repeat(64), secret], [token, 'ORD-one', nonce, 'wrong']]) {
    assert.equal(verifyReceiptToken(candidate, reference as string, seed, keyValue as string), false);
  }
});

test('malformed unicode receipt tokens fail closed', () => {
  assert.equal(verifyReceiptToken('é'.repeat(43), 'ORD-test', 'a'.repeat(64), 'secret'), false);
});

test('a late database failure rolls back the order, stock, customer, benefits, and outbox', async () => {
  await database.insert(tables.giftCard).values({ id: 'gift', code: 'GIFT', initialBalance: 50, currentBalance: 50, updatedAt: new Date() });
  await pg.exec(`CREATE FUNCTION reject_notification() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$ LANGUAGE plpgsql;
    CREATE TRIGGER reject_notification BEFORE INSERT ON "AdminNotification" FOR EACH ROW EXECUTE FUNCTION reject_notification();`);
  try {
    await assert.rejects(createCheckout({ ...payload(), giftCardCode: 'GIFT', expectedTotal: 70 }, key('rollback'), null, database));
    assert.equal((await database.query.product.findFirst())?.stock, 1);
    assert.equal((await database.query.customer.findMany()).length, 0);
    assert.equal((await database.query.order.findMany()).length, 0);
    assert.equal((await database.query.orderItem.findMany()).length, 0);
    assert.equal((await database.query.giftCard.findFirst())?.currentBalance, 50);
    assert.equal((await database.query.notificationOutbox.findMany()).length, 0);
  } finally { await pg.exec('DROP TRIGGER reject_notification ON "AdminNotification"; DROP FUNCTION reject_notification()'); }
});

test('cancelling restores gift balance and promo allowance exactly once', async () => {
  await database.insert(tables.promoCode).values({ id: 'promo', code: 'ONCE', type: 'FIXED', value: 10, usageLimit: 1, updatedAt: new Date() });
  await database.insert(tables.giftCard).values({ id: 'gift', code: 'GIFT', initialBalance: 50, currentBalance: 50, updatedAt: new Date() });
  const created = await createCheckout({ ...payload(), promoCode: 'ONCE', giftCardCode: 'GIFT', expectedTotal: 60 }, key('reverse'), null, database);
  await transitionOrder(created.id, 'CANCELLED', 'test-admin', database);
  await transitionOrder(created.id, 'CANCELLED', 'test-admin', database);
  assert.equal((await database.query.giftCard.findFirst())?.currentBalance, 50);
  assert.equal((await database.query.promoCode.findFirst())?.usageCount, 0);
  await assert.rejects(transitionOrder(created.id, 'CONFIRMED', 'test-admin', database), /new order/);
  assert.equal((await database.query.product.findFirst())?.stock, 1);
});

test('material supplier, purchase cost, and movements persist in the same transaction', async () => {
  await database.insert(tables.supplier).values({ id: 'supplier', name: 'Test supplier', updatedAt: new Date() });
  const saved = await saveInventoryMaterial(null, { name: 'Paper', quantity: 2, cost: 1.25, lowStockThreshold: 3, supplierId: 'supplier' }, 'test-admin', database);
  assert.equal(saved.supplierId, 'supplier');
  await Promise.all([purchaseMaterial(saved.id, 3, 'test-admin', database), purchaseMaterial(saved.id, 4, 'test-admin', database)]);
  assert.equal((await database.query.material.findFirst())?.quantity, 9);
  const purchases = await database.query.expense.findMany();
  assert.equal(purchases.reduce((sum, entry) => sum + entry.amount, 0), 11.25);
  assert.equal((await database.query.stockMovement.findMany()).length, 3);
  await assert.rejects(purchaseMaterial(saved.id, -1, 'test-admin', database), /positive whole/);
  await assert.rejects(correctMaterial(saved.id, { quantity: 7, expectedQuantity: 2 }, 'test-admin', database), /Stock changed/);
  assert.equal((await database.query.material.findFirst())?.quantity, 9);
});

test('failed purchase expenses roll back restocked quantity and its movement', async () => {
  const saved = await saveInventoryMaterial(null, { name: 'Paper', quantity: 0, cost: 1.25, lowStockThreshold: 3 }, 'test-admin', database);
  await pg.exec(`CREATE FUNCTION reject_expense() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$ LANGUAGE plpgsql;
    CREATE TRIGGER reject_expense BEFORE INSERT ON "Expense" FOR EACH ROW EXECUTE FUNCTION reject_expense();`);
  try {
    await assert.rejects(purchaseMaterial(saved.id, 5, 'test-admin', database));
    assert.equal((await database.query.material.findFirst())?.quantity, 0);
    assert.equal((await database.query.stockMovement.findMany()).length, 0);
  } finally { await pg.exec('DROP TRIGGER reject_expense ON "Expense"; DROP FUNCTION reject_expense()'); }
});
