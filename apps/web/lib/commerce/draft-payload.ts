import { z } from 'zod';
import { AssistedDraftDataSchema, type AssistedDraftData } from '@stemory/contracts';

export const envelopeSchema = z.object({
  schemaVersion: z.literal(1), title: z.string().min(1).max(120), data: AssistedDraftDataSchema,
  revision: z.number().int().nonnegative(), status: z.enum(['DRAFT', 'ARCHIVED', 'CONVERTED']),
  updatedBy: z.string(), convertedOrderId: z.string().optional(), convertedOrderNumber: z.string().optional(),
}).strict();
export type DraftEnvelope = z.infer<typeof envelopeSchema>;
export type DraftEditor = { id: string; title: string; data: AssistedDraftData; revision: number; status: DraftEnvelope['status']; convertedOrderId?: string; convertedOrderNumber?: string };

export function readDraftPayload(payload: unknown): DraftEnvelope | null {
  const current = envelopeSchema.safeParse(payload);
  if (current.success) return current.data;
  // Preserve unknown historical payloads; only known form-shaped records can be resumed.
  if (!payload || typeof payload !== 'object' || 'schemaVersion' in payload || !('source' in payload) || !('items' in payload)) return null;
  const record = payload as Record<string, unknown>;
  const known = Object.fromEntries(Object.keys(AssistedDraftDataSchema.shape).filter(key => record[key] !== undefined).map(key => [key, record[key]]));
  if (Array.isArray(known.items)) known.items = known.items.map(item => {
    if (!item || typeof item !== 'object') return item;
    return Object.fromEntries(Object.entries(item).filter(([key]) => key !== 'id'));
  });
  const legacy = AssistedDraftDataSchema.safeParse(known);
  if (!legacy.success) return null;
  const components: Record<string, number> = {};
  const items = legacy.data.items.filter(item => {
    if (!item.productId.startsWith('COMPONENT_')) return true;
    const id = item.productId.slice(10); components[id] = (components[id] || 0) + item.quantity;
    return false;
  });
  if (Object.keys(components).length) items.push({ productId: 'BOUQUET', quantity: 1, configuration: { components } });
  const data = AssistedDraftDataSchema.safeParse({ ...legacy.data, items });
  return data.success ? { schemaVersion: 1, title: legacy.data.customerName || 'Earlier draft', data: data.data, revision: 0, status: 'DRAFT', updatedBy: '' } : null;
}

