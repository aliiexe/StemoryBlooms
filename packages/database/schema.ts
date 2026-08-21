import { pgTable, foreignKey, text, timestamp, uniqueIndex, boolean, integer, jsonb, index, doublePrecision } from "drizzle-orm/pg-core"
import { sql, relations } from "drizzle-orm"



export const auditLog = pgTable("AuditLog", {
	id: text().primaryKey().notNull(),
	actorId: text(),
	action: text().notNull(),
	target: text().notNull(),
	requestId: text(),
	summary: text(),
	details: jsonb(),
	ipAddress: text(),
	userAgent: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.actorId],
			foreignColumns: [user.id],
			name: "AuditLog_actorId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const customer = pgTable("Customer", {
	id: text().primaryKey().notNull(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	email: text(),
	phone: text().notNull(),
	socialHandle: text(),
	internalNote: text(),
	riskFlag: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("Customer_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	uniqueIndex("Customer_phone_key").using("btree", table.phone.asc().nullsLast().op("text_ops")),
]);

export const category = pgTable("Category", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
}, (table) => [
	uniqueIndex("Category_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const address = pgTable("Address", {
	id: text().primaryKey().notNull(),
	customerId: text().notNull(),
	city: text().notNull(),
	zone: text(),
	addressLine1: text().notNull(),
	addressLine2: text(),
	instructions: text(),
	isDefault: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "Address_customerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const product = pgTable("Product", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	basePrice: integer().notNull(),
	salePrice: integer(),
	images: text().array(),
	stock: integer().default(0).notNull(),
	isSaleEnabled: boolean().default(false).notNull(),
	isFeatured: boolean().default(false).notNull(),
	isAvailable: boolean().default(true).notNull(),
	status: text().default('PUBLISHED').notNull(),
	processingEstimate: text(),
	isCustomBuilder: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const review = pgTable("Review", {
	id: text().primaryKey().notNull(),
	productId: text().notNull(),
	customerId: text(),
	authorName: text().notNull(),
	rating: integer().notNull(),
	title: text(),
	content: text().notNull(),
	status: text().default('PENDING').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "Review_productId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "Review_customerId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const productVariant = pgTable("ProductVariant", {
	id: text().primaryKey().notNull(),
	productId: text().notNull(),
	name: text().notNull(),
	price: integer().notNull(),
	sku: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "ProductVariant_productId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const permission = pgTable("Permission", {
	id: text().primaryKey().notNull(),
	action: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("Permission_action_key").using("btree", table.action.asc().nullsLast().op("text_ops")),
]);

export const role = pgTable("Role", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("Role_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const builderComponent = pgTable("BuilderComponent", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	name: text().notNull(),
	unitPrice: integer().notNull(),
	stock: integer().default(0).notNull(),
	minQuantity: integer().default(0).notNull(),
	maxQuantity: integer(),
	imageUrl: text(),
	isAvailable: boolean().default(true).notNull(),
	materials: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const cartItem = pgTable("CartItem", {
	id: text().primaryKey().notNull(),
	cartId: text().notNull(),
	productId: text(),
	quantity: integer().notNull(),
	configuration: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cartId],
			foreignColumns: [cart.id],
			name: "CartItem_cartId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const order = pgTable("Order", {
	id: text().primaryKey().notNull(),
	orderNumber: text().notNull(),
	idempotencyKey: text(),
	customerId: text().notNull(),
	status: text().default('NEW').notNull(),
	source: text().default('WEBSITE').notNull(),
	subtotal: integer().notNull(),
	deliveryFee: integer().notNull(),
	discount: integer().default(0).notNull(),
	total: integer().notNull(),
	paymentStatus: text().default('PENDING_COD').notNull(),
	deliveryAddress: jsonb().notNull(),
	notes: text(),
	sentToInfinidis: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("Order_idempotencyKey_key").using("btree", table.idempotencyKey.asc().nullsLast().op("text_ops")),
	uniqueIndex("Order_orderNumber_key").using("btree", table.orderNumber.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "Order_customerId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const cart = pgTable("Cart", {
	id: text().primaryKey().notNull(),
	customerId: text(),
	sessionKey: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("Cart_sessionKey_key").using("btree", table.sessionKey.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.customerId],
			foreignColumns: [customer.id],
			name: "Cart_customerId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const orderItem = pgTable("OrderItem", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull(),
	productId: text(),
	productName: text().notNull(),
	quantity: integer().notNull(),
	unitPrice: integer().notNull(),
	totalPrice: integer().notNull(),
	configuration: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "OrderItem_orderId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const orderAdjustment = pgTable("OrderAdjustment", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull(),
	amount: integer().notNull(),
	reason: text().notNull(),
	actorId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "OrderAdjustment_orderId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const paymentStatusHistory = pgTable("PaymentStatusHistory", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull(),
	status: text().notNull(),
	actorId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "PaymentStatusHistory_orderId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const supplier = pgTable("Supplier", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	contactName: text(),
	email: text(),
	phone: text(),
	address: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const draftOrder = pgTable("DraftOrder", {
	id: text().primaryKey().notNull(),
	payload: jsonb().notNull(),
	actorId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const socialOrderMetadata = pgTable("SocialOrderMetadata", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull(),
	handle: text().notNull(),
	platform: text().notNull(),
	reference: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("SocialOrderMetadata_orderId_key").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
]);

export const stockMovement = pgTable("StockMovement", {
	id: text().primaryKey().notNull(),
	materialId: text().notNull(),
	quantity: integer().notNull(),
	reason: text().notNull(),
	actorId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.materialId],
			foreignColumns: [material.id],
			name: "StockMovement_materialId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const deliveryZone = pgTable("DeliveryZone", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	fee: integer().notNull(),
	deliveryTime: text(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("DeliveryZone_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const orderStatusHistory = pgTable("OrderStatusHistory", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull(),
	status: text().notNull(),
	actorId: text(),
	note: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "OrderStatusHistory_orderId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const receipt = pgTable("Receipt", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull(),
	orderNumber: text().notNull(),
	customerName: text(),
	phoneNumber: text(),
	address: text(),
	subtotal: integer().notNull(),
	deliveryFee: integer().notNull(),
	discount: integer().default(0).notNull(),
	total: integer().notNull(),
	items: jsonb().notNull(),
	content: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [order.id],
			name: "Receipt_orderId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const deliveryCompany = pgTable("DeliveryCompany", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	contact: text(),
	email: text(),
	fee: integer().default(0).notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const deliveryHandoff = pgTable("DeliveryHandoff", {
	id: text().primaryKey().notNull(),
	orderId: text().notNull(),
	companyId: text().notNull(),
	reference: text(),
	actorId: text().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("DeliveryHandoff_orderId_key").using("btree", table.orderId.asc().nullsLast().op("text_ops")),
]);

export const contentBlock = pgTable("ContentBlock", {
	id: text().primaryKey().notNull(),
	key: text().notNull(),
	content: jsonb().notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("ContentBlock_key_key").using("btree", table.key.asc().nullsLast().op("text_ops")),
]);

export const promoCode = pgTable("PromoCode", {
	id: text().primaryKey().notNull(),
	code: text().notNull(),
	type: text().notNull(),
	value: integer().notNull(),
	isActive: boolean().default(true).notNull(),
	usageLimit: integer(),
	usageCount: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("PromoCode_code_key").using("btree", table.code.asc().nullsLast().op("text_ops")),
]);

export const notificationOutbox = pgTable("NotificationOutbox", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	recipient: text().notNull(),
	payload: jsonb().notNull(),
	status: text().default('PENDING').notNull(),
	attempts: integer().default(0).notNull(),
	lastAttempt: timestamp({ precision: 3, mode: 'date' }),
	error: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const adminInboxEvent = pgTable("AdminInboxEvent", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	message: text().notNull(),
	read: boolean().default(false).notNull(),
	link: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const analyticsEvent = pgTable("AnalyticsEvent", {
	id: text().primaryKey().notNull(),
	event: text().notNull(),
	userId: text(),
	metadata: jsonb(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const productBuilderComponent = pgTable("ProductBuilderComponent", {
	id: text().primaryKey().notNull(),
	productId: text().notNull(),
	builderComponentId: text().notNull(),
	quantity: integer().notNull(),
});

export const productBuilderComponentRelations = relations(productBuilderComponent, ({ one }) => ({
	product: one(product, {
		fields: [productBuilderComponent.productId],
		references: [product.id],
	}),
	builderComponent: one(builderComponent, {
		fields: [productBuilderComponent.builderComponentId],
		references: [builderComponent.id],
	}),
}));

export const adminSettings = pgTable("AdminSettings", {
	id: text().primaryKey().notNull(),
	mode: text().default('WAITLIST').notNull(),
	config: jsonb(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const siteSettings = pgTable("SiteSettings", {
	id: text().primaryKey().notNull(),
	mode: text().default('WAITLIST').notNull(),
	config: jsonb(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const waitlistEntry = pgTable("WaitlistEntry", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	source: text(),
	isVerified: boolean().default(false).notNull(),
	unsubscribed: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	uniqueIndex("WaitlistEntry_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const launchCampaign = pgTable("LaunchCampaign", {
	id: text().primaryKey().notNull(),
	status: text().default('SCHEDULED').notNull(),
	scheduledFor: timestamp({ precision: 3, mode: 'date' }),
	sentCount: integer().default(0).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const announcementBarSettings = pgTable("AnnouncementBarSettings", {
	id: text().primaryKey().notNull(),
	enabled: boolean().default(false).notNull(),
	mode: text().default('AUTO').notNull(),
	autoPlay: boolean().default(true).notNull(),
	loop: boolean().default(true).notNull(),
	intervalSeconds: integer().default(5).notNull(),
	transitionType: text().default('FADE').notNull(),
	transitionDurationMs: integer().default(400).notNull(),
	pauseOnHover: boolean().default(true).notNull(),
	showArrows: boolean().default(true).notNull(),
	showIndicators: boolean().default(true).notNull(),
	allowDismissal: boolean().default(false).notNull(),
	defaultTheme: text().default('DEFAULT').notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const productMaterial = pgTable("ProductMaterial", {
	id: text().primaryKey().notNull(),
	productId: text().notNull(),
	materialId: text().notNull(),
	quantity: integer().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "ProductMaterial_productId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
	foreignKey({
			columns: [table.materialId],
			foreignColumns: [material.id],
			name: "ProductMaterial_materialId_fkey"
		}).onUpdate("cascade").onDelete("restrict"),
]);

export const permissionToRole = pgTable("_PermissionToRole", {
	a: text("A").notNull(),
	b: text("B").notNull(),
}, (table) => [
	uniqueIndex("_PermissionToRole_AB_unique").using("btree", table.a.asc().nullsLast().op("text_ops"), table.b.asc().nullsLast().op("text_ops")),
	index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [permission.id],
			name: "_PermissionToRole_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [role.id],
			name: "_PermissionToRole_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const contactMessage = pgTable("ContactMessage", {
	id: text().primaryKey().notNull(),
	firstName: text().notNull(),
	lastName: text().notNull(),
	email: text().notNull(),
	subject: text().notNull(),
	message: text().notNull(),
	status: text().default('UNREAD').notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
});

export const categoryToProduct = pgTable("_CategoryToProduct", {
	a: text("A").notNull(),
	b: text("B").notNull(),
}, (table) => [
	uniqueIndex("_CategoryToProduct_AB_unique").using("btree", table.a.asc().nullsLast().op("text_ops"), table.b.asc().nullsLast().op("text_ops")),
	index().using("btree", table.b.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.a],
			foreignColumns: [category.id],
			name: "_CategoryToProduct_A_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.b],
			foreignColumns: [product.id],
			name: "_CategoryToProduct_B_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const expense = pgTable("Expense", {
	id: text().primaryKey().notNull(),
	amount: doublePrecision().notNull(),
	description: text().notNull(),
	category: text().notNull(),
	relatedMaterialId: text(),
	relatedOrderId: text(),
	date: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.relatedMaterialId],
			foreignColumns: [material.id],
			name: "Expense_relatedMaterialId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.relatedOrderId],
			foreignColumns: [order.id],
			name: "Expense_relatedOrderId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const giftCard = pgTable("GiftCard", {
	id: text().primaryKey().notNull(),
	code: text().notNull(),
	initialBalance: integer().notNull(),
	currentBalance: integer().notNull(),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("GiftCard_code_key").using("btree", table.code.asc().nullsLast().op("text_ops")),
]);

export const user = pgTable("User", {
	id: text().primaryKey().notNull(),
	clerkId: text().notNull(),
	email: text().notNull(),
	firstName: text(),
	lastName: text(),
	roleId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("User_clerkId_key").using("btree", table.clerkId.asc().nullsLast().op("text_ops")),
	uniqueIndex("User_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [role.id],
			name: "User_roleId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const material = pgTable("Material", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	quantity: integer().default(0).notNull(),
	lowStockThreshold: integer(),
	cost: doublePrecision(),
	supplierId: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [supplier.id],
			name: "Material_supplierId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const announcementTemplate = pgTable("AnnouncementTemplate", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	eventType: text().notNull(),
	previewColor: text().default('#F6F4EC').notNull(),
	defaultConfig: jsonb().notNull(),
	active: boolean().default(true).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
}, (table) => [
	uniqueIndex("AnnouncementTemplate_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const announcement = pgTable("Announcement", {
	id: text().primaryKey().notNull(),
	internalTitle: text().notNull(),
	message: text().notNull(),
	highlightedText: text(),
	ctaLabel: text(),
	linkUrl: text(),
	wholeBarClickable: boolean().default(false).notNull(),
	openInNewTab: boolean().default(false).notNull(),
	icon: text(),
	decorativeAsset: text(),
	templateId: text(),
	status: text().default('DRAFT').notNull(),
	order: integer().default(0).notNull(),
	startAt: timestamp({ precision: 3, mode: 'date' }),
	endAt: timestamp({ precision: 3, mode: 'date' }),
	noEndDate: boolean().default(true).notNull(),
	isDismissible: boolean().default(false).notNull(),
	dismissalDuration: text().default('SESSION').notNull(),
	dismissalVersion: text().notNull(),
	backgroundColor: text().default('#F6F4EC').notNull(),
	textColor: text().default('#4A4A4A').notNull(),
	accentColor: text().default('#D6CFE6').notNull(),
	linkColor: text().default('#6F7E59').notNull(),
	borderColor: text(),
	textAlignment: text().default('CENTER').notNull(),
	desktopFontSize: text().default('0.875rem').notNull(),
	mobileFontSize: text().default('0.8rem').notNull(),
	barHeight: text().default('40px').notNull(),
	animationType: text().default('FADE').notNull(),
	showDesktop: boolean().default(true).notNull(),
	showTablet: boolean().default(true).notNull(),
	showMobile: boolean().default(true).notNull(),
	targetMode: text().default('ALL').notNull(),
	includedPaths: text().array(),
	excludedPaths: text().array(),
	countdownEnabled: boolean().default(false).notNull(),
	countdownTarget: timestamp({ precision: 3, mode: 'date' }),
	countdownEndBehavior: text().default('HIDE').notNull(),
	countdownReplacementText: text(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'date' }).notNull(),
	archivedAt: timestamp({ precision: 3, mode: 'date' }),
}, (table) => [
	foreignKey({
			columns: [table.templateId],
			foreignColumns: [announcementTemplate.id],
			name: "Announcement_templateId_fkey"
		}).onUpdate("cascade").onDelete("set null"),
]);

export const adminNotification = pgTable("AdminNotification", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	isRead: boolean().default(false).notNull(),
	createdAt: timestamp({ precision: 3, mode: 'date' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});
