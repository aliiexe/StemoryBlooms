import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db, contentBlock, eq, sql, auditLog } from '@stemory/database';
import { contentKeySchema, siteCopySchema, parseManagedContent } from '../site-content';
import type { CommerceDatabase } from './orders';
import { CommerceError } from './errors';
const inputSchema = z.object({ key: contentKeySchema, expectedRevision: z.number().int().nonnegative(), copy: siteCopySchema, publish: z.boolean() }).strict();
export async function saveSiteCopy(input: unknown, actorId: string, database: CommerceDatabase = db) {
  const parsed = inputSchema.safeParse(input); if (!parsed.success) throw new CommerceError(parsed.error.issues[0]?.message || 'Check the content fields.');
  const data = parsed.data;
  if (data.key === 'home' && data.copy.body.length > 160) throw new CommerceError('Keep the homepage tagline within 160 characters.');
  return database.transaction(async tx => {
    const key = `site.${data.key}`; await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`);
    const [row] = await tx.select().from(contentBlock).where(eq(contentBlock.key,key)).for('update');
    const previous = parseManagedContent(row?.content);
    if (row && !previous) throw new CommerceError('Existing content has an unsupported format. Preserve it for reconciliation before editing.');
    if ((previous?.revision || 0) !== data.expectedRevision) throw new CommerceError('This content changed. Reload before saving over another edit.','CONTENT_CONFLICT',409);
    const revision = data.expectedRevision + 1;
    const content = { schemaVersion: 1, revision, draft: data.copy, published: data.publish ? data.copy : previous?.published || null };
    if (row) await tx.update(contentBlock).set({content,updatedAt:new Date()}).where(eq(contentBlock.id,row.id));
    else await tx.insert(contentBlock).values({id:randomUUID(),key,content,updatedAt:new Date()});
    await tx.insert(auditLog).values({id:randomUUID(),actorId,action:data.publish?'PUBLISH':'SAVE_DRAFT',target:'SITE_CONTENT',summary:`${data.publish?'Published':'Saved draft'} ${data.key} copy`,details:{key,revision,before:row?.content||null,after:content}});
    return {key:data.key,revision};
  });
}
