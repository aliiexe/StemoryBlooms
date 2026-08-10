'use client';

import React, { useState } from 'react';
import { ImageUploader } from '../../../components/ui/ImageUploader';
import { saveHeroSettings } from './actions';
import styles from '../dashboard.module.css';

interface HeroSettingsFormProps {
  initialImages: string[];
  initialFadeSpeed: number;
}

export function HeroSettingsForm({ initialImages, initialFadeSpeed }: HeroSettingsFormProps) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [fadeSpeed, setFadeSpeed] = useState(initialFadeSpeed);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    
    try {
      const formData = new FormData();
      formData.append('images', JSON.stringify(images));
      formData.append('fadeSpeed', fadeSpeed.toString());
      
      pendingFiles.forEach(file => {
        formData.append('newImages', file);
      });
      
      const result = await saveHeroSettings(formData);
      if (result.success) {
        setMessage('Hero settings saved successfully!');
        setPendingFiles([]); // Clear pending files since they're now uploaded
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving hero settings.');
      }
    } catch (err) {
      setMessage('An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.card}>
      <h3 className={styles.cardTitle}>Hero Slideshow</h3>
      <p style={{ color: '#7A7571', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Configure the images displayed on the main storefront, waitlist, and maintenance pages. If multiple images are uploaded, they will automatically fade into one another.
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <ImageUploader
          initialImages={images}
          onChange={setImages}
          onFilesChange={setPendingFiles}
        />
      </div>

      <div style={{ marginBottom: '2rem', maxWidth: '300px' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#5A5551', fontSize: '0.95rem' }}>
          Fade Interval (Seconds)
        </label>
        <input 
          type="number" 
          value={fadeSpeed}
          onChange={(e) => setFadeSpeed(parseInt(e.target.value) || 5)}
          min="2"
          max="30"
          required 
          style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #D6CFE6', fontSize: '1rem' }} 
        />
        <p style={{ fontSize: '0.8rem', color: '#7A7571', marginTop: '0.5rem' }}>
          How long each image stays on screen before transitioning.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          type="submit" 
          disabled={isSaving}
          style={{
            padding: '0.85rem 2rem',
            backgroundColor: 'var(--brand-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {isSaving ? 'Saving...' : 'Save Hero Settings'}
        </button>
        {message && (
          <span style={{ color: message.includes('error') ? '#E65100' : '#2E7D32', fontSize: '0.9rem', fontWeight: 500 }}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
