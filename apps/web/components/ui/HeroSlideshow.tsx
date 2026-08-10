'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeroSlideshowProps {
  images: string[];
  fadeSpeedSeconds?: number;
  priority?: boolean;
}

export function HeroSlideshow({ images, fadeSpeedSeconds = 5, priority = true }: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, fadeSpeedSeconds * 1000);

    return () => clearInterval(interval);
  }, [images, fadeSpeedSeconds]);

  if (!images || images.length === 0) {
    return (
      <Image 
        src="/hero-bouquet.png" 
        alt="Stemory Blooms hero" 
        fill 
        style={{ objectFit: 'cover' }} 
        priority={priority}
      />
    );
  }

  if (images.length === 1) {
    return (
      <Image 
        src={images[0]} 
        alt="Stemory Blooms hero" 
        fill 
        style={{ objectFit: 'cover' }} 
        priority={priority}
      />
    );
  }

  return (
    <>
      {images.map((img, index) => (
        <Image
          key={img}
          src={img}
          alt={`Hero image ${index + 1}`}
          fill
          style={{
            objectFit: 'cover',
            opacity: index === currentIndex ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            position: 'absolute',
            inset: 0
          }}
          priority={priority && index === 0}
        />
      ))}
    </>
  );
}
