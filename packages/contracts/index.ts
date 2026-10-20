import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  basePrice: z.number(),
  isAvailable: z.boolean(),
  status: z.string(),
});

export type Product = z.infer<typeof ProductSchema>;

export const BuilderComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  unitPrice: z.number(),
  minQuantity: z.number(),
  maxQuantity: z.number().nullable(),
  isAvailable: z.boolean(),
});

export type BuilderComponent = z.infer<typeof BuilderComponentSchema>;

const identifier = z.string().trim().min(1).max(128);
const quantity = z.number().int().min(1).max(100);
export const CustomConfigurationSchema = z.object({
  components: z.record(identifier, quantity).refine(value => Object.keys(value).length > 0 && Object.keys(value).length <= 50, 'Choose between 1 and 50 components'),
  cardMessage: z.string().trim().max(500).optional(),
}).strict();

export const CartItemSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PRODUCT'), cartLineId: identifier, productId: identifier, quantity }).strict(),
  z.object({ kind: z.literal('CUSTOM'), cartLineId: identifier, quantity, configuration: CustomConfigurationSchema }).strict(),
]);

export type CheckoutCartItem = z.infer<typeof CartItemSchema>;
export const CheckoutQuoteSchema = z.object({
  city: z.string().trim().min(1, 'City is required').max(100),
  deliveryZoneId: identifier,
  promoCode: z.string().trim().max(64).optional(),
  giftCardCode: z.string().trim().max(64).optional(),
  cartItems: z.array(CartItemSchema).min(1, 'Cart cannot be empty').max(50),
});

export const CheckoutPayloadSchema = z.object({
  customerName: z.string().trim().min(2, "Full name is required").max(150),
  email: z.string().trim().email("Must be a valid email").max(254),
  phoneNumber: z.string().regex(/^(?:\+212|0)\s*[5-7](?:\s*\d){8}$/, "Must be a valid Moroccan phone number"),
  ...CheckoutQuoteSchema.shape,
  address: z.string().trim().min(5, "Complete address is required").max(500),
  deliveryInstructions: z.string().trim().max(1000).optional(),
  expectedTotal: z.number().int().nonnegative().max(10000000),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms" })
  }),
  deliveryPolicyAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the delivery policy" })
  }),
  privacyNoticeAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the privacy notice" })
  }),
  codConditionsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the COD conditions" })
  }),
});

export type CheckoutPayload = z.infer<typeof CheckoutPayloadSchema>;

export const AssistedSourceSchema = z.enum(['INSTAGRAM', 'TIKTOK', 'PHONE', 'IN_PERSON']);
const assistedItemFields = {
  productId: identifier,
  quantity,
  customName: z.string().trim().min(1).max(150).optional(),
  customPrice: z.number().int().nonnegative().max(1000000).optional(),
  configuration: CustomConfigurationSchema.optional(),
};
export const AssistedItemSchema = z.object(assistedItemFields).strict();
const assistedPricingFields = {
  source: AssistedSourceSchema,
  city: z.string().trim().max(100),
  deliveryZoneId: identifier.optional(),
  manualDiscount: z.number().int().nonnegative().max(10000000),
  manualDiscountReason: z.string().trim().max(300).optional(),
  promoCode: z.string().trim().max(64).optional(),
  isHandDelivered: z.boolean().optional(),
  items: z.array(AssistedItemSchema).min(1).max(50),
};
function validateAssistedPricing(value: z.infer<typeof assistedPricingObject>, ctx: z.RefinementCtx) {
  if (value.isHandDelivered && value.source !== 'IN_PERSON') ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Hand delivery is only available for in-person orders.' });
  if (!value.isHandDelivered && (!value.deliveryZoneId || !value.city)) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select an active delivery city.' });
  if (value.manualDiscount > 0 && !value.manualDiscountReason) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a reason for the manual discount.' });
  value.items.forEach((item, index) => {
    if (item.productId === 'CUSTOM' && (!item.customName || item.customPrice === undefined)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', index], message: 'Manual items need a name and valid price.' });
    if (item.productId === 'BOUQUET' && !item.configuration) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', index], message: 'Choose components for each custom bouquet.' });
    if (item.productId !== 'BOUQUET' && item.configuration) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['items', index], message: 'Only custom bouquets can have a component recipe.' });
  });
}
const assistedPricingObject = z.object(assistedPricingFields).strict();
export const AssistedQuoteSchema = assistedPricingObject.superRefine(validateAssistedPricing);
export const AssistedOrderSchema = z.object({
  ...assistedPricingFields,
  customerName: z.string().trim().min(2).max(150),
  phoneNumber: CheckoutPayloadSchema.shape.phoneNumber,
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  address: z.string().trim().max(500),
  recipientName: z.string().trim().max(150).optional(),
  recipientPhone: z.union([CheckoutPayloadSchema.shape.phoneNumber, z.literal('')]).optional(),
  notes: z.string().trim().max(1000).optional(),
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,128}$/),
  expectedTotal: z.number().int().nonnegative().max(10000000),
  quoteVersion: z.string().regex(/^[a-f0-9]{64}$/),
}).strict().superRefine((value, ctx) => {
  validateAssistedPricing(value, ctx);
  if (!value.isHandDelivered && value.address.length < 5) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'Provide a complete delivery address.' });
  if (Boolean(value.recipientName) !== Boolean(value.recipientPhone)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['recipientName'], message: 'Enter both recipient name and phone, or leave both blank to use the buyer.' });
});

// Drafts deliberately allow incomplete contacts and selections. Conversion uses the full order schema.
export const AssistedDraftDataSchema = z.object({
  source: AssistedSourceSchema.default('INSTAGRAM'),
  customerName: z.string().max(150).default(''), phoneNumber: z.string().max(40).default(''),
  email: z.string().max(254).default(''), city: z.string().max(100).default(''), address: z.string().max(500).default(''),
  recipientName: z.string().max(150).default(''), recipientPhone: z.string().max(40).default(''),
  notes: z.string().max(1000).default(''), deliveryZoneId: z.string().max(128).default(''),
  manualDiscount: z.number().int().nonnegative().max(10000000).default(0),
  manualDiscountReason: z.string().max(300).default(''), promoCode: z.string().max(64).default(''),
  isHandDelivered: z.boolean().default(false),
  items: z.array(z.object({
    productId: z.string().max(128), quantity,
    customName: z.string().max(150).optional(), customPrice: z.number().int().nonnegative().max(1000000).optional(),
    configuration: z.object({ components: z.record(identifier, quantity).refine(value => Object.keys(value).length <= 50), cardMessage: z.string().max(500).optional() }).strict().optional(),
  }).strict()).max(50).default([]),
}).strict();
export type AssistedDraftData = z.infer<typeof AssistedDraftDataSchema>;
export type AssistedQuoteInput = z.infer<typeof AssistedQuoteSchema>;
