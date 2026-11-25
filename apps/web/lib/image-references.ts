export function validateImageReferences(value:unknown,existing:string[]=[],maximum=10):string[]{
  if(!Array.isArray(value)||value.length>maximum||value.some(item=>typeof item!=='string'))throw new Error('Choose at most 10 uploaded images.');
  for(const item of value as string[]){
    if(existing.includes(item))continue;
    if(item.length>2000)throw new Error('Upload images before saving. New embedded image data is not accepted.');
    if(/^\/(?!\/)(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg|webp)$/i.test(item)&&!item.includes('..'))continue;
    let url:URL;try{url=new URL(item);}catch{throw new Error('Choose an uploaded image.');}
    if(url.protocol!=='https:'||!url.hostname.endsWith('.public.blob.vercel-storage.com')||url.username||url.password||!url.pathname.startsWith('/uploads/'))throw new Error('Upload images through the image picker before saving.');
  }
  return value as string[];
}
