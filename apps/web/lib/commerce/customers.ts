import { z } from 'zod';
import { db, customer, order, auditLog, eq, and, sql } from '@stemory/database';
import { CheckoutPayloadSchema } from '@stemory/contracts';
import { randomUUID } from 'node:crypto';
import { normalizePhone, type CommerceDatabase } from './orders';
import type { OrderAddress } from './receipt-access';
import { CommerceError } from './errors';
const profileSchema=z.object({id:z.string().min(1).max(128),expectedUpdatedAt:z.string().datetime(),firstName:z.string().trim().min(1).max(150),lastName:z.string().trim().max(150),phone:z.preprocess(value=>typeof value==='string'?value.replace(/[()\s-]/g,''):value,CheckoutPayloadSchema.shape.phoneNumber),email:z.union([z.string().trim().email().max(254),z.literal('')]),socialHandle:z.string().trim().max(150),internalNote:z.string().trim().max(5000),riskFlag:z.boolean()}).strict();
export async function updateCustomerProfile(input:unknown,actorId:string,database:CommerceDatabase=db){
 const parsed=profileSchema.safeParse(input);if(!parsed.success)throw new CommerceError(parsed.error.issues[0]?.message||'Check the customer details.');const data=parsed.data;
 return database.transaction(async tx=>{const before=await tx.query.customer.findFirst({where:eq(customer.id,data.id)});if(!before)throw new CommerceError('Customer not found.');// Lock existing legacy orders before contact locks, matching fulfillment's order-before-stock sequence.
  const legacy=await tx.select().from(order).where(and(eq(order.customerId,data.id),sql`${order.deliveryAddress}->>'customerSnapshot' IS NULL`)).orderBy(order.id).for('update');
  const phone=normalizePhone(data.phone);const email=data.email.toLowerCase()||null;
  const keys=[`phone:${normalizePhone(before.phone)}`,`phone:${phone}`,...(before.email?[`email:${before.email.trim().toLowerCase()}`]:[]),...(email?[`email:${email}`]:[])];for(const key of [...new Set(keys)].sort())await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${key},0))`);
  const [current]=await tx.select().from(customer).where(eq(customer.id,data.id)).for('update');if(!current||current.updatedAt.toISOString()!==data.expectedUpdatedAt)throw new CommerceError('This customer changed. Reload before editing.','CUSTOMER_CONFLICT',409);
  const duplicate=await tx.select({id:customer.id}).from(customer).where(sql`${customer.id} <> ${data.id} AND (right(regexp_replace(${customer.phone},'[^0-9]','','g'),9)=${phone.slice(-9)} OR (${email}::text IS NOT NULL AND lower(trim(${customer.email}))=${email}))`).limit(1);if(duplicate.length)throw new CommerceError('That phone or email already belongs to another customer. Reconcile the profiles instead of overwriting them.');
  for(const row of legacy)await tx.update(order).set({deliveryAddress:{...row.deliveryAddress as OrderAddress,customerSnapshot:{firstName:current.firstName,lastName:current.lastName,email:current.email,phone:current.phone}},updatedAt:new Date()}).where(eq(order.id,row.id));
  const values={firstName:data.firstName,lastName:data.lastName,phone,email,socialHandle:data.socialHandle||null,internalNote:data.internalNote||null,riskFlag:data.riskFlag,updatedAt:new Date()};await tx.update(customer).set(values).where(eq(customer.id,data.id));await tx.insert(auditLog).values({id:randomUUID(),actorId,action:'UPDATE',target:'CUSTOMER',summary:'Updated customer profile; order snapshots preserved',details:{customerId:data.id,before:current,after:values}});return{id:data.id};
 });
}
