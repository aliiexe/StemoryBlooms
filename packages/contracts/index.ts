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

export const CartItemSchema = z.object({
  productId: z.string().optional(),
  name: z.string(),
  price: z.number(),
  quantity: z.number().min(1),
  imageUrl: z.string().optional(),
  configuration: z.any().optional(), // For custom bouquets
});

export const CheckoutPayloadSchema = z.object({
  customerName: z.string().min(2, "Full name is required"),
  phoneNumber: z.string().regex(/^(?:(?:(?:\+|00)212[\s]?(?:[\s]?\(0\)[\s]?)?)|0){1}(?:5[\s.-]?[2-3]|6[\s.-]?[13-9]{1}|7[\s.-]?[0-28-9]{1})[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}$/, "Must be a valid Moroccan phone number"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(5, "Complete address is required"),
  deliveryInstructions: z.string().optional(),
  cartItems: z.array(CartItemSchema).min(1, "Cart cannot be empty"),
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

