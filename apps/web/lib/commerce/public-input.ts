import { z } from 'zod';

export const publicEmail = z.string().trim().toLowerCase().email().max(254);
export const contactInput = z.object({
  firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80),
  email: publicEmail, subject: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(5000),
});
export const reviewInput = z.object({
  productId: z.string().min(1).max(128), authorName: z.string().trim().min(1).max(100),
  rating: z.coerce.number().int().min(1).max(5), title: z.string().trim().max(160),
  content: z.string().trim().min(1).max(3000),
});
export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}
