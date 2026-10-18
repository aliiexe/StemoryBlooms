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

export const AssistedOrderSchema = z.object({
  source: z.enum(['INSTAGRAM', 'TIKTOK', 'PHONE', 'IN_PERSON']),
  customerName: z.string().trim().min(2).max(150),
  phoneNumber: CheckoutPayloadSchema.shape.phoneNumber,
  email: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  city: z.string().trim().max(100),
  address: z.string().trim().max(500),
  notes: z.string().trim().max(1000).optional(),
  deliveryZoneId: identifier.optional(),
  manualDiscount: z.number().int().nonnegative().max(10000000),
  promoCode: z.string().trim().max(64).optional(),
  isHandDelivered: z.boolean().optional(),
  idempotencyKey: z.string().min(16).max(128),
  items: z.array(z.object({
    productId: identifier,
    quantity,
    customName: z.string().trim().min(1).max(150).optional(),
    customPrice: z.number().int().nonnegative().max(1000000).optional(),
  }).strict()).min(1).max(50),
}).strict().superRefine((value, ctx) => {
  if (!value.isHandDelivered && (!value.deliveryZoneId || !value.city || value.address.length < 5)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select an active delivery zone and provide a complete address.' });
  }
  if (value.items.some(item => item.productId === 'CUSTOM' && (!item.customName || item.customPrice === undefined))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Custom items need a name and valid price.' });
  }
});

