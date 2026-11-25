import sharp from 'sharp';
export const MAX_IMAGE_BYTES=8*1024*1024;
export async function prepareImage(file:File){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size===0||file.size>MAX_IMAGE_BYTES)throw new Error('Choose a JPEG, PNG, or WebP image up to 8 MB.');
  const bytes=Buffer.from(await file.arrayBuffer());
  const image=sharp(bytes,{limitInputPixels:16000000,failOn:'warning'});
  const metadata=await image.metadata();
  if(!['jpeg','png','webp'].includes(metadata.format||'')||!metadata.width||!metadata.height||(metadata.pages||1)>1||metadata.width>8000||metadata.height>8000||metadata.width*metadata.height>16000000)throw new Error('Use a still image up to 16 megapixels and 8,000 pixels on either side.');
  const output=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
  if(output.length>2*1024*1024)throw new Error('This image is too large after processing. Try a smaller image.');
  return new File([new Uint8Array(output)],'image.webp',{type:'image/webp'});
}
