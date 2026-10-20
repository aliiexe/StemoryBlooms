import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as tables from '../../../../packages/database/schema';
import * as relations from '../../../../packages/database/relations';
import { createCheckout, createStaffOrder, quoteCheckout, quoteStaffOrder, type CommerceDatabase } from './orders';
import { transitionOrder, archiveOrder, recordCashCollection } from './order-lifecycle';
import { receiptToken, verifyReceiptToken } from './receipt-access';
import { checkoutCartLines } from './cart-lines';
import { saveOrderDraft, convertOrderDraft, setDraftArchived, readDraftPayload } from './drafts';
import { AssistedDraftDataSchema } from '@stemory/contracts';
import { randomUUID } from 'node:crypto';
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
  await pg.exec('TRUNCATE "Order", "Customer", "Product", "BuilderComponent", "DeliveryZone", "PromoCode", "GiftCard", "SiteSettings", "AdminNotification", "NotificationOutbox", "User", "Material", "Supplier", "Expense", "StockMovement", "DraftOrder", "AuditLog" CASCADE');
  const now = new Date();
  await database.insert(tables.user).values({ id: 'test-admin', clerkId: 'test-clerk-admin', email: 'admin@example.com', updatedAt: now });
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
  const quote = await quoteStaffOrder(inputForQuote(input), database);
  const approved = { ...input, expectedTotal: quote.total, quoteVersion: quote.quoteVersion };
  const created = await createStaffOrder(approved, database); assert.equal(created.total, 120);
  await assert.rejects(createStaffOrder({ ...approved, idempotencyKey: key('staff-again') }, database), /available|stock/);
  await assert.rejects(createStaffOrder({ ...approved, manualDiscount: -1 }, database));
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

function staffData() {
  return AssistedDraftDataSchema.parse({ source: 'PHONE', customerName: 'Staff buyer', phoneNumber: '0612345678',
    city: 'Casablanca', address: 'Test address 10', deliveryZoneId: 'zone', items: [{ productId: 'product', quantity: 1 }] });
}
function inputForQuote(data: Record<string, unknown>) {
  return Object.fromEntries(['source', 'city', 'deliveryZoneId', 'manualDiscount', 'manualDiscountReason', 'promoCode', 'isHandDelivered', 'items'].filter(name => data[name] !== undefined).map(name => [name, data[name]]));
}
function newDraft(data = staffData()) { return { id: randomUUID(), expectedRevision: 0, title: 'Custom request', data }; }

test('staff quote applies current promo, manual discount, and delivery without reserving anything', async () => {
  await database.insert(tables.promoCode).values({ id: 'promo', code: 'TEN', type: 'PERCENTAGE', value: 10, updatedAt: new Date() });
  const data = { ...staffData(), promoCode: 'TEN', manualDiscount: 5, manualDiscountReason: 'Agreed loyalty discount' };
  const quote = await quoteStaffOrder(inputForQuote(data), database);
  assert.equal(quote.total, 105); assert.equal(quote.promoDiscount, 10);
  assert.equal((await database.query.product.findFirst())?.stock, 1);
  assert.equal((await database.query.promoCode.findFirst())?.usageCount, 0);
  assert.equal((await database.query.customer.findMany()).length, 0);
  assert.equal((await database.query.notificationOutbox.findMany()).length, 0);
  await assert.rejects(quoteStaffOrder(inputForQuote({ ...data, manualDiscountReason: '' }), database), /reason/);
  await assert.rejects(quoteStaffOrder(inputForQuote({ ...data, isHandDelivered: true }), database), /in-person/);
});

test('staff creation requires a reviewed quote and catches price changes even when the final total is unchanged', async () => {
  const data = staffData(); const quote = await quoteStaffOrder(inputForQuote(data), database);
  await assert.rejects(createStaffOrder({ ...data, idempotencyKey: key('unquoted') }, database));
  await pg.exec('UPDATE "Product" SET "basePrice" = 110; UPDATE "DeliveryZone" SET fee = 10');
  await assert.rejects(createStaffOrder({ ...data, expectedTotal: 120, quoteVersion: quote.quoteVersion, idempotencyKey: key('stale-quote') }, database), /fresh quote/);
  assert.equal((await database.query.order.findMany()).length, 0);
  assert.equal((await database.query.product.findFirst())?.stock, 1);
});

test('multiple bouquet recipes preserve card text, component stock, and included packaging per bouquet', async () => {
  const data = { ...staffData(), items: [
    { productId: 'BOUQUET', quantity: 2, configuration: { components: { flower: 2, wrap: 1, card: 1 }, cardMessage: 'First recipient' } },
    { productId: 'BOUQUET', quantity: 1, configuration: { components: { flower: 1 }, cardMessage: 'Second recipient' } },
  ] };
  const quote = await quoteStaffOrder(inputForQuote(data), database); assert.equal(quote.total, 227);
  const created = await createStaffOrder({ ...data, expectedTotal: quote.total, quoteVersion: quote.quoteVersion, idempotencyKey: key('recipes') }, database);
  const lines = await database.query.orderItem.findMany();
  assert.equal(lines.length, 2); assert.equal(created.total, 227);
  assert.ok(lines.some(line => (line.configuration as { cardMessage: string }).cardMessage === 'Second recipient'));
  const stock = await database.query.builderComponent.findMany();
  assert.equal(stock.find(line => line.id === 'flower')?.stock, 5); assert.equal(stock.find(line => line.id === 'wrap')?.stock, 8);
});

test('incomplete draft saves replay safely and never become sales or reservations', async () => {
  const input = newDraft(AssistedDraftDataSchema.parse({ customerName: 'Partial buyer' }));
  const first = await saveOrderDraft(input, 'test-admin', database);
  const retry = await saveOrderDraft(input, 'test-admin', database);
  assert.equal(first.id, retry.id); assert.equal(first.revision, retry.revision);
  assert.equal((await database.query.draftOrder.findMany()).length, 1);
  assert.equal((await database.query.auditLog.findMany()).length, 1);
  assert.equal((await database.query.order.findMany()).length, 0);
  assert.equal((await database.query.customer.findMany()).length, 0);
  assert.equal((await database.query.product.findFirst())?.stock, 1);
});

test('concurrent draft edits reject the stale writer instead of overwriting the saved version', async () => {
  const input = newDraft(); const saved = await saveOrderDraft(input, 'test-admin', database);
  const results = await Promise.allSettled(['First change', 'Other change'].map(title => saveOrderDraft({ ...input, title, expectedRevision: saved.revision }, 'test-admin', database)));
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  const failed = results.find(result => result.status === 'rejected');
  assert.match(String(failed?.status === 'rejected' && failed.reason), /Another administrator/);
  assert.equal(readDraftPayload((await database.query.draftOrder.findFirst())?.payload)?.revision, 2);
});

test('concurrent conversions create one order and preserve recipient and discount snapshots', async () => {
  const input = newDraft({ ...staffData(), recipientName: 'Gift recipient', recipientPhone: '0712345678', manualDiscount: 5, manualDiscountReason: 'Loyalty' });
  const saved = await saveOrderDraft(input, 'test-admin', database);
  const quote = await quoteStaffOrder(inputForQuote(input.data), database);
  const request = { ...input, expectedRevision: saved.revision, expectedTotal: quote.total, quoteVersion: quote.quoteVersion };
  const results = await Promise.all([convertOrderDraft(request, 'test-admin', database), convertOrderDraft(request, 'test-admin', database)]);
  assert.equal(results[0].id, results[1].id); assert.ok(results.some(result => result.replayed));
  assert.equal((await database.query.order.findMany()).length, 1);
  assert.equal((await database.query.notificationOutbox.findMany()).length, 1);
  const envelope = readDraftPayload((await database.query.draftOrder.findFirst())?.payload)!;
  assert.equal(envelope.status, 'CONVERTED'); assert.equal(envelope.convertedOrderId, results[0].id);
  const address = (await database.query.order.findFirst())?.deliveryAddress as { recipientSnapshot: { name: string; phone: string }; manualDiscountReason: string };
  assert.deepEqual(address.recipientSnapshot, { name: 'Gift recipient', phone: '+212712345678' }); assert.equal(address.manualDiscountReason, 'Loyalty');
  await assert.rejects(saveOrderDraft({ ...input, title: 'Changed after conversion', expectedRevision: 1 }, 'test-admin', database), /Only active/);
});

test('conversion rolls back the new order when the final draft update fails', async () => {
  const input = newDraft(); const saved = await saveOrderDraft(input, 'test-admin', database);
  const quote = await quoteStaffOrder(inputForQuote(input.data), database);
  await pg.exec(`CREATE FUNCTION reject_conversion() RETURNS trigger AS $$ BEGIN IF NEW.payload->>'status' = 'CONVERTED' THEN RAISE EXCEPTION 'test conversion failure'; END IF; RETURN NEW; END $$ LANGUAGE plpgsql;
    CREATE TRIGGER reject_conversion BEFORE UPDATE ON "DraftOrder" FOR EACH ROW EXECUTE FUNCTION reject_conversion();`);
  try {
    await assert.rejects(convertOrderDraft({ ...input, expectedRevision: saved.revision, expectedTotal: quote.total, quoteVersion: quote.quoteVersion }, 'test-admin', database));
    assert.equal((await database.query.order.findMany()).length, 0); assert.equal((await database.query.customer.findMany()).length, 0);
    assert.equal((await database.query.product.findFirst())?.stock, 1); assert.equal((await database.query.notificationOutbox.findMany()).length, 0);
    assert.equal(readDraftPayload((await database.query.draftOrder.findFirst())?.payload)?.status, 'DRAFT');
    assert.equal((await database.query.auditLog.findMany()).length, 1);
  } finally { await pg.exec('DROP TRIGGER reject_conversion ON "DraftOrder"; DROP FUNCTION reject_conversion()'); }
});

test('archiving is reversible and archived drafts cannot be converted or edited', async () => {
  const input = newDraft(); const saved = await saveOrderDraft(input, 'test-admin', database);
  const quote = await quoteStaffOrder(inputForQuote(input.data), database);
  const archived = await setDraftArchived(input.id, saved.revision, true, 'test-admin', database);
  await assert.rejects(convertOrderDraft({ ...input, expectedRevision: archived.revision, expectedTotal: quote.total, quoteVersion: quote.quoteVersion }, 'test-admin', database), /Restore/);
  await assert.rejects(saveOrderDraft({ ...input, expectedRevision: archived.revision }, 'test-admin', database), /Only active/);
  const restored = await setDraftArchived(input.id, archived.revision, false, 'test-admin', database);
  assert.equal(restored.status, 'DRAFT'); assert.equal((await database.query.product.findFirst())?.stock, 1);
});

test('legacy form drafts can resume; unknown payloads are retained without guessing their meaning', async () => {
  const legacy = readDraftPayload({ ...staffData(), items: [{ id: 'local-row', productId: 'COMPONENT_flower', quantity: 2 }] });
  assert.equal(legacy?.revision, 0); assert.deepEqual(legacy?.data.items, [{ productId: 'BOUQUET', quantity: 1, configuration: { components: { flower: 2 } } }]);
  const id = randomUUID(); const original = { unknown: 'preserve this' };
  await database.insert(tables.draftOrder).values({ id, payload: original, updatedAt: new Date() });
  await assert.rejects(saveOrderDraft({ id, expectedRevision: 0, title: 'Overwrite', data: staffData() }, 'test-admin', database), /unsupported format/);
  assert.deepEqual((await database.query.draftOrder.findFirst())?.payload, original);
});


test('hand-delivered staff orders quote and commit the same city and require a complete recipient', async () => {
  const data = { ...staffData(), source: 'IN_PERSON', city: '', deliveryZoneId: undefined, isHandDelivered: true };
  const quote = await quoteStaffOrder(inputForQuote(data), database); assert.equal(quote.total, 100);
  await assert.rejects(createStaffOrder({ ...data, recipientName: 'Only name', expectedTotal: 100, quoteVersion: quote.quoteVersion, idempotencyKey: key('partial-recipient') }, database), /both recipient/);
  const created = await createStaffOrder({ ...data, expectedTotal: 100, quoteVersion: quote.quoteVersion, idempotencyKey: key('hand-delivery') }, database);
  assert.equal(created.total, 100);
  assert.equal(((await database.query.order.findFirst())?.deliveryAddress as { city: string }).city, 'In person');
});

test('an incomplete or stale draft conversion leaves its saved work and all order records unchanged', async () => {
  const input = newDraft(); const saved = await saveOrderDraft(input, 'test-admin', database);
  const quote = await quoteStaffOrder(inputForQuote(input.data), database);
  const request = { ...input, expectedRevision: saved.revision, expectedTotal: quote.total, quoteVersion: quote.quoteVersion };
  await assert.rejects(convertOrderDraft({ ...request, data: { ...input.data, phoneNumber: '' } }, 'test-admin', database));
  await saveOrderDraft({ ...input, title: 'Changed by another admin', expectedRevision: saved.revision }, 'test-admin', database);
  await assert.rejects(convertOrderDraft(request, 'test-admin', database), /Another administrator/);
  const current = readDraftPayload((await database.query.draftOrder.findFirst())?.payload)!;
  assert.equal(current.title, 'Changed by another admin'); assert.equal(current.status, 'DRAFT');
  assert.equal((await database.query.order.findMany()).length, 0); assert.equal((await database.query.product.findFirst())?.stock, 1);
});

test('a draft cannot reserve stock that sold after its quote', async () => {
  const input = newDraft(); const saved = await saveOrderDraft(input, 'test-admin', database);
  const quote = await quoteStaffOrder(inputForQuote(input.data), database);
  await createCheckout(payload(), key('other-buyer'), null, database);
  await assert.rejects(convertOrderDraft({ ...input, expectedRevision: saved.revision, expectedTotal: quote.total, quoteVersion: quote.quoteVersion }, 'test-admin', database), /available|stock/);
  assert.equal((await database.query.order.findMany()).length, 1);
  assert.equal(readDraftPayload((await database.query.draftOrder.findFirst())?.payload)?.revision, 1);
  assert.equal((await database.query.product.findFirst())?.stock, 0);
});
