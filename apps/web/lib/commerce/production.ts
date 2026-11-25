import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db, eq, builderComponent, productMaterial, productBuilderComponent } from '@stemory/database';
import type { CommerceDatabase, CommerceTransaction } from './orders';
import { CommerceError } from './errors';
import { beginStockOperation, finishStockOperation, readStockTarget, writeStockTarget, operationReasonSchema, type StockChange, type StockKind } from './stock-ledger';

const recipeSchema = z.array(z.object({ materialId: z.string().min(1).max(128), quantity: z.number().int().min(1).max(100000) }).strict()).max(100);
const quoteSchema = z.object({ kind: z.enum(['PRODUCT', 'COMPONENT']), id: z.string().min(1).max(128), quantity: z.number().int().min(1).max(1000) }).strict();
const productionSchema = quoteSchema.extend({ operationId: z.string().uuid(), reason: operationReasonSchema, recipeVersion: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
type Reader = CommerceDatabase | CommerceTransaction;
export type ProductionInput = z.infer<typeof quoteSchema>;
export type ProductionQuote = { output: { kind: 'PRODUCT' | 'COMPONENT'; id: string; name: string; currentStock: number; quantity: number }; inputs: { kind: StockKind; id: string; name: string; perUnit: number; required: number; available: number }[]; recipeVersion: string; canProduce: boolean };

async function recipeQuote(input: ProductionInput, reader: Reader, lock: boolean): Promise<ProductionQuote> {
  const target = await readStockTarget(reader, input.kind, input.id, lock);
  if (!target) throw new CommerceError('The production item no longer exists.', 'NOT_FOUND', 404);
  const demands = new Map<string, { kind: StockKind; id: string; perUnit: number }>();
  const add = (kind: StockKind, id: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > 100000 || !id) throw new CommerceError('Repair this item’s recipe before producing it.');
    const key = `${kind}:${id}`; const current = demands.get(key);
    demands.set(key, { kind, id, perUnit: (current?.perUnit || 0) + quantity });
  };
  if (input.kind === 'PRODUCT') {
    const rows = await reader.select().from(productMaterial).where(eq(productMaterial.productId, input.id));
    const components = await reader.select().from(productBuilderComponent).where(eq(productBuilderComponent.productId, input.id));
    rows.forEach(row => add('MATERIAL', row.materialId, row.quantity));
    components.forEach(row => add('COMPONENT', row.builderComponentId, row.quantity));
  } else {
    const component = await reader.query.builderComponent.findFirst({ where: eq(builderComponent.id, input.id), columns: { materials: true } });
    const recipe = recipeSchema.safeParse(component?.materials || []);
    if (!recipe.success) throw new CommerceError('Repair this component’s raw-material recipe before producing it.');
    recipe.data.forEach(line => add('MATERIAL', line.materialId, line.quantity));
  }
  if (!demands.size) throw new CommerceError('Add a recipe before producing this item. Use a reasoned count correction for existing finished stock.');
  const inputs: ProductionQuote['inputs'] = [];
  // Finished products are locked first, then components, then materials: the same
  // ordering used by checkout. Assembling a product does not consume a component’s raw inputs again.
  for (const line of [...demands.values()].sort((a, b) => `${a.kind}:${a.id}`.localeCompare(`${b.kind}:${b.id}`))) {
    const value = await readStockTarget(reader, line.kind, line.id, lock);
    if (!value) throw new CommerceError('A recipe ingredient no longer exists. Repair the recipe first.');
    const required = line.perUnit * input.quantity;
    if (!Number.isSafeInteger(required) || required > 1000000) throw new CommerceError('This production batch is too large.');
    inputs.push({ ...line, name: value.name, required, available: value.quantity });
  }
  const recipeVersion = createHash('sha256').update(JSON.stringify({ kind: input.kind, id: input.id, name: target.name, inputs: inputs.map(({ kind, id, name, perUnit }) => ({ kind, id, name, perUnit })) })).digest('hex');
  return { output: { kind: input.kind, id: input.id, name: target.name, currentStock: target.quantity, quantity: input.quantity }, inputs, recipeVersion,
    canProduce: target.quantity >= 0 && target.quantity + input.quantity <= 1000000 && inputs.every(line => line.available >= line.required) };
}
export async function quoteProduction(input: unknown, database: CommerceDatabase = db) {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError('Choose an item and a whole production quantity between 1 and 1,000.');
  return recipeQuote(parsed.data, database, false);
}
export async function recordProduction(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = productionSchema.safeParse(input);
  if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Review this production batch first.');
  const data = parsed.data;
  return database.transaction(async tx => {
    const attempt = await beginStockOperation(tx, data.operationId, data, actorId);
    if (attempt.previous) return attempt.previous;
    const quote = await recipeQuote(data, tx, true);
    if (quote.recipeVersion !== data.recipeVersion) throw new CommerceError('The recipe changed. Review a fresh production preview.', 'RECIPE_CHANGED', 409);
    if (!quote.canProduce) throw new CommerceError('There is not enough stock for this batch. No ingredients were consumed.', 'OUT_OF_STOCK', 409);
    const changes: StockChange[] = [];
    for (const line of quote.inputs) {
      await writeStockTarget(tx, line.kind, line.id, line.available - line.required);
      changes.push({ kind: line.kind, id: line.id, name: line.name, before: line.available, after: line.available - line.required, delta: -line.required });
    }
    const after = quote.output.currentStock + data.quantity;
    await writeStockTarget(tx, data.kind, data.id, after);
    changes.push({ kind: data.kind, id: data.id, name: quote.output.name, before: quote.output.currentStock, after, delta: data.quantity });
    return finishStockOperation(tx, { id: data.operationId, type: 'PRODUCTION', actorId, reason: data.reason, requestHash: attempt.requestHash,
      subjectName: quote.output.name, finalQuantity: after, changes });
  });
}
