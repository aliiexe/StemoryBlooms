import {auth} from '@clerk/nextjs/server';
import {headers} from 'next/headers';
import {db,eq,user,auditLog} from '@stemory/database';
import {randomUUID} from 'node:crypto';
export async function recordAuditLog(args:{action:string;target:string;summary:string;details?:Record<string,unknown>}){
  try{
    const {userId}=await auth();const actor=userId?await db.query.user.findFirst({where:eq(user.clerkId,userId),columns:{id:true}}):null;const requestHeaders=await headers();
    await db.insert(auditLog).values({id:randomUUID(),actorId:actor?.id||null,action:args.action,target:args.target,summary:args.summary,details:{...args.details,clerkId:userId},ipAddress:requestHeaders.get('x-forwarded-for')?.split(',')[0].trim().slice(0,100)||'unknown',userAgent:(requestHeaders.get('user-agent')||'unknown').slice(0,500)});
  }catch{console.error('Audit record could not be written.');}
}
