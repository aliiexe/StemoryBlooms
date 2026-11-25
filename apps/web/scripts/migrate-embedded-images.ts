/** Dry run by default. Back up the database before explicitly using --apply --backup-confirmed. */
import {createHash,randomUUID} from 'node:crypto';
import {db,product,builderComponent,siteSettings,auditLog,eq,and} from '@stemory/database';
import {prepareImage} from '../lib/image-processing';
import {uploadImage} from '../lib/upload';
import type {CommerceTransaction} from '../lib/commerce/orders';
const apply=process.argv.includes('--apply');const runId=randomUUID();const urls=new Map<string,string>();
async function replaceEmbedded(images:string[]){
 const result:string[]=[];
 for(const source of images){
  if(!source.startsWith('data:')){result.push(source);continue;}
  const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]*={0,2})$/.exec(source);if(!match)throw new Error('Unsupported embedded image.');
  const hash=createHash('sha256').update(source).digest('hex');let url=urls.get(hash);
  if(!url){const bytes=Buffer.from(match[2],'base64');const prepared=await prepareImage(new File([new Uint8Array(bytes)],'legacy-image',{type:match[1]}));url=await uploadImage(prepared);urls.set(hash,url);}
  result.push(url);
 }
 return result;
}
async function main(){
 if(apply&&(!process.argv.includes('--backup-confirmed')||!process.env.BLOB_READ_WRITE_TOKEN))throw new Error('Apply requires --backup-confirmed and configured object storage.');
 const [products,components,settings]=await Promise.all([db.select({id:product.id,images:product.images}).from(product),db.select({id:builderComponent.id,image:builderComponent.imageUrl}).from(builderComponent),db.select().from(siteSettings)]);
 const jobs:{kind:string;id:string;images:string[];save:(tx:CommerceTransaction,images:string[])=>Promise<number>}[]=[];
 for(const row of products)if(row.images?.some(value=>value.startsWith('data:')))jobs.push({kind:'PRODUCT',id:row.id,images:row.images,save:async(tx,images)=>(await tx.update(product).set({images,updatedAt:new Date()}).where(and(eq(product.id,row.id),eq(product.images,row.images!))).returning({id:product.id})).length});
 for(const row of components)if(row.image?.startsWith('data:'))jobs.push({kind:'COMPONENT',id:row.id,images:[row.image],save:async(tx,images)=>(await tx.update(builderComponent).set({imageUrl:images[0],updatedAt:new Date()}).where(and(eq(builderComponent.id,row.id),eq(builderComponent.imageUrl,row.image!))).returning({id:builderComponent.id})).length});
 for(const row of settings){const config=row.config as Record<string,unknown>|null;if(config&&Array.isArray(config.heroImages)&&config.heroImages.every(value=>typeof value==='string')&&config.heroImages.some(value=>value.startsWith('data:')))jobs.push({kind:'HERO',id:row.id,images:config.heroImages,save:async(tx,images)=>(await tx.update(siteSettings).set({config:{...config,heroImages:images},updatedAt:new Date()}).where(and(eq(siteSettings.id,row.id),eq(siteSettings.config,row.config))).returning({id:siteSettings.id})).length});}
 if(!apply){console.log(JSON.stringify({mode:'DRY_RUN',records:jobs.length,embeddedImages:jobs.reduce((sum,job)=>sum+job.images.filter(value=>value.startsWith('data:')).length,0)}));return;}
 let migrated=0,stale=0,failed=0;
 for(const job of jobs){try{const images=await replaceEmbedded(job.images);const updated=await db.transaction(async tx=>{const changed=await job.save(tx,images);if(changed)await tx.insert(auditLog).values({id:randomUUID(),actorId:null,requestId:runId,action:'MIGRATE_IMAGES',target:job.kind,summary:'Moved embedded images to object storage',details:{id:job.id,imageCount:images.length}});return changed;});if(updated)migrated++;else stale++;}catch{failed++;}}
 console.log(JSON.stringify({mode:'APPLY',runId,migrated,stale,failed}));if(failed)process.exitCode=1;
}
main().catch(()=>{console.error('Image migration could not run. Check configuration; no source image contents are logged.');process.exitCode=1;});
