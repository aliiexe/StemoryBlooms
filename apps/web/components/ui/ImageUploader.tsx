'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  initialImages?: string[];
  onChange?: (images: string[]) => void;
  name?: string;
}

export function ImageUploader({ initialImages = [], onChange, name }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Mock upload: we just use a generic placeholder instead of actually uploading to S3
    // In a real app, we'd upload the File to Vercel Blob/S3 here and get a URL back.
    if (e.target.files && e.target.files.length > 0) {
      const newImages = [...images, '/hero-bouquet.png'];
      setImages(newImages);
      if (onChange) onChange(newImages);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);
    if (onChange) onChange(newImages);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Hidden input to submit the array of strings as a JSON string for FormData */}
      {name && <input type="hidden" name={name} value={JSON.stringify(images)} />}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragging(false); /* mock drop */ setImages([...images, '/hero-bouquet.png']); }}
        style={{
          border: `2px dashed ${isDragging ? 'var(--brand-primary)' : '#D6CFE6'}`,
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
          backgroundColor: isDragging ? '#FDFBF7' : '#FFFFFF',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#FDFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <UploadCloud size={32} color="var(--brand-primary)" />
        </div>
        <div>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 500, color: '#3A3531', fontSize: '1.1rem' }}>
            Click to upload or drag and drop
          </p>
          <p style={{ margin: 0, color: '#9A9591', fontSize: '0.9rem' }}>
            SVG, PNG, JPG or GIF (max. 5MB)
          </p>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFile}
          style={{ display: 'none' }} 
          accept="image/*"
          multiple
        />
      </div>

      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #EAE6DF' }}>
              <Image src={img} alt={`Upload ${idx}`} fill style={{ objectFit: 'cover' }} />
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
    </div>
  );
}
