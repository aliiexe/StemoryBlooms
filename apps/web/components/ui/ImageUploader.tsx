'use client';
import {useEffect,useRef,useState} from 'react';
import {UploadCloud,X} from 'lucide-react';
import {uploadStoreImage} from '@/app/admin/media/actions';
interface ImageUploaderProps{initialImages?:string[];onChange?:(images:string[])=>void;name?:string;maxImages?:number}
export function ImageUploader({initialImages=[],onChange,name,maxImages=10}:ImageUploaderProps){
  const [images,setImages]=useState(initialImages);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [progress,setProgress]=useState('');const [dragging,setDragging]=useState(false);const input=useRef<HTMLInputElement>(null);const root=useRef<HTMLDivElement>(null);const inFlight=useRef(false);
  useEffect(()=>{if(!busy)return;const form=root.current?.closest('form');const block=(event:Event)=>{event.preventDefault();event.stopPropagation();setError('Wait for image uploads to finish before saving.');};form?.addEventListener('submit',block,true);return()=>form?.removeEventListener('submit',block,true);},[busy]);
  async function addFiles(files:File[]){
    if(inFlight.current||!files.length)return;
    if(images.length+files.length>maxImages){setError(`Keep at most ${maxImages} images. Remove an image before adding more.`);return;}
    if(files.some(file=>!['image/jpeg','image/png','image/webp'].includes(file.type)||!file.size||file.size>8*1024*1024)){setError('Choose JPEG, PNG, or WebP files up to 8 MB each.');return;}
    inFlight.current=true;setBusy(true);setError('');const uploaded:string[]=[];let failed=0;
    for(let index=0;index<files.length;index++){
      setProgress(`Uploading image ${index+1} of ${files.length}…`);
      try{const form=new FormData();form.set('image',files[index]);const result=await uploadStoreImage(form);if(result.url)uploaded.push(result.url);else{failed++;setError(result.error||'Image upload failed.');}}catch{failed++;setError('An image upload could not be confirmed. Retry the missing image.');}
    }
    const next=[...images,...uploaded];setImages(next);onChange?.(next);setProgress(failed?`${uploaded.length} uploaded; ${failed} need retry.`:`${uploaded.length} images uploaded.`);setBusy(false);inFlight.current=false;
  }
  function remove(index:number){if(busy)return;const next=images.filter((_,position)=>position!==index);setImages(next);onChange?.(next);}
  return <div ref={root} style={{width:'100%'}} aria-busy={busy}>{name&&<input type="hidden" name={name} value={JSON.stringify(images)}/>}
    <div onDragOver={event=>{event.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={event=>{event.preventDefault();setDragging(false);void addFiles(Array.from(event.dataTransfer.files));}} style={{border:`2px dashed ${dragging?'#3e5539':'#D6CFE6'}`,borderRadius:16,padding:'1.5rem',textAlign:'center',background:dragging?'#EEF2E8':'white'}}>
      <UploadCloud size={30} color="#3e5539"/><p>Upload product photography or drag files here</p><button type="button" disabled={busy||images.length>=maxImages} onClick={()=>input.current?.click()} style={{minHeight:44,padding:'0.75rem 1.25rem',borderRadius:10,border:'1px solid #D6CFE6',background:'#f5f1e9',color:'#30412d',font:'inherit',cursor:'pointer'}}>{busy?'Uploading…':'Choose images'}</button><p style={{fontSize:'0.85rem',color:'#625e56'}}>Still JPEG, PNG, WebP · 8 MB each · up to {maxImages} images. Images are resized and stored as URLs.</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden disabled={busy} onChange={event=>{void addFiles(Array.from(event.target.files||[]));event.target.value='';}}/>
    </div>{progress&&<p role="status">{progress}</p>}{error&&<p role="alert" style={{color:'#8c2635'}}>{error}</p>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:12,marginTop:16}}>{images.map((src,index)=><div key={`${src.slice(0,60)}-${index}`} style={{position:'relative',aspectRatio:'1',borderRadius:12,overflow:'hidden',border:'1px solid #ddd'}}><img src={src} alt={`Uploaded image ${index+1}`} loading="lazy" style={{width:'100%',height:'100%',objectFit:'cover'}}/><button type="button" disabled={busy} aria-label={`Remove image ${index+1}`} onClick={()=>remove(index)} style={{position:'absolute',top:4,right:4,width:44,height:44,borderRadius:24,border:0,background:'#fff',color:'#592b33',display:'grid',placeItems:'center',cursor:'pointer'}}><X size={18}/></button></div>)}</div>
  </div>;
}
