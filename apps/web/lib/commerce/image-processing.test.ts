import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {prepareImage} from '../image-processing';
test('image processing verifies raster bytes, resizes dimensions, and returns a metadata-free WebP',async()=>{
  const bytes=await sharp({create:{width:2200,height:1100,channels:3,background:'#88aa55'}}).jpeg().toBuffer();
  const result=await prepareImage(new File([new Uint8Array(bytes)],'photo.jpg',{type:'image/jpeg'}));const metadata=await sharp(Buffer.from(await result.arrayBuffer())).metadata();
  assert.equal(result.type,'image/webp');assert.equal(metadata.width,1600);assert.equal(metadata.height,800);assert.equal(metadata.exif,undefined);
  await assert.rejects(prepareImage(new File(['<svg/>'],'fake.png',{type:'image/png'})));
  await assert.rejects(prepareImage(new File(['<svg/>'],'vector.svg',{type:'image/svg+xml'})));
});
