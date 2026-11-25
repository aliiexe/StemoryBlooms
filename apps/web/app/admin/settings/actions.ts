'use server';
import {revalidatePath} from 'next/cache';
import {db,eq,deliveryCompany,auditLog} from '@stemory/database';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import {assertAdmin} from '@/lib/user-sync';
import {changeSiteSettings} from '@/lib/site-settings';
import {validateImageReferences} from '@/lib/image-references';
type SettingsResult={success?:boolean;error?:string};
function refresh(){for(const path of ['/admin/settings','/admin','/admin/builder','/custom-bouquet','/'])revalidatePath(path);}
const failure=(error:unknown)=>({error:error instanceof Error?error.message:'Settings could not be saved.'});
export async function setSiteMode(mode:unknown,expectedMode:string):Promise<SettingsResult>{
 const actor=await assertAdmin();const parsed=z.enum(['WAITLIST','LIVE','MAINTENANCE','DRAFT']).safeParse(mode);if(!parsed.success)return {error:'Choose a valid store mode.'};
 try{await changeSiteSettings(actor.id,`Changed store mode to ${parsed.data}`,(_config,currentMode)=>{if(currentMode!==expectedMode&&currentMode!==parsed.data)throw new Error('Store mode changed. Reload before changing it.');return {mode:parsed.data};});refresh();return {success:true};}catch(error){return failure(error);}
}
export async function saveHeroSettings(formData:FormData):Promise<SettingsResult>{
 const actor=await assertAdmin();
 try{const fade=z.coerce.number().int().min(2).max(30).parse(formData.get('fadeSpeed'));const images:unknown=JSON.parse(String(formData.get('images')||'[]'));
 await changeSiteSettings(actor.id,'Saved hero images and timing',config=>({config:{...config,heroImages:validateImageReferences(images,Array.isArray(config.heroImages)?config.heroImages.filter((value):value is string=>typeof value==='string'):[]),heroFadeSpeed:fade}}));refresh();return {success:true};}catch{return {error:'Choose uploaded images and an interval between 2 and 30 seconds.'};}
}
export async function saveBuilderSections(input:unknown):Promise<SettingsResult>{
 const actor=await assertAdmin();const parsed=z.object({Flowers:z.boolean(),Leaves:z.boolean(),'Animals or Bugs':z.boolean(),Wrapping:z.boolean(),Cards:z.boolean()}).strict().safeParse(input);if(!parsed.success)return {error:'Check the builder sections.'};
 try{await changeSiteSettings(actor.id,'Saved builder sections',config=>({config:{...config,builderSections:parsed.data}}));refresh();return {success:true};}catch(error){return failure(error);}
}
export async function saveCustomBuilderSettings(formData:FormData):Promise<SettingsResult>{
 const actor=await assertAdmin();const parsed=z.coerce.number().int().min(0).max(1000000).safeParse(formData.get('customBouquetBaseFee'));if(!parsed.success)return {error:'Use a nonnegative whole-MAD base fee.'};
 try{await changeSiteSettings(actor.id,'Saved custom bouquet base fee',config=>({config:{...config,customBouquetBaseFee:parsed.data}}));refresh();return {success:true};}catch(error){return failure(error);}
}
const carrierSchema=z.object({id:z.string().min(1).max(128),name:z.string().trim().min(1).max(150),contact:z.string().trim().max(150),email:z.union([z.string().trim().email().max(254),z.literal('')]),fee:z.coerce.number().int().min(0).max(1000000),isActive:z.boolean()});
export async function saveDeliveryCompany(formData:FormData):Promise<SettingsResult>{
 const actor=await assertAdmin();const parsed=carrierSchema.safeParse({...Object.fromEntries(['id','name','contact','email','fee'].map(key=>[key,formData.get(key)])),isActive:formData.get('isActive')==='true'});if(!parsed.success)return {error:'Check the carrier name, email, and nonnegative whole-MAD fee.'};
 try{await db.transaction(async tx=>{const input=parsed.data;const [before]=await tx.select().from(deliveryCompany).where(eq(deliveryCompany.id,input.id)).for('update');const values={name:input.name,contact:input.contact||null,email:input.email||null,fee:input.fee,isActive:input.isActive};
 if(before){const prior={name:before.name,contact:before.contact,email:before.email,fee:before.fee,isActive:before.isActive};if(JSON.stringify(prior)===JSON.stringify(values))return;if(formData.get('isNew')==='true'||formData.get('expected')!==JSON.stringify(prior))throw new Error('This carrier changed. Reload before editing.');await tx.update(deliveryCompany).set(values).where(eq(deliveryCompany.id,input.id));}
 else{if(formData.get('isNew')!=='true')throw new Error('Carrier not found.');await tx.insert(deliveryCompany).values({id:input.id,...values});}
 await tx.insert(auditLog).values({id:randomUUID(),actorId:actor.id,action:before?'UPDATE':'CREATE',target:'CARRIER',summary:`Saved carrier ${input.name}`,details:{carrierId:input.id,before:before||null,after:values}});});revalidatePath('/admin/settings');revalidatePath('/admin/deliveries');return {success:true};}catch(error){return failure(error);}
}
export async function deleteDeliveryCompany(id:string):Promise<SettingsResult>{
 const actor=await assertAdmin();
 try{await db.transaction(async tx=>{const [before]=await tx.select().from(deliveryCompany).where(eq(deliveryCompany.id,id)).for('update');if(!before)throw new Error('Carrier not found.');if(!before.isActive)return;await tx.update(deliveryCompany).set({isActive:false}).where(eq(deliveryCompany.id,id));await tx.insert(auditLog).values({id:randomUUID(),actorId:actor.id,action:'DISABLE',target:'CARRIER',summary:`Disabled carrier ${before.name}`,details:{carrierId:id}});});revalidatePath('/admin/settings');revalidatePath('/admin/deliveries');return {success:true};}catch(error){return failure(error);}
}

export async function saveInventoryMode(enabled:unknown,expectedEnabled:unknown):Promise<SettingsResult>{
 const actor=await assertAdmin();
 if(typeof enabled!=='boolean'||typeof expectedEnabled!=='boolean')return {error:'Choose a valid availability mode.'};
 try{await changeSiteSettings(actor.id,enabled?'Enabled online stock limits':'Enabled manual online availability',config=>{
 const current=config.inventoryTrackingEnabled!==false;
 if(current!==expectedEnabled&&current!==enabled)throw new Error('Availability mode changed. Reload before saving.');
 return {config:{...config,inventoryTrackingEnabled:enabled}};
 });refresh();revalidatePath('/shop');revalidatePath('/shop/[id]','page');revalidatePath('/api/v1/products');return {success:true};}catch(error){return failure(error);}
}
