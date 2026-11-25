import {db,siteSettings,auditLog,eq,sql} from '@stemory/database';
import {randomUUID} from 'node:crypto';
import type {CommerceDatabase} from './commerce/orders';
export async function changeSiteSettings(actorId:string,summary:string,patch:(config:Record<string,unknown>,mode:string)=>{config?:Record<string,unknown>;mode?:string},database:CommerceDatabase=db){
  return database.transaction(async tx=>{
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('site-settings',0))`);
    const [before]=await tx.select().from(siteSettings).limit(1).for('update');
    const current=before?.config&&typeof before.config==='object'&&!Array.isArray(before.config)?before.config as Record<string,unknown>:{};
    const update=patch(current,before?.mode||'WAITLIST');const after={config:update.config||current,mode:update.mode||before?.mode||'WAITLIST',updatedAt:new Date()};
    if(before)await tx.update(siteSettings).set(after).where(eq(siteSettings.id,before.id));else await tx.insert(siteSettings).values({id:randomUUID(),...after});
    await tx.insert(auditLog).values({id:randomUUID(),actorId,action:'UPDATE',target:'SETTINGS',summary,details:{before:before||null,after}});
    return after;
  });
}
