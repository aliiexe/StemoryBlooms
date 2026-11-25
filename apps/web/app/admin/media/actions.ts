'use server';
import {assertAdmin} from '@/lib/user-sync';
import {prepareImage} from '@/lib/image-processing';
import {uploadImage} from '@/lib/upload';
export async function uploadStoreImage(formData:FormData){
  await assertAdmin();
  const file=formData.get('image');if(!(file instanceof File))return {error:'Choose an image file.'};
  let prepared:File;
  try{prepared=await prepareImage(file);}catch{return {error:'Choose a still JPEG, PNG, or WebP up to 8 MB and 16 megapixels.'};}
  try{return {success:true as const,url:await uploadImage(prepared)};}catch{return {error:'Image storage is unavailable. Check the storage configuration and retry.'};}
}
