'use server';
import { assertAdmin } from '@/lib/user-sync';
import { updateCustomerProfile } from '@/lib/commerce/customers';
import { publicError } from '@/lib/commerce/errors';
import { revalidatePath } from 'next/cache';
export async function saveCustomerProfile(input:unknown){const actor=await assertAdmin();try{const value=await updateCustomerProfile(input,actor.id);for(const path of ['/admin/customers',`/admin/customers/${value.id}`,'/admin/orders','/admin/deliveries'])revalidatePath(path);return{success:true as const};}catch(error){return{success:false as const,error:publicError(error).message};}}
