import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { db, waitlistEntry, communicationToken, notificationOutbox, eq, sql, and } from '@stemory/database';
import { publicEmail } from './public-input';
import type { CommerceDatabase } from './orders';
import { CommerceError } from './errors';
const digest = (token: string) => createHash('sha256').update(token).digest('hex');
export async function waitlistSchemaReady(database: CommerceDatabase = db) {
  const result = await database.execute(sql`SELECT to_regclass('public."CommunicationToken"') IS NOT NULL AS ready`);
  return Boolean(result.rows[0]?.ready);
}
export async function requestWaitlistVerification(input: unknown, database: CommerceDatabase = db) {
  const email = publicEmail.safeParse(input); if (!email.success) throw new CommerceError('Enter a valid email address.');
  if (!await waitlistSchemaReady(database)) throw new CommerceError('Waitlist confirmation is temporarily unavailable. Please try again later.');
  return database.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`waitlist:${email.data}`},0))`);
    const [existing] = await tx.select().from(waitlistEntry).where(eq(waitlistEntry.email,email.data)).for('update');
    if (existing?.isVerified && !existing.unsubscribed) return { jobId: null };
    if (existing) {
      const recent = await tx.select({ id: communicationToken.id }).from(communicationToken).where(and(eq(communicationToken.subscriberId,existing.id),sql`${communicationToken.createdAt} > NOW() - INTERVAL '5 minutes'`,sql`${communicationToken.usedAt} IS NULL`)).limit(1);
      if (recent.length) return { jobId: null };
    }
    const subscriberId = existing?.id || randomUUID();
    if (!existing) await tx.insert(waitlistEntry).values({id:subscriberId,email:email.data,source:'WEBSITE'});
    // Rejoining never grants consent until the new verification link is confirmed.
    await tx.update(communicationToken).set({usedAt:new Date()}).where(and(eq(communicationToken.subscriberId,subscriberId),eq(communicationToken.purpose,'VERIFY'),sql`${communicationToken.usedAt} IS NULL`));
    const verify = randomBytes(32).toString('base64url'); const unsubscribe = randomBytes(32).toString('base64url');
    await tx.insert(communicationToken).values([
      {id:randomUUID(),subscriberId,purpose:'VERIFY',tokenHash:digest(verify),expiresAt:new Date(Date.now()+24*60*60*1000)},
      {id:randomUUID(),subscriberId,purpose:'UNSUBSCRIBE',tokenHash:digest(unsubscribe),expiresAt:new Date(Date.now()+365*24*60*60*1000)},
    ]);
    const jobId = randomUUID();
    await tx.insert(notificationOutbox).values({id:jobId,type:'WAITLIST_VERIFICATION',recipient:email.data,payload:{subscriberId,verifyToken:verify,unsubscribeToken:unsubscribe},updatedAt:new Date()});
    return {jobId};
  });
}
export async function consumeCommunicationToken(token: unknown, purpose: 'VERIFY' | 'UNSUBSCRIBE', database: CommerceDatabase = db) {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new CommerceError('This link is invalid. Request a new confirmation email.');
  if (!await waitlistSchemaReady(database)) throw new CommerceError('This service is temporarily unavailable.');
  return database.transaction(async tx => {
    const match = await tx.query.communicationToken.findFirst({where:eq(communicationToken.tokenHash,digest(token))});
    if (!match || match.purpose !== purpose) throw new CommerceError('This link is invalid.');
    const [subscriber] = await tx.select().from(waitlistEntry).where(eq(waitlistEntry.id,match.subscriberId)).for('update');
    const [current] = await tx.select().from(communicationToken).where(eq(communicationToken.id,match.id)).for('update');
    if (!subscriber || !current || current.expiresAt < new Date()) throw new CommerceError('This link has expired. Request a new confirmation email.');
    if (current.usedAt) {
      if(purpose==='VERIFY' && (!subscriber.isVerified || subscriber.unsubscribed)) throw new CommerceError('This confirmation link is no longer active. Request a new email.');
      return {alreadyUsed:true};
    }
    await tx.update(waitlistEntry).set(purpose==='VERIFY'?{isVerified:true,unsubscribed:false}:{unsubscribed:true}).where(eq(waitlistEntry.id,subscriber.id));
    await tx.update(communicationToken).set({usedAt:new Date()}).where(eq(communicationToken.id,current.id));
    if (purpose==='UNSUBSCRIBE') {
      await tx.update(communicationToken).set({usedAt:new Date()}).where(and(eq(communicationToken.subscriberId,subscriber.id),eq(communicationToken.purpose,'VERIFY'),sql`${communicationToken.usedAt} IS NULL`));
      await tx.update(notificationOutbox).set({status:'CANCELLED',updatedAt:new Date()}).where(sql`${notificationOutbox.type}='WAITLIST_VERIFICATION' AND ${notificationOutbox.payload}->>'subscriberId'=${subscriber.id} AND ${notificationOutbox.status} IN ('PENDING','FAILED')`);
    }
    return {alreadyUsed:false};
  });
}
