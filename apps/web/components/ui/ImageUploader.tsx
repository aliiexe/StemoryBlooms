'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, X, Loader } from 'lucide-react';

interface ImageUploaderProps {
  initialImages?: string[];
  /** Called whenever the full image list changes (URLs + base64 data URLs) */
  onChange?: (images: string[]) => void;
  /** If provided, a hidden <input name={name}> is rendered with the JSON-encoded list */
  name?: string;
}

interface DisplayImage {
  id: string;
  /** Either an existing URL (/uploads/... or https://...) or a base64 data URL */
  src: string;
}

/**
 * Compress + convert a File to a base64 JPEG data URL using the Canvas API.
 * Resizes to max 1400px wide at 85% quality — reduces a 3MB photo to ~150–250KB.
 */
async function compressToBase64(file: File, maxWidth = 1400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (ev) => {
      const img = new Image();
      img.src = ev.target?.result as string;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export function ImageUploader({ initialImages = [], onChange, name }: ImageUploaderProps) {
  const [images, setImages] = useState<DisplayImage[]>(() =>
    initialImages.map((src) => ({ id: src, src }))
  );
  const [compressing, setCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allSrcs = images.map((i) => i.src);

  const addFiles = async (files: File[]) => {
    if (!files.length) return;
    setCompressing(true);
    try {
      const dataUrls = await Promise.all(files.map((f) => compressToBase64(f)));
      const next = [
        ...images,
        ...dataUrls.map((src) => ({ id: `${src.slice(0, 40)}-${Math.random()}`, src })),
      ];
      setImages(next);
      onChange?.(next.map((i) => i.src));
    } catch (e) {
      console.error('Image compression failed', e);
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (idx: number) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
    onChange?.(next.map((i) => i.src));
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Hidden input carries ALL images (existing URLs + new base64) as JSON */}
      {name && <input type="hidden" name={name} value={JSON.stringify(allSrcs)} />}

      {/* Drop zone */}
      <div
        onClick={() => !compressing && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          addFiles(Array.from(e.dataTransfer.files || []));
        }}
        style={{
          border: `2px dashed ${isDragging ? 'var(--brand-primary)' : '#D6CFE6'}`,
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: isDragging ? 'rgba(79,112,66,0.04)' : '#FFFFFF',
          cursor: compressing ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FDFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {compressing
            ? <Loader size={28} color="var(--brand-primary)" style={{ animation: 'spin 1s linear infinite' }} />
            : <UploadCloud size={32} color="var(--brand-primary)" />
          }
        </div>
        <div>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: '#3A3531', fontSize: '1.1rem' }}>
            {compressing ? 'Compressing image…' : 'Click to upload or drag and drop'}
          </p>
          <p style={{ margin: 0, color: '#9A9591', fontSize: '0.9rem' }}>
            PNG, JPG or GIF — auto-compressed &amp; stored in database
          </p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInput}
          style={{ display: 'none' }}
          accept="image/*"
          multiple
          disabled={compressing}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {images.map((img, idx) => (
            <div key={img.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #EAE6DF' }}>
              <img src={img.src} alt={`Image ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
