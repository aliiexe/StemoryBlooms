"use client";

import React from 'react';
import styles from './ProductCard.module.css';
import { useCartStore } from '../store/useCartStore';

interface ProductCardProps {
  title: string;
  price: number;
  salePrice?: number | null;
  id?: string;
  imageUrl?: string;
  images?: string[] | null;
}

import Link from 'next/link';

export function ProductCard({ title, price, salePrice, id, imageUrl, images }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // prevent navigation if clicking "Add"
    addItem({
      id: id || `prod-${Math.random().toString(36).substr(2, 9)}`,
      name: title,
      price: salePrice || price,
      imageUrl: imageUrl || (images && images[0]) || "/hero-bouquet.png",
      quantity: 1
    });
  };

  const primaryImage = imageUrl || (images && images[0]) || "/hero-bouquet.png";
  const hoverImage = images && images.length > 1 ? images[1] : null;

  const cardContent = (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={primaryImage} alt={title} className={styles.primaryImg} />
        {hoverImage && (
          <img src={hoverImage} alt={`${title} hover`} className={styles.hoverImg} />
        )}
      </div>
      <div className={styles.info}>
        <h4 className={styles.title}>{title}</h4>
        <div className={styles.bottomRow}>
          <span className={styles.price} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {salePrice ? (
              <>
                <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{salePrice} MAD</span>
                <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '0.8em' }}>{price} MAD</span>
              </>
            ) : (
              <span style={{ fontWeight: 'bold', fontSize: '1.2em' }}>{price} MAD</span>
            )}
          </span>
          <button className={styles.viewBtn} onClick={handleAddToCart}>+ Add</button>
        </div>
      </div>
    </div>
  );

  if (id) {
    return <Link href={`/shop/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{cardContent}</Link>;
  }

  return cardContent;
}
