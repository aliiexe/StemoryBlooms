import { rememberQuickComponent } from './quick-components';
import { recordReceivedPayment, paymentRowsForOrders, confirmCarrierBalance } from './payments';
import { paymentState } from './payment-state';
import {changeSiteSettings} from '../site-settings';
import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as tables from '../../../../packages/database/schema';
import * as relations from '../../../../packages/database/relations';
import { createCheckout, createStaffOrder, quoteCheckout, quoteStaffOrder, type CommerceDatabase } from './orders';
import { transitionOrder, archiveOrder, recordCashCollection } from './order-lifecycle';
import { receiptToken, verifyReceiptToken } from './receipt-access';
import { checkoutCartLines } from './cart-lines';
import { recordFinanceEntry, recordInspectedReturn, orderFinanceOverview } from './finance';
import { queueCarrierRegistration, processCarrierRegistrations, resolveCarrierRegistration, recordDeliveryHandoff } from './delivery';
import { quoteProduction, recordProduction } from './production';
import { correctStock } from './stock-ledger';
import { saveOrderDraft, convertOrderDraft, setDraftArchived, readDraftPayload } from './drafts';
import { AssistedDraftDataSchema } from '@stemory/contracts';
import { randomUUID } from 'node:crypto';
import { purchaseMaterial, saveInventoryMaterial, correctMaterial } from './inventory';

import { updateCustomerProfile } from './customers';
import { changeSupportStatus } from './support';
import { retryNotificationJob } from './notification-jobs';
import { processNotificationOutbox } from './outbox';
import { requestWaitlistVerification, consumeCommunicationToken } from './waitlist';
import { saveSiteCopy } from './site-copy';
import { contentDefaults, publicSiteCopy } from '../site-content';

import { bookedMerchandise, businessDay,reportPeriod,dailyOrderSeries } from './reporting';
import {browseCatalog,catalogFilters,relatedCatalogItems,publicReviews} from './catalog';

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
  const journal = JSON.parse(readFileSync(new URL('../../../../packages/database/drizzle/meta/_journal.json', import.meta.url), 'utf8'));
  for (const filename of journal.entries.map((entry: { tag: string }) => `${entry.tag}.sql`)) {
    await pg.exec(readFileSync(new URL(`../../../../packages/database/drizzle/${filename}`, import.meta.url), 'utf8'));
  }
  database = drizzle(pg, { schema: { ...tables, ...relations } }) as unknown as CommerceDatabase;
});
beforeEach(async () => {
  await pg.exec('TRUNCATE "Order", "Customer", "Product", "BuilderComponent", "DeliveryZone", "PromoCode", "GiftCard", "SiteSettings", "AdminNotification", "NotificationOutbox", "User", "Material", "Supplier", "Expense", "StockMovement", "DraftOrder", "AuditLog", "InventoryOperation", "InventoryMovement", "ProductBuilderComponent", "ProductMaterial", "DeliveryCompany", "DeliveryHandoff", "FinanceEntry", "OrderReturn", "ContactMessage", "ContentBlock", "WaitlistEntry", "CommunicationToken", "Category" CASCADE');
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
  return Object.fromEntries(['source', 'city', 'deliveryZoneId', 'manualDiscount', 'manualDiscountReason', 'promoCode', 'isHandDelivered', 'fulfillmentMethod', 'trackInventory', 'items'].filter(name => data[name] !== undefined).map(name => [name, data[name]]));
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

test('retrying a lost draft save reuses its revision despite JSONB key order and omitted optional fields', async () => {
  const input = newDraft({ ...staffData(), items: [{ productId: 'BOUQUET', quantity: 1,
    customName: undefined, customPrice: undefined, configuration: { components: { wrap: 1, flower: 2 } } }] });
  const saved = await saveOrderDraft(input, 'test-admin', database);
  const retry = await saveOrderDraft({ ...input, data: { ...input.data,
    items: [{ productId: 'BOUQUET', quantity: 1, configuration: { components: { flower: 2, wrap: 1 } } }] } }, 'test-admin', database);
  assert.deepEqual(retry, { ...saved, data: JSON.parse(JSON.stringify(saved.data)) });
  assert.equal((await database.query.auditLog.findMany()).length, 1);
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

test('admin can save and convert a new assisted order while the storefront is in maintenance mode', async () => {
  await pg.exec(`UPDATE "SiteSettings" SET mode = 'MAINTENANCE'`);
  await assert.rejects(quoteCheckout(payload(), database), /not accepting orders/);
  const input = newDraft();
  const quote = await quoteStaffOrder(inputForQuote(input.data), database);
  const saved = await saveOrderDraft(input, 'test-admin', database);
  const result = await convertOrderDraft({ ...input, expectedRevision: saved.revision, expectedTotal: quote.total, quoteVersion: quote.quoteVersion }, 'test-admin', database);
  assert.equal(result.total, 120);
  assert.equal((await database.query.order.findFirst())?.source, 'PHONE');
  assert.equal((await database.query.product.findFirst())?.stock, 0);
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


async function productionFixture() {
  await database.insert(tables.material).values({ id: 'raw-paper', name: 'Raw paper', quantity: 20, cost: 2, updatedAt: new Date() });
  await database.update(tables.builderComponent).set({ stock: 0, materials: [{ materialId: 'raw-paper', quantity: 4 }] }).where(eq(tables.builderComponent.id, 'flower'));
}

test('component production consumes raw ingredients once and records its complete movement group', async () => {
  await productionFixture();
  const input = { kind: 'COMPONENT' as const, id: 'flower', quantity: 2 };
  const quote = await quoteProduction(input, database);
  assert.equal(quote.inputs[0].required, 8); assert.equal(quote.canProduce, true);
  const request = { ...input, recipeVersion: quote.recipeVersion, reason: 'Morning flower batch', operationId: randomUUID() };
  const first = await recordProduction(request, 'test-admin', database);
  const retry = await recordProduction(request, 'test-admin', database);
  assert.equal(first.operationId, retry.operationId);
  assert.equal((await database.query.material.findFirst())?.quantity, 12);
  assert.equal((await database.query.builderComponent.findFirst({ where: eq(tables.builderComponent.id, 'flower') }))?.stock, 2);
  assert.equal((await database.query.inventoryMovement.findMany()).length, 2);
  assert.equal((await database.query.expense.findMany()).length, 0);
});

test('assembling products consumes finished components without consuming their raw recipes again', async () => {
  await productionFixture();
  await database.insert(tables.productBuilderComponent).values({ id: 'recipe-component', productId: 'product', builderComponentId: 'flower', quantity: 2 });
  await database.insert(tables.productMaterial).values({ id: 'recipe-raw', productId: 'product', materialId: 'raw-paper', quantity: 1 });
  const component = { kind: 'COMPONENT' as const, id: 'flower', quantity: 2 };
  const componentQuote = await quoteProduction(component, database);
  await recordProduction({ ...component, recipeVersion: componentQuote.recipeVersion, reason: 'Make two flowers', operationId: randomUUID() }, 'test-admin', database);
  const product = { kind: 'PRODUCT' as const, id: 'product', quantity: 1 };
  const productQuote = await quoteProduction(product, database);
  await recordProduction({ ...product, recipeVersion: productQuote.recipeVersion, reason: 'Assemble bouquet', operationId: randomUUID() }, 'test-admin', database);
  assert.equal((await database.query.material.findFirst())?.quantity, 11);
  assert.equal((await database.query.product.findFirst())?.stock, 2);
  assert.equal((await database.query.builderComponent.findFirst({ where: eq(tables.builderComponent.id, 'flower') }))?.stock, 0);
});

test('competing production batches cannot overdraw the final raw materials', async () => {
  await productionFixture();
  const input = { kind: 'COMPONENT', id: 'flower', quantity: 3 };
  const quote = await quoteProduction(input, database);
  const results = await Promise.allSettled([1, 2].map(() => recordProduction({ ...input, recipeVersion: quote.recipeVersion, reason: 'Competing batch', operationId: randomUUID() }, 'test-admin', database)));
  assert.equal(results.filter(value => value.status === 'fulfilled').length, 1);
  assert.equal((await database.query.material.findFirst())?.quantity, 8);
  assert.equal((await database.query.inventoryOperation.findMany()).length, 1);
});

test('a changed or missing recipe cannot be committed using an older production preview', async () => {
  await productionFixture(); const input = { kind: 'COMPONENT', id: 'flower', quantity: 1 }; const quote = await quoteProduction(input, database);
  await database.update(tables.builderComponent).set({ materials: [{ materialId: 'raw-paper', quantity: 5 }] }).where(eq(tables.builderComponent.id, 'flower'));
  await assert.rejects(recordProduction({ ...input, recipeVersion: quote.recipeVersion, reason: 'Old recipe', operationId: randomUUID() }, 'test-admin', database), /recipe changed/);
  await assert.rejects(quoteProduction({ kind: 'PRODUCT', id: 'product', quantity: 1 }, database), /Add a recipe/);
  assert.equal((await database.query.material.findFirst())?.quantity, 20);
});

test('count corrections require a reason, reject stale counts, and replay without another movement', async () => {
  const input = { kind: 'PRODUCT', id: 'product', expectedQuantity: 1, quantity: 3, reason: 'Physical warehouse recount', operationId: randomUUID() };
  await assert.rejects(correctStock({ ...input, reason: '' }, 'test-admin', database), /reason/);
  await assert.rejects(correctStock({ ...input, expectedQuantity: 9 }, 'test-admin', database), /Stock changed/);
  await correctStock(input, 'test-admin', database); await correctStock(input, 'test-admin', database);
  await assert.rejects(correctStock({ ...input, quantity: 4 }, 'test-admin', database), /different details/);
  assert.equal((await database.query.product.findFirst())?.stock, 3);
  assert.equal((await database.query.inventoryMovement.findMany()).length, 1);
});

test('a repeated purchase records one expense and one stock increase at its reviewed unit cost', async () => {
  await productionFixture(); const operationId = randomUUID();
  await purchaseMaterial('raw-paper', 3, 'test-admin', database, operationId, 1.25, 'Invoice supplier 12');
  await purchaseMaterial('raw-paper', 3, 'test-admin', database, operationId, 1.25, 'Invoice supplier 12');
  assert.equal((await database.query.material.findFirst())?.quantity, 23);
  assert.equal((await database.query.expense.findMany()).length, 1);
  assert.equal((await database.query.expense.findFirst())?.amount, 3.75);
  assert.equal((await database.query.inventoryMovement.findMany()).length, 1);
});

test('failed movement recording rolls back finished output and every consumed ingredient', async () => {
  await productionFixture(); const input = { kind: 'COMPONENT', id: 'flower', quantity: 1 }; const quote = await quoteProduction(input, database);
  await pg.exec(`CREATE FUNCTION reject_movement() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'test ledger failure'; END $$ LANGUAGE plpgsql;
    CREATE TRIGGER reject_movement BEFORE INSERT ON "InventoryMovement" FOR EACH ROW EXECUTE FUNCTION reject_movement();`);
  try {
    await assert.rejects(recordProduction({ ...input, recipeVersion: quote.recipeVersion, reason: 'Fail this batch', operationId: randomUUID() }, 'test-admin', database));
    assert.equal((await database.query.material.findFirst())?.quantity, 20);
    assert.equal((await database.query.inventoryOperation.findMany()).length, 0);
    assert.equal((await database.query.stockMovement.findMany()).length, 0);
    assert.equal((await database.query.builderComponent.findFirst({ where: eq(tables.builderComponent.id, 'flower') }))?.stock, 0);
  } finally { await pg.exec('DROP TRIGGER reject_movement ON "InventoryMovement"; DROP FUNCTION reject_movement()'); }
});

test('order reservations and cancellation releases appear once in the stock ledger', async () => {
  const created = await createCheckout(payload(), key('ledger-order'), null, database);
  await transitionOrder(created.id, 'CANCELLED', 'test-admin', database);
  await transitionOrder(created.id, 'CANCELLED', 'test-admin', database);
  const movements = await database.query.inventoryMovement.findMany();
  assert.equal(movements.length, 2);
  assert.equal(movements.reduce((sum, value) => sum + value.quantity, 0), 0);
  assert.equal((await database.query.product.findFirst())?.stock, 1);
});


async function readyDeliveryOrder() {
  const created = await createCheckout(payload(), key('delivery-test'), null, database);
  await transitionOrder(created.id, 'CONFIRMED', 'test-admin', database);
  await transitionOrder(created.id, 'READY', 'test-admin', database);
  await database.insert(tables.deliveryCompany).values({ id: 'carrier', name: 'Infinidis', isActive: true });
  return created;
}

test('carrier registration queues once and uses the full amount to collect', async () => {
  const created = await readyDeliveryOrder();
  const first = await queueCarrierRegistration({ orderId: created.id, companyId: 'carrier' }, 'test-admin', database);
  const retry = await queueCarrierRegistration({ orderId: created.id, companyId: 'carrier' }, 'test-admin', database);
  assert.equal(first.id, retry.id);
  let submitted = 0;
  await processCarrierRegistrations(5, created.id, database, async shipment => { submitted++; assert.equal(shipment.price, 120); return { outcome: 'ACKNOWLEDGED' }; });
  await processCarrierRegistrations(5, created.id, database, async () => { submitted++; return { outcome: 'ACKNOWLEDGED' }; });
  assert.equal(submitted, 1);
  const current = await database.query.order.findFirst();
  assert.equal(current?.sentToInfinidis, true); assert.equal(current?.status, 'READY');
});

test('uncertain carrier results do not retry automatically or allow unsafe fulfillment changes', async () => {
  const created = await readyDeliveryOrder();
  const queued = await queueCarrierRegistration({ orderId: created.id, companyId: 'carrier' }, 'test-admin', database);
  let submitted = 0;
  const adapter = async () => { submitted++; return { outcome: 'UNCERTAIN' as const, error: 'Test lost acknowledgment' }; };
  await processCarrierRegistrations(5, created.id, database, adapter);
  await processCarrierRegistrations(5, created.id, database, adapter);
  await assert.rejects(transitionOrder(created.id, 'CANCELLED', 'test-admin', database), /registration is pending or uncertain/);
  assert.equal((await database.query.product.findFirst())?.stock, 0); assert.equal(submitted, 1);
  assert.equal((await queueCarrierRegistration({ orderId: created.id, companyId: 'carrier' }, 'test-admin', database)).id, queued.id);
  await resolveCarrierRegistration({ jobId: queued.id, registered: false, note: 'Verified absent in carrier dashboard' }, 'test-admin', database);
  const newAttempt = await queueCarrierRegistration({ orderId: created.id, companyId: 'carrier' }, 'test-admin', database);
  assert.notEqual(newAttempt.id, queued.id);
});

test('cancelling before registration starts stops the queued shipment and releases stock', async () => {
  const created = await readyDeliveryOrder();
  const job = await queueCarrierRegistration({ orderId: created.id, companyId: 'carrier' }, 'test-admin', database);
  await transitionOrder(created.id, 'CANCELLED', 'test-admin', database);
  let sent = false;
  await processCarrierRegistrations(5, created.id, database, async () => { sent = true; return { outcome: 'ACKNOWLEDGED' }; });
  assert.equal(sent, false); assert.equal((await database.query.product.findFirst())?.stock, 1);
  assert.equal((await database.query.notificationOutbox.findFirst({ where: eq(tables.notificationOutbox.id, job.id) }))?.status, 'CANCELLED');
});

test('handoff requires a carrier reference, preserves its snapshot, and rejects a second different handoff', async () => {
  const created = await readyDeliveryOrder();
  await assert.rejects(transitionOrder(created.id, 'SHIPPED', 'test-admin', database), /handoff reference/);
  const input = { orderId: created.id, companyId: 'carrier', reference: 'VERIFIED-123' };
  await recordDeliveryHandoff(input, 'test-admin', database);
  await recordDeliveryHandoff(input, 'test-admin', database);
  await assert.rejects(recordDeliveryHandoff({ ...input, reference: 'DIFFERENT' }, 'test-admin', database), /different handoff/);
  assert.equal((await database.query.deliveryHandoff.findMany()).length, 1);
  assert.equal((await database.query.order.findFirst())?.status, 'SHIPPED');
  assert.equal(((await database.query.order.findFirst())?.deliveryAddress as { carrierHandoff: { companyName: string } }).carrierHandoff.companyName, 'Infinidis');
});


async function deliveredOrderForFinance() {
  const created = await readyDeliveryOrder();
  await transitionOrder(created.id, 'DELIVERED', 'test-admin', database);
  return created;
}
test('courier collection is not owner cash until a remittance is recorded and reconciled', async () => {
  const created = await deliveredOrderForFinance();
  await recordFinanceEntry({ operationId: randomUUID(), orderId: created.id, type: 'COLLECTION', channel: 'CARRIER', reason: 'Courier collected full COD' }, 'test-admin', database);
  let value = await orderFinanceOverview(created.id, database);
  assert.equal(value.carrierOutstanding,12000); assert.equal(value.ownerCashIn,0);
  const remittance = { operationId: randomUUID(), orderId: created.id, type: 'REMITTANCE', channel: 'CARRIER', amountCents:10000,feeCents:2000,reference:'SETTLEMENT-12',reason:'Verified settlement' };
  await recordFinanceEntry(remittance,'test-admin',database); await recordFinanceEntry(remittance,'test-admin',database);
  value = await orderFinanceOverview(created.id,database); assert.equal(value.carrierOutstanding,0); assert.equal(value.ownerCashIn,10000); assert.equal(value.fees,2000);
  await assert.rejects(recordFinanceEntry({...remittance,operationId:randomUUID()},'test-admin',database),/must not exceed/);
});
test('partial refunds cannot exceed collected cash and never restore stock implicitly', async () => {
  const created=await deliveredOrderForFinance(); await recordCashCollection(created.id,'test-admin',database);
  const refund={operationId:randomUUID(),orderId:created.id,type:'CASH_REFUND',channel:'DIRECT',amountCents:2500,reason:'Verified partial cash refund'};
  await recordFinanceEntry(refund,'test-admin',database);await recordFinanceEntry(refund,'test-admin',database);
  assert.equal((await database.query.order.findFirst())?.paymentStatus,'PARTIALLY_REFUNDED');assert.equal((await database.query.product.findFirst())?.stock,0);
  await assert.rejects(recordFinanceEntry({...refund,operationId:randomUUID(),amountCents:10000},'test-admin',database),/exceeds/);
});
test('inspected returns restock reusable units once and damaged units never enter sellable stock',async()=>{
  const created=await deliveredOrderForFinance();const request={operationId:randomUUID(),orderId:created.id,reason:'Parcel returned and inspected',items:[{kind:'PRODUCT',id:'product',quantity:1,disposition:'RESTOCK'}]};
  await recordInspectedReturn(request,'test-admin',database);await recordInspectedReturn(request,'test-admin',database);
  assert.equal((await database.query.product.findFirst())?.stock,1);
  await assert.rejects(recordInspectedReturn({...request,operationId:randomUUID()},'test-admin',database),/exceed/);
  assert.equal((await database.query.orderReturn.findMany()).length,1);
});

// Additional administration regressions run against the isolated migrated database.
test('customer contact edits preserve legacy order contacts and reject duplicates or stale saves',async()=>{
  const created=await createCheckout(payload(),key('profile'),null,database);
  const buyer=(await database.query.customer.findFirst())!;
  const current=(await database.query.order.findFirst())!;
  const address={...current.deliveryAddress as Record<string,unknown>}; delete address.customerSnapshot;
  await database.update(tables.order).set({deliveryAddress:address}).where(eq(tables.order.id,created.id));
  const input={id:buyer.id,expectedUpdatedAt:buyer.updatedAt.toISOString(),firstName:'Changed buyer',lastName:'',phone:'0698765432',email:'changed@example.com',socialHandle:'@example',internalNote:'Staff-only note',riskFlag:true};
  await updateCustomerProfile(input,'test-admin',database);
  const saved=(await database.query.order.findFirst())!.deliveryAddress as {customerSnapshot:{email:string};ownerClerkId?:string};
  assert.equal(saved.customerSnapshot.email,'buyer@example.com');assert.equal(saved.ownerClerkId,null);
  await assert.rejects(updateCustomerProfile(input,'test-admin',database),/changed/);
  await database.insert(tables.customer).values({id:'other',firstName:'Other',lastName:'',phone:'+212611111111',email:'other@example.com',updatedAt:new Date()});
  const updated=(await database.query.customer.findFirst({where:eq(tables.customer.id,buyer.id)}))!;
  await assert.rejects(updateCustomerProfile({...input,expectedUpdatedAt:updated.updatedAt.toISOString(),email:'OTHER@example.com'},'test-admin',database),/another customer/);
});

test('website drafts stay private until publication and concurrent editors cannot overwrite one another',async()=>{
  const input={key:'shipping',copy:{...contentDefaults.shipping,title:'Reviewed shipping'},expectedRevision:0,publish:false};
  await saveSiteCopy(input,'test-admin',database);
  assert.equal((await publicSiteCopy('shipping',database)).title,contentDefaults.shipping.title);
  await assert.rejects(saveSiteCopy({...input,publish:true},'test-admin',database),/changed/);
  await saveSiteCopy({...input,expectedRevision:1,publish:true},'test-admin',database);
  assert.equal((await publicSiteCopy('shipping',database)).title,'Reviewed shipping');
  await assert.rejects(saveSiteCopy({...input,expectedRevision:2,copy:{...input.copy,ctaHref:'//evil.example'}},'test-admin',database),/local site path/);
  assert.equal((await database.query.contentBlock.findMany()).length,1);
});

test('support status changes retain content, audit the actor, and reject stale moderation',async()=>{
  await database.insert(tables.contactMessage).values({id:'message',firstName:'Test',lastName:'Sender',email:'sender@example.com',subject:'Help',message:'Full original message',updatedAt:new Date()});
  await changeSupportStatus('MESSAGE',{id:'message',expectedStatus:'UNREAD',status:'RESOLVED'},'test-admin',database);
  await assert.rejects(changeSupportStatus('MESSAGE',{id:'message',expectedStatus:'UNREAD',status:'READ'},'test-admin',database),/changed/);
  await changeSupportStatus('MESSAGE',{id:'message',expectedStatus:'RESOLVED',status:'READ'},'test-admin',database);
  assert.equal((await database.query.contactMessage.findFirst())?.message,'Full original message');
  assert.equal((await database.query.auditLog.findFirst())?.actorId,'test-admin');
  await database.insert(tables.review).values({id:'review',productId:'product',authorName:'Author',rating:4,content:'Keep original review',updatedAt:new Date()});
  await changeSupportStatus('REVIEW',{id:'review',expectedStatus:'PENDING',status:'REJECTED'},'test-admin',database);
  await changeSupportStatus('REVIEW',{id:'review',expectedStatus:'REJECTED',status:'APPROVED'},'test-admin',database);
  assert.equal((await database.query.review.findFirst())?.content,'Keep original review');
});

test('an interrupted multi-recipient notification retry skips recipients already acknowledged',async()=>{
  const created=await createCheckout(payload(),key('notification-retry'),null,database);
  const job=(await database.query.notificationOutbox.findFirst())!; const sent:string[]=[];
  await processNotificationOutbox(1,undefined,job.id,database,async message=>{if(message.to==='buyer@example.com')throw new Error('Fake second recipient failure');sent.push(message.to);});
  assert.equal(sent.length,1);assert.equal((await database.query.notificationOutbox.findFirst())?.status,'FAILED');
  await retryNotificationJob({id:job.id,reason:'Fixed test delivery adapter'},'test-admin',database);
  await processNotificationOutbox(1,undefined,job.id,database,async message=>{sent.push(message.to);});
  assert.equal(sent.length,2);assert.equal(sent[1],'buyer@example.com');assert.equal((await database.query.order.findMany()).length,1);
  assert.equal((await database.query.notificationOutbox.findFirst())?.status,'SENT');
  await assert.rejects(retryNotificationJob({id:job.id,reason:'Retry again'},'test-admin',database),/Only failed/);
  await database.update(tables.notificationOutbox).set({type:'COURIER_DISPATCH',status:'FAILED'}).where(eq(tables.notificationOutbox.id,job.id));
  await assert.rejects(retryNotificationJob({id:job.id,reason:'Try unsafe resend'},'test-admin',database),/reconciled/);
  assert.equal((await database.query.order.findFirst())?.id,created.id);
});

test('damaged inspected returns consume the return allowance without increasing sellable stock',async()=>{
  const created=await deliveredOrderForFinance();
  await recordInspectedReturn({operationId:randomUUID(),orderId:created.id,reason:'Damaged item inspected',items:[{kind:'PRODUCT',id:'product',quantity:1,disposition:'DAMAGED'}]},'test-admin',database);
  assert.equal((await database.query.product.findFirst())?.stock,0);
  assert.equal((await orderFinanceOverview(created.id,database)).returnTargets.length,0);
  assert.equal((await database.query.financeEntry.findMany()).length,0);
});

test('waitlist confirmation requires its secret, unsubscribe invalidates pending verification, and replays are harmless',async()=>{
  const requested=await requestWaitlistVerification('Subscriber@Example.com',database);
  assert.ok(requested.jobId); const job=(await database.query.notificationOutbox.findFirst())!;
  const tokens=job.payload as {verifyToken:string;unsubscribeToken:string};
  assert.equal((await database.query.waitlistEntry.findFirst())?.isVerified,false);
  await assert.rejects(consumeCommunicationToken('x'.repeat(43),'VERIFY',database),/invalid/);
  await consumeCommunicationToken(tokens.verifyToken,'VERIFY',database);
  await consumeCommunicationToken(tokens.verifyToken,'VERIFY',database);
  assert.equal((await database.query.waitlistEntry.findFirst())?.isVerified,true);
  await consumeCommunicationToken(tokens.unsubscribeToken,'UNSUBSCRIBE',database);
  assert.equal((await database.query.waitlistEntry.findFirst())?.unsubscribed,true);
  await assert.rejects(consumeCommunicationToken(tokens.verifyToken,'VERIFY',database),/no longer active/);
  assert.equal((await database.query.waitlistEntry.findFirst())?.unsubscribed,true);
  const stored=await database.query.communicationToken.findMany();assert.ok(stored.every(row=>row.tokenHash!==tokens.verifyToken));
});

test('gift refunds restore only the original redeemed balance and replay without crediting twice',async()=>{
  await database.insert(tables.giftCard).values({id:'gift',code:'RETURN-GIFT',initialBalance:50,currentBalance:50,updatedAt:new Date()});
  const created=await createCheckout({...payload(),giftCardCode:'RETURN-GIFT',expectedTotal:70},key('gift-refund'),null,database);
  await transitionOrder(created.id,'CONFIRMED','test-admin',database);await transitionOrder(created.id,'READY','test-admin',database);await transitionOrder(created.id,'DELIVERED','test-admin',database);
  const input={operationId:randomUUID(),orderId:created.id,type:'GIFT_REFUND',channel:'GIFT',amountCents:3000,reason:'Restore agreed gift tender'};
  await recordFinanceEntry(input,'test-admin',database);await recordFinanceEntry(input,'test-admin',database);
  assert.equal((await database.query.giftCard.findFirst())?.currentBalance,30);
  await assert.rejects(recordFinanceEntry({...input,operationId:randomUUID(),amountCents:3000},'test-admin',database),/remaining redeemed/);
  assert.equal((await orderFinanceOverview(created.id,database)).collected,0);
});

test('a failed gift refund ledger write rolls back the restored card balance',async()=>{
  await database.insert(tables.giftCard).values({id:'gift',code:'ROLLBACK-GIFT',initialBalance:50,currentBalance:50,updatedAt:new Date()});
  const created=await createCheckout({...payload(),giftCardCode:'ROLLBACK-GIFT',expectedTotal:70},key('gift-refund-rollback'),null,database);
  await pg.exec(`CREATE FUNCTION reject_finance() RETURNS trigger AS $$ BEGIN RAISE EXCEPTION 'test finance failure'; END $$ LANGUAGE plpgsql; CREATE TRIGGER reject_finance BEFORE INSERT ON "FinanceEntry" FOR EACH ROW EXECUTE FUNCTION reject_finance();`);
  try{
    await assert.rejects(recordFinanceEntry({operationId:randomUUID(),orderId:created.id,type:'GIFT_REFUND',channel:'GIFT',amountCents:5000,reason:'Test refund rollback'},'test-admin',database));
    assert.equal((await database.query.giftCard.findFirst())?.currentBalance,0);assert.equal((await database.query.financeEntry.findMany()).length,0);
  }finally{await pg.exec('DROP TRIGGER reject_finance ON "FinanceEntry"; DROP FUNCTION reject_finance()');}
});


test('reports measure gift tender as payment and group business days in Casablanca time',()=>{
  assert.equal(bookedMerchandise({subtotal:100,discount:70,deliveryAddress:{redemptions:{giftAmount:50}}}),80);
  assert.equal(businessDay(new Date('2026-10-20T23:30:00Z')),'2026-10-21');
});

test('production does not silently repair a historical negative output balance',async()=>{
  await productionFixture();
  // Simulate a legacy row retained when the NOT VALID migration is installed.
  await pg.exec('ALTER TABLE "BuilderComponent" DROP CONSTRAINT "BuilderComponent_stock_nonnegative"');
  await database.update(tables.builderComponent).set({stock:-1}).where(eq(tables.builderComponent.id,'flower'));
  await pg.exec('ALTER TABLE "BuilderComponent" ADD CONSTRAINT "BuilderComponent_stock_nonnegative" CHECK (stock >= 0) NOT VALID');
  const input={kind:'COMPONENT',id:'flower',quantity:2};const quote=await quoteProduction(input,database);
  assert.equal(quote.canProduce,false);
  await assert.rejects(recordProduction({...input,operationId:randomUUID(),recipeVersion:quote.recipeVersion,reason:'Attempt without recount'},'test-admin',database),/stock/);
  assert.equal((await database.query.material.findFirst())?.quantity,20);
});

test('catalog filters use current sale prices, category membership, availability, and bounded result pages',async()=>{
  await database.insert(tables.category).values({id:'category',name:'Gifts'});
  await database.insert(tables.categoryToProduct).values({a:'category',b:'product'});
  await database.update(tables.product).set({basePrice:100,salePrice:60,isSaleEnabled:true}).where(eq(tables.product.id,'product'));
  const result=await browseCatalog(catalogFilters({category:'category',min:'50',max:'70',availability:'AVAILABLE'}),database);
  assert.equal(result.count,1);assert.equal(result.items[0].id,'product');assert.equal(result.categories[0].name,'Gifts');
  await database.update(tables.product).set({isSaleEnabled:false}).where(eq(tables.product.id,'product'));
  assert.equal((await browseCatalog(catalogFilters({max:'70'}),database)).count,0);
  await database.insert(tables.product).values(Array.from({length:15},(_,index)=>({id:`extra-${index}`,name:`Extra ${index}`,basePrice:100,stock:1,updatedAt:new Date()})));
  const page=await browseCatalog(catalogFilters({page:'1'}),database);assert.equal(page.count,16);assert.equal(page.items.length,12);
  assert.equal((await relatedCatalogItems('product',[],database)).length,4);
  await createCheckout(payload(),key('catalog-popularity'),null,database);
  assert.equal((await browseCatalog(catalogFilters({sort:'BEST_SELLERS'}),database)).items[0].id,'product');
  assert.throws(()=>catalogFilters({min:'100',max:'50'}),/minimum/);
  assert.throws(()=>catalogFilters({max:'-1'}),/filters/);
});

test('public product reviews omit customer identifiers and reject invalid legacy ratings',async()=>{
  await database.insert(tables.review).values([{id:'valid-review',productId:'product',authorName:'Buyer',rating:5,status:'APPROVED',content:'Approved',updatedAt:new Date()},{id:'invalid-review',productId:'product',authorName:'Old',rating:-10,status:'APPROVED',content:'Invalid legacy rating',updatedAt:new Date()},{id:'pending-review',productId:'product',authorName:'Pending',rating:4,status:'PENDING',content:'Pending',updatedAt:new Date()}]);
  const result=await publicReviews('product',1,database);assert.equal(result.count,1);assert.equal(result.rating,5);assert.equal('customerId' in result.items[0],false);
});


test('settings updates merge under a lock and keep unrelated configuration',async()=>{
 await Promise.all([changeSiteSettings('test-admin','Update first setting',config=>({config:{...config,heroFadeSpeed:8}}),database),changeSiteSettings('test-admin','Update second setting',config=>({config:{...config,customBouquetBaseFee:25}}),database)]);
 const config=(await database.query.siteSettings.findFirst())!.config as Record<string,unknown>;assert.equal(config.heroFadeSpeed,8);assert.equal(config.customBouquetBaseFee,25);
});

test('database constraints reject negative stock, invalid recipe quantities, and missing component references',async()=>{
 await assert.rejects(database.update(tables.product).set({stock:-1}).where(eq(tables.product.id,'product')));
 await assert.rejects(database.insert(tables.productBuilderComponent).values({id:'bad-recipe',productId:'product',builderComponentId:'flower',quantity:0}));
 await assert.rejects(database.insert(tables.productBuilderComponent).values({id:'missing-recipe',productId:'product',builderComponentId:'missing',quantity:1}));
 assert.equal((await database.query.product.findFirst())?.stock,1);
});

test('cancellation and count corrections do not re-enable a product deliberately disabled by staff',async()=>{
 const created=await createCheckout(payload(),key('disabled-return'),null,database);
 await database.update(tables.product).set({isAvailable:false}).where(eq(tables.product.id,'product'));
 await transitionOrder(created.id,'CANCELLED','test-admin',database);
 assert.equal((await database.query.product.findFirst())?.stock,1);assert.equal((await database.query.product.findFirst())?.isAvailable,false);
 await correctStock({kind:'PRODUCT',id:'product',operationId:randomUUID(),expectedQuantity:1,quantity:2,reason:'Physical stock count'},'test-admin',database);
 assert.equal((await database.query.product.findFirst())?.isAvailable,false);
});
test('production can replenish an inactive component without publishing it automatically',async()=>{
 await productionFixture();await database.update(tables.builderComponent).set({isAvailable:false}).where(eq(tables.builderComponent.id,'flower'));
 const input={kind:'COMPONENT',id:'flower',quantity:1};const quote=await quoteProduction(input,database);
 await recordProduction({...input,recipeVersion:quote.recipeVersion,operationId:randomUUID(),reason:'Prepare inactive item for review'},'test-admin',database);
 const component=await database.query.builderComponent.findFirst({where:eq(tables.builderComponent.id,'flower')});assert.equal(component?.stock,1);assert.equal(component?.isAvailable,false);
});


test('items paid by card leave only the delivery fee for the carrier', async () => {
  const data = staffData();
  const quote = await quoteStaffOrder(inputForQuote(data), database);
  const created = await createStaffOrder({ ...data, expectedTotal: quote.total, quoteVersion: quote.quoteVersion, idempotencyKey: key('card-items'), receivedPayment: {method:'CARD', allocation:'ITEMS',amountCents:10000,reference:'receipt-card-01'} }, database, 'test-admin');
  const row = (await database.query.order.findFirst())!;
  const rows = (await paymentRowsForOrders([row],database)).get(row.id);
  const state = paymentState(row,rows);
  assert.equal(state.itemsRemaining,0); assert.equal(state.deliveryRemaining,2000); assert.equal(state.remaining,2000);
  assert.equal(row.paymentStatus,'PARTIALLY_PAID'); assert.equal(rows?.length,1);
  await database.insert(tables.deliveryCompany).values({id:'card-carrier',name:'Infinidis'});
  await transitionOrder(created.id,'READY','test-admin',database);
  await queueCarrierRegistration({orderId:created.id,companyId:'card-carrier'},'test-admin',database);
  const job = (await database.query.notificationOutbox.findMany()).find(row=>row.type==='COURIER_DISPATCH')!;
  assert.equal((job.payload as {shipment:{price:number}}).shipment.price,20);
});

test('full card prepayment is paid before fulfillment and cannot be counted twice', async () => {
  const data=staffData(); const quote=await quoteStaffOrder(inputForQuote(data),database);
  await createStaffOrder({...data,expectedTotal:quote.total,quoteVersion:quote.quoteVersion,idempotencyKey:key('full-card'),receivedPayment:{method:'CARD',allocation:'ORDER',amountCents:12000,reference:'card-full'}},database,'test-admin');
  const row=(await database.query.order.findFirst())!;
  assert.equal(row.status,'CONFIRMED'); assert.equal(row.paymentStatus,'PAID');
  const state=paymentState(row,(await paymentRowsForOrders([row],database)).get(row.id));
  assert.equal(state.collected,12000); assert.equal(state.remaining,0);
  const summary=await import('./finance').then(module=>module.financeSummary(database));
  assert.equal(summary.collected,12000); assert.equal(summary.ownerCashIn,12000);
});

test('pickup is independent of sales channel and does not require a city or delivery fee', async () => {
  const data={...staffData(),source:'INSTAGRAM',fulfillmentMethod:'PICKUP',city:'',deliveryZoneId:'',address:''};
  const quote=await quoteStaffOrder({...inputForQuote(data),fulfillmentMethod:'PICKUP'},database);
  assert.equal(quote.total,100); assert.equal(quote.deliveryFee,0);
  const draft=newDraft(data as ReturnType<typeof staffData>); const saved=await saveOrderDraft(draft,'test-admin',database);
  const result=await convertOrderDraft({...draft,expectedRevision:saved.revision,expectedTotal:quote.total,quoteVersion:quote.quoteVersion},'test-admin',database);
  const row=(await database.query.order.findFirst())!; assert.equal((row.deliveryAddress as {fulfillmentMethod:string}).fulfillmentMethod,'PICKUP');
  await transitionOrder(result.id,'READY','test-admin',database);
  await assert.rejects(queueCarrierRegistration({orderId:result.id,companyId:'anything'},'test-admin',database),/pickup/i);
  await transitionOrder(result.id,'DELIVERED','test-admin',database);
  assert.equal((await database.query.order.findFirst())?.status,'DELIVERED');
});

test('untracked assisted orders do not require stock counts and cancellation never manufactures stock', async () => {
  await pg.exec('UPDATE "Product" SET stock=0');
  const data={...staffData(),trackInventory:false}; const quote=await quoteStaffOrder({...inputForQuote(data),trackInventory:false},database);
  const result=await createStaffOrder({...data,expectedTotal:quote.total,quoteVersion:quote.quoteVersion,idempotencyKey:key('simple-mode')},database,'test-admin');
  assert.equal((await database.query.product.findFirst())?.stock,0);
  assert.equal((await database.query.inventoryMovement.findMany()).length,0);
  await transitionOrder(result.id,'CANCELLED','test-admin',database); assert.equal((await database.query.product.findFirst())?.stock,0);
  await transitionOrder(result.id,'CONFIRMED','test-admin',database); assert.equal((await database.query.product.findFirst())?.stock,0);
  await assert.rejects(createCheckout(payload(),key('website-still-tracked'),null,database),/stock/);
});

test('a negotiated catalog price preserves the product link and stock reservation',async()=>{
  const data={...staffData(),items:[{productId:'product',quantity:1,unitPriceOverride:80,priceOverrideReason:'Agreed customer price'}]};
  const quote=await quoteStaffOrder(inputForQuote(data),database); assert.equal(quote.total,100);
  await createStaffOrder({...data,expectedTotal:quote.total,quoteVersion:quote.quoteVersion,idempotencyKey:key('custom-price')},database,'test-admin');
  const item=(await database.query.orderItem.findFirst())!; assert.equal(item.productId,'product'); assert.equal(item.unitPrice,80);
  assert.equal((await database.query.product.findFirst())?.stock,0);
  await assert.rejects(quoteStaffOrder(inputForQuote({...data,items:[{...data.items[0],priceOverrideReason:''}]}),database),/reason/);
  await assert.rejects(createCheckout({...payload(),cartItems:[{...payload().cartItems[0],unitPriceOverride:1}]},key('forged-price'),null,database));
});

test('partial received payments replay safely and reject overpayment and concurrent stale forms',async()=>{
  const data=staffData();const quote=await quoteStaffOrder(inputForQuote(data),database);
  const created=await createStaffOrder({...data,expectedTotal:quote.total,quoteVersion:quote.quoteVersion,idempotencyKey:key('partial-pay')},database,'test-admin');
  const input={operationId:randomUUID(),orderId:created.id,payment:{method:'CARD',allocation:'ITEMS',amountCents:4000,reference:'receipt-partial'},reason:'Verified card receipt',expectedRemainingCents:12000};
  await recordReceivedPayment(input,'test-admin',database); assert.equal((await recordReceivedPayment(input,'test-admin',database)).replayed,true);
  await assert.rejects(recordReceivedPayment({...input,operationId:randomUUID(),payment:{...input.payment,amountCents:9000},expectedRemainingCents:8000},'test-admin',database),/exceeds/);
  const results=await Promise.allSettled([1,2].map(()=>recordReceivedPayment({...input,operationId:randomUUID(),expectedRemainingCents:8000},'test-admin',database)));
  assert.equal(results.filter(row=>row.status==='fulfilled').length,1);
  const row=(await database.query.order.findFirst())!;assert.equal(paymentState(row,(await paymentRowsForOrders([row],database)).get(row.id)).remaining,4000);
});

test('received payments remain usable before the optional finance migration and merge after rollout',async()=>{
  const data=staffData();const quote=await quoteStaffOrder(inputForQuote(data),database);
  const created=await createStaffOrder({...data,expectedTotal:quote.total,quoteVersion:quote.quoteVersion,idempotencyKey:key('no-finance-yet')},database,'test-admin');
  await pg.exec('ALTER TABLE "FinanceEntry" RENAME TO "FinanceEntry_pending_rollout"');
  try { await recordReceivedPayment({operationId:randomUUID(),orderId:created.id,payment:{method:'BANK_TRANSFER',allocation:'ITEMS',amountCents:10000,reference:'transfer-01'},reason:'Bank receipt verified'},'test-admin',database);
    const row=(await database.query.order.findFirst())!;assert.equal(paymentState(row,(await paymentRowsForOrders([row],database)).get(row.id)).remaining,2000);
  } finally { await pg.exec('ALTER TABLE "FinanceEntry_pending_rollout" RENAME TO "FinanceEntry"'); }
  const row=(await database.query.order.findFirst())!;assert.equal(paymentState(row,(await paymentRowsForOrders([row],database)).get(row.id)).remaining,2000);
  const overview=await orderFinanceOverview(row.id,database);assert.equal(overview.collected,10000);assert.equal(overview.entries.length,1);
});


test('website pickup has no delivery fee and can never register as a carrier shipment',async()=>{
  const input={...payload(),fulfillmentMethod:'PICKUP',city:'Customer pickup',deliveryZoneId:'PICKUP',address:'Customer pickup',expectedTotal:100};
  const quote=await quoteCheckout(input,database);assert.equal(quote.deliveryFee,0);assert.equal(quote.total,100);
  const created=await createCheckout(input,key('web-pickup'),null,database);
  await transitionOrder(created.id,'CONFIRMED','test-admin',database);await transitionOrder(created.id,'READY','test-admin',database);
  await assert.rejects(queueCarrierRegistration({orderId:created.id,companyId:'not-needed'},'test-admin',database),/pickup/i);
});

test('prepayment after carrier registration requires an explicit revised-balance check',async()=>{
  const data=staffData();const quote=await quoteStaffOrder(inputForQuote(data),database);
  const created=await createStaffOrder({...data,expectedTotal:quote.total,quoteVersion:quote.quoteVersion,idempotencyKey:key('carrier-balance-review')},database,'test-admin');
  await database.update(tables.order).set({sentToInfinidis:true}).where(eq(tables.order.id,created.id));
  await recordReceivedPayment({operationId:randomUUID(),orderId:created.id,payment:{method:'CARD',allocation:'ITEMS',amountCents:10000,reference:'paid-after-registration'},reason:'Verified card receipt'},'test-admin',database);
  assert.equal(((await database.query.order.findFirst())?.deliveryAddress as {carrierBalanceReviewRequired:boolean}).carrierBalanceReviewRequired,true);
  await assert.rejects(confirmCarrierBalance({orderId:created.id,reference:'carrier-updated',expectedRemainingCents:12000},'test-admin',database),/balance changed/);
  await confirmCarrierBalance({orderId:created.id,reference:'carrier-updated',expectedRemainingCents:2000},'test-admin',database);
  assert.equal(((await database.query.order.findFirst())?.deliveryAddress as {carrierBalanceReviewRequired:boolean}).carrierBalanceReviewRequired,false);
});


test('manual online availability accepts visible zero-stock products without altering historical counts',async()=>{
  await database.update(tables.siteSettings).set({config:{inventoryTrackingEnabled:false,customBouquetBaseFee:19}});
  await database.update(tables.product).set({stock:0});
  const catalog=await browseCatalog(catalogFilters({availability:'AVAILABLE'}),database);
  assert.equal(catalog.trackInventory,false);assert.equal(catalog.items.length,1);
  const created=await createCheckout(payload(),key('web-manual-availability'),null,database);
  const row=(await database.query.order.findFirst())!;
  assert.equal((row.deliveryAddress as {stockReserved:boolean}).stockReserved,false);
  assert.equal((await database.query.product.findFirst())?.stock,0);
  assert.equal((await database.query.inventoryMovement.findMany()).length,0);
  await transitionOrder(created.id,'CANCELLED','test-admin',database);
  assert.equal((await database.query.product.findFirst())?.stock,0);
  await transitionOrder(created.id,'CONFIRMED','test-admin',database);
  assert.equal((await database.query.product.findFirst())?.stock,0);
  await database.update(tables.product).set({isAvailable:false});
  await assert.rejects(createCheckout(payload(),key('web-hidden-manual'),null,database),/available/);
});

test('manual online availability keeps custom recipe limits and allows untracked component counts',async()=>{
  await database.update(tables.siteSettings).set({config:{inventoryTrackingEnabled:false,customBouquetBaseFee:19}});
  await database.update(tables.builderComponent).set({stock:0});
  const input={...payload(),expectedTotal:69,cartItems:[{kind:'CUSTOM',cartLineId:'custom-manual',quantity:1,configuration:{components:{flower:1,wrap:1,card:1}}}]};
  const created=await createCheckout(input,key('web-custom-manual'),null,database);
  assert.equal((await database.query.order.findFirst())?.total,69);
  assert.ok((await database.query.builderComponent.findMany()).every(row=>row.stock===0));
  await transitionOrder(created.id,'CANCELLED','test-admin',database);
  assert.ok((await database.query.builderComponent.findMany()).every(row=>row.stock===0));
  await assert.rejects(createCheckout({...input,cartItems:[{...input.cartItems[0],configuration:{components:{flower:6}}}]},key('web-custom-invalid-limit'),null,database),/quantity/);
});


test('report periods are calendar-based in Casablanca and reject invalid or unbounded custom dates',()=>{
 const now=new Date('2026-11-24T23:30:00Z');
 assert.deepEqual(reportPeriod({period:'30'},now),{period:'30',from:'2026-10-27',to:'2026-11-25',label:'Last 30 days'});
 assert.equal(reportPeriod({period:'MONTH'},now).from,'2026-11-01');
 assert.equal(reportPeriod({period:'CUSTOM',from:'2026-02-31',to:'2026-03-01'},now).error,'Choose a valid date range of up to one year.');
 assert.ok(reportPeriod({period:'CUSTOM',from:'2025-01-01',to:'2026-11-01'},now).error);
 assert.equal(reportPeriod({period:'ALL'},now,'MONTH',true).from,'');
});

test('daily reports include zero-order days and never interpolate sparse sales or count cancellations as booked value',()=>{
 const series=dailyOrderSeries([{createdAt:new Date('2026-11-14T23:30:00Z'),status:'DELIVERED',subtotal:100,discount:0,deliveryAddress:{}},{createdAt:new Date('2026-11-24T10:00:00Z'),status:'CONFIRMED',subtotal:149,discount:0,deliveryAddress:{}},{createdAt:new Date('2026-11-24T12:00:00Z'),status:'CANCELLED',subtotal:300,discount:0,deliveryAddress:{}}],'2026-11-01','2026-11-30');
 assert.equal(series.length,30);assert.equal(series[0].date,'2026-11-01');assert.equal(series.at(-1)?.date,'2026-11-30');
 assert.equal(series[14].revenue,100);assert.equal(series[23].orders,2);assert.equal(series[23].revenue,149);assert.equal(series[20].revenue,0);assert.equal(series.reduce((sum,row)=>sum+row.revenue,0),249);
});

test('finance period totals separate current receipts from old purchases while preserving all-date carrier balances',async()=>{
 const {financeSummary}=await import('./finance');
 async function paidOrder(suffix:string,at:string,paid=true){const data={...staffData(),trackInventory:false,...(paid?{receivedPayment:{method:'CARD',allocation:'ORDER',amountCents:12000,reference:`receipt-${suffix}`}}:{})};const quote=await quoteStaffOrder({...inputForQuote(data),trackInventory:false},database);const created=await createStaffOrder({...data,expectedTotal:quote.total,quoteVersion:quote.quoteVersion,idempotencyKey:key(suffix)},database,'test-admin');const row=(await database.query.order.findFirst({where:eq(tables.order.id,created.id)}))!;const address=row.deliveryAddress as {paymentRecords?:{at:string}[]};await database.update(tables.order).set({createdAt:new Date(at),deliveryAddress:{...address,paymentRecords:address.paymentRecords?.map(entry=>({...entry,at}))}}).where(eq(tables.order.id,created.id));await database.update(tables.financeEntry).set({createdAt:new Date(at)}).where(eq(tables.financeEntry.orderId,created.id));return created;}
 await paidOrder('period-old','2026-10-15T12:00:00Z');await paidOrder('period-current','2026-11-15T12:00:00Z');
 const carrier=await paidOrder('period-carrier','2026-10-20T12:00:00Z',false);await database.update(tables.order).set({status:'DELIVERED'}).where(eq(tables.order.id,carrier.id));
 await recordReceivedPayment({operationId:randomUUID(),orderId:carrier.id,payment:{method:'CASH',allocation:'ORDER',amountCents:12000,reference:''},channel:'CARRIER',reason:'Verified carrier collection'},'test-admin',database);
 const row=(await database.query.order.findFirst({where:eq(tables.order.id,carrier.id)}))!;const address=row.deliveryAddress as {paymentRecords:{at:string}[]};await database.update(tables.order).set({deliveryAddress:{...address,paymentRecords:address.paymentRecords.map(entry=>({...entry,at:'2026-10-20T12:00:00Z'}))}}).where(eq(tables.order.id,carrier.id));await database.update(tables.financeEntry).set({createdAt:new Date('2026-10-20T12:00:00Z')}).where(eq(tables.financeEntry.orderId,carrier.id));
 const operationId=randomUUID();await recordFinanceEntry({operationId,orderId:carrier.id,type:'REMITTANCE',channel:'CARRIER',amountCents:4000,feeCents:0,reason:'Verified partial settlement',reference:'settlement-test'},'test-admin',database);await database.update(tables.financeEntry).set({createdAt:new Date('2026-11-10T12:00:00Z')}).where(eq(tables.financeEntry.id,operationId));
 await database.insert(tables.expense).values([{id:randomUUID(),description:'Earlier purchase',amount:50,category:'OTHER',date:new Date('2026-10-10T12:00:00Z'),updatedAt:new Date()},{id:randomUUID(),description:'Current expense',amount:10,category:'OTHER',date:new Date('2026-11-10T12:00:00Z'),updatedAt:new Date()}]);
 const current=await financeSummary(database,{from:'2026-11-01',to:'2026-11-30'});assert.equal(current.collected,12000);assert.equal(current.expensesCents,1000);assert.equal(current.carrierOutstanding,8000);assert.equal(current.cashPosition,15000);
 const all=await financeSummary(database);assert.equal(all.collected,36000);assert.equal(all.expensesCents,6000);assert.equal(all.carrierOutstanding,8000);
});


test('quick order components are durable, hidden online, and retry without duplicates', async () => {
  const input = { id: randomUUID(), name: '  Lavender rose  ', type: 'FLOWER', unitPrice: 35 };
  const first = await rememberQuickComponent(input, 'test-admin', database);
  const replay = await rememberQuickComponent(input, 'test-admin', database);
  assert.equal(first.id, replay.id); assert.equal(first.name, 'Lavender rose');
  assert.equal(first.stock, 0); assert.equal(first.isAvailable, false); assert.equal(first.imageUrl, null);
  assert.equal((await database.query.auditLog.findMany()).length, 1);
  assert.equal((await database.query.order.findMany()).length, 0);
  await assert.rejects(rememberQuickComponent({ ...input, unitPrice: 40 }, 'test-admin', database), /changed/);
});

test('quick component validation never rounds prices or accepts customer visibility fields', async () => {
  const input = { id: randomUUID(), name: 'New flower', type: 'FLOWER', unitPrice: 35 };
  for (const patch of [{ name: '   ' }, { name: 'x'.repeat(151) }, { unitPrice: -1 }, { unitPrice: 2.5 }, { unitPrice: NaN }, { type: 'WRAPPING' }, { isAvailable: true }]) {
    await assert.rejects(rememberQuickComponent({ ...input, ...patch }, 'test-admin', database));
  }
  assert.equal((await database.query.builderComponent.findMany()).length, 3);
});

test('remembered flowers survive drafts, price correctly in staff orders, and retain order history after later editing', async () => {
  const component = await rememberQuickComponent({ id: randomUUID(), name: 'Lavender rose', type: 'FLOWER', unitPrice: 35 }, 'test-admin', database);
  const data = { ...staffData(), trackInventory: false, items: [{ productId: 'BOUQUET', quantity: 1, configuration: { components: { [component.id]: 2 } } }] };
  const saved = await saveOrderDraft(newDraft(data), 'test-admin', database);
  assert.equal(saved.data.items[0].configuration?.components[component.id], 2);
  const quote = await quoteStaffOrder(inputForQuote(data), database);
  assert.equal(quote.subtotal, 89); assert.equal(quote.total, 109);
  const created = await createStaffOrder({ ...data, expectedTotal: quote.total, quoteVersion: quote.quoteVersion, idempotencyKey: key('remembered-flower') }, database, 'test-admin');
  await database.update(tables.builderComponent).set({ name: 'Updated rose', unitPrice: 50, imageUrl: '/uploads/rose.webp' }).where(eq(tables.builderComponent.id, component.id));
  const line = (await database.query.orderItem.findMany()).find(row => row.orderId === created.id)!;
  assert.equal(line.unitPrice, 89);
  assert.equal((line.configuration as {componentNames:Record<string,string>}).componentNames[component.id], 'Lavender rose');
  assert.equal((await database.query.builderComponent.findFirst({where:eq(tables.builderComponent.id,component.id)}))?.stock, 0);
});

test('hidden quick components stay unavailable at public checkout, and staff stock limits remain enforced', async () => {
  const component = await rememberQuickComponent({ id: randomUUID(), name: 'New butterfly', type: 'ANIMAL_BUG', unitPrice: 25 }, 'test-admin', database);
  const configuration = { components: { [component.id]: 1 } };
  await database.update(tables.siteSettings).set({ config: { customBouquetBaseFee: 19, inventoryTrackingEnabled: false } });
  await assert.rejects(quoteCheckout({ ...payload(), cartItems: [{ kind: 'CUSTOM', cartLineId: 'hidden-item', quantity: 1, configuration }] }, database), /no longer available/);
  await assert.rejects(quoteStaffOrder(inputForQuote({ ...staffData(), trackInventory: true, items: [{ productId: 'BOUQUET', quantity: 1, configuration }] }), database), /not enough stock/);
  const quote = await quoteStaffOrder(inputForQuote({ ...staffData(), trackInventory: false, items: [{ productId: 'BOUQUET', quantity: 1, configuration }] }), database);
  assert.equal(quote.total, 64);
});


test('remembering a new item and its audit entry roll back together', async () => {
  await assert.rejects(rememberQuickComponent({ id: randomUUID(), name: 'Rollback flower', type: 'FLOWER', unitPrice: 20 }, 'missing-actor', database));
  assert.equal((await database.query.builderComponent.findMany()).length, 3);
  assert.equal((await database.query.auditLog.findMany()).length, 0);
});
