'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface ImageUploaderProps {
  initialImages?: string[];
  onChange?: (images: string[]) => void;
  onFilesChange?: (files: File[]) => void;
  name?: string;
}

interface DisplayImage {
  id: string;
  src: string;
  isExisting: boolean;
  file?: File;
}

export function ImageUploader({ initialImages = [], onChange, onFilesChange, name }: ImageUploaderProps) {
  const [displayImages, setDisplayImages] = useState<DisplayImage[]>(() => initialImages.map((image) => ({
    id: image,
    src: image,
    isExisting: true,
  })));
  const [persistedImages, setPersistedImages] = useState<string[]>(() => initialImages);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (files: File[]) => {
    if (!files.length) return;

    const nextPendingFiles = [...pendingFiles, ...files];
    setPendingFiles(nextPendingFiles);
    onFilesChange?.(nextPendingFiles);

    const nextDisplayImages = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      src: URL.createObjectURL(file),
      isExisting: false,
      file,
    }));

    setDisplayImages((prev) => [...prev, ...nextDisplayImages]);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    addFiles(selectedFiles);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const item = displayImages[index];
    if (!item) return;

    setDisplayImages((prev) => prev.filter((_, idx) => idx !== index));

    if (item.isExisting) {
      const nextPersistedImages = persistedImages.filter((image) => image !== item.src);
      setPersistedImages(nextPersistedImages);
      onChange?.(nextPersistedImages);
    } else if (item.file) {
      const nextPendingFiles = pendingFiles.filter((file) => file !== item.file);
      setPendingFiles(nextPendingFiles);
      onFilesChange?.(nextPendingFiles);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {name && <input type="hidden" name={name} value={JSON.stringify(persistedImages)} />}

      <div
        onClick={() => fileInputRef.current?.click()}
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

      {displayImages.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
          {displayImages.map((img, idx) => (
            <div key={img.id} style={{ position: 'relative', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #EAE6DF' }}>
              <img src={img.src} alt={`Upload ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
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
