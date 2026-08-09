import { relations } from "drizzle-orm/relations";
import { user, auditLog, customer, address, product, review, productVariant, cart, cartItem, order, orderItem, orderAdjustment, paymentStatusHistory, material, stockMovement, orderStatusHistory, receipt, productMaterial, permission, permissionToRole, role, category, categoryToProduct, supplier, announcementTemplate, announcement, deliveryHandoff } from "./schema";

export const auditLogRelations = relations(auditLog, ({one}) => ({
	user: one(user, {
		fields: [auditLog.actorId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({one, many}) => ({
	auditLogs: many(auditLog),
	role: one(role, {
		fields: [user.roleId],
		references: [role.id]
	}),
}));

export const addressRelations = relations(address, ({one}) => ({
	customer: one(customer, {
		fields: [address.customerId],
		references: [customer.id]
	}),
}));

export const customerRelations = relations(customer, ({many}) => ({
	addresses: many(address),
	reviews: many(review),
	orders: many(order),
	carts: many(cart),
}));

export const reviewRelations = relations(review, ({one}) => ({
	product: one(product, {
		fields: [review.productId],
		references: [product.id]
	}),
	customer: one(customer, {
		fields: [review.customerId],
		references: [customer.id]
	}),
}));

export const productRelations = relations(product, ({many}) => ({
	reviews: many(review),
	productVariants: many(productVariant),
	productMaterials: many(productMaterial),
	categoryToProducts: many(categoryToProduct),
}));

export const productVariantRelations = relations(productVariant, ({one}) => ({
	product: one(product, {
		fields: [productVariant.productId],
		references: [product.id]
	}),
}));

export const cartItemRelations = relations(cartItem, ({one}) => ({
	cart: one(cart, {
		fields: [cartItem.cartId],
		references: [cart.id]
	}),
}));

export const cartRelations = relations(cart, ({one, many}) => ({
	cartItems: many(cartItem),
	customer: one(customer, {
		fields: [cart.customerId],
		references: [customer.id]
	}),
}));

export const orderRelations = relations(order, ({one, many}) => ({
	customer: one(customer, {
		fields: [order.customerId],
		references: [customer.id]
	}),
	orderItems: many(orderItem),
	orderAdjustments: many(orderAdjustment),
	paymentStatusHistories: many(paymentStatusHistory),
	orderStatusHistories: many(orderStatusHistory),
	receipts: many(receipt),
	deliveryHandoff: one(deliveryHandoff, {
		fields: [order.id],
		references: [deliveryHandoff.orderId]
	}),
}));

export const orderItemRelations = relations(orderItem, ({one}) => ({
	order: one(order, {
		fields: [orderItem.orderId],
		references: [order.id]
	}),
}));

export const receiptRelations = relations(receipt, ({one}) => ({
	order: one(order, {
		fields: [receipt.orderId],
		references: [order.id]
	}),
}));

export const orderAdjustmentRelations = relations(orderAdjustment, ({one}) => ({
	order: one(order, {
		fields: [orderAdjustment.orderId],
		references: [order.id]
	}),
}));

export const paymentStatusHistoryRelations = relations(paymentStatusHistory, ({one}) => ({
	order: one(order, {
		fields: [paymentStatusHistory.orderId],
		references: [order.id]
	}),
}));

export const stockMovementRelations = relations(stockMovement, ({one}) => ({
	material: one(material, {
		fields: [stockMovement.materialId],
		references: [material.id]
	}),
}));

export const materialRelations = relations(material, ({one, many}) => ({
	stockMovements: many(stockMovement),
	productMaterials: many(productMaterial),
	supplier: one(supplier, {
		fields: [material.supplierId],
		references: [supplier.id]
	}),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({one}) => ({
	order: one(order, {
		fields: [orderStatusHistory.orderId],
		references: [order.id]
	}),
}));

export const productMaterialRelations = relations(productMaterial, ({one}) => ({
	product: one(product, {
		fields: [productMaterial.productId],
		references: [product.id]
	}),
	material: one(material, {
		fields: [productMaterial.materialId],
		references: [material.id]
	}),
}));

export const permissionToRoleRelations = relations(permissionToRole, ({one}) => ({
	permission: one(permission, {
		fields: [permissionToRole.a],
		references: [permission.id]
	}),
	role: one(role, {
		fields: [permissionToRole.b],
		references: [role.id]
	}),
}));

export const permissionRelations = relations(permission, ({many}) => ({
	permissionToRoles: many(permissionToRole),
}));

export const roleRelations = relations(role, ({many}) => ({
	permissionToRoles: many(permissionToRole),
	users: many(user),
}));

export const categoryToProductRelations = relations(categoryToProduct, ({one}) => ({
	category: one(category, {
		fields: [categoryToProduct.a],
		references: [category.id]
	}),
	product: one(product, {
		fields: [categoryToProduct.b],
		references: [product.id]
	}),
}));

export const categoryRelations = relations(category, ({many}) => ({
	categoryToProducts: many(categoryToProduct),
}));

export const supplierRelations = relations(supplier, ({many}) => ({
	materials: many(material),
}));

export const announcementRelations = relations(announcement, ({one}) => ({
	announcementTemplate: one(announcementTemplate, {
		fields: [announcement.templateId],
		references: [announcementTemplate.id]
	}),
}));

export const announcementTemplateRelations = relations(announcementTemplate, ({many}) => ({
	announcements: many(announcement),
}));

export const deliveryHandoffRelations = relations(deliveryHandoff, ({one}) => ({
	order: one(order, {
		fields: [deliveryHandoff.orderId],
		references: [order.id]
	}),
}));