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
  // ImageUploader now delivers base64 data URLs directly — no File tracking needed
  const [images, setImages] = useState<string[]>(initialImages);
  const [fadeSpeed, setFadeSpeed] = useState(initialFadeSpeed);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const formData = new FormData();
      // All images (existing URLs + new base64 data URLs) are already in the images array
      formData.append('images', JSON.stringify(images));
      formData.append('fadeSpeed', fadeSpeed.toString());

      const result = await saveHeroSettings(formData);
      if (result.success) {
        setMessage('Hero settings saved!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Error saving hero settings.');
      }
    } catch {
      setMessage('An error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.card}>
      <h3 className={styles.cardTitle}>Hero Slideshow</h3>
      <p style={{ color: '#7A7571', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Configure the images displayed on the main storefront, waitlist, and maintenance pages.
        If multiple images are uploaded they will automatically fade into one another.
      </p>

      <div style={{ marginBottom: '2rem' }}>
        <ImageUploader
          initialImages={images}
          onChange={setImages}
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
          className={styles.submitBtn}
          style={{ width: 'auto', padding: '0.85rem 2rem', margin: 0, borderRadius: '50px' }}
        >
          {isSaving ? 'Saving…' : 'Save Hero Settings'}
        </button>
        {message && (
          <span style={{ color: message.includes('Error') ? '#C62828' : '#1B5E20', fontSize: '0.9rem', fontWeight: 500 }}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
