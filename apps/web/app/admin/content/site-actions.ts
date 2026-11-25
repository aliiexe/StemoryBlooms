'use server';
import { revalidatePath } from 'next/cache';
import { assertAdmin } from '@/lib/user-sync';
import { saveSiteCopy } from '@/lib/commerce/site-copy';
export async function saveWebsiteCopy(input: unknown) {
  const actor = await assertAdmin();
  try { const result = await saveSiteCopy(input,actor.id); revalidatePath('/admin/content'); revalidatePath(result.key==='home'?'/':`/${result.key}`); return {success:true as const,revision:result.revision}; }
  catch(error) {return {success:false as const,error:error instanceof Error?error.message:'Content could not be saved.'};}
}
