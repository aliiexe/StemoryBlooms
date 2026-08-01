"use client";

import React from 'react';
import styles from './ProductCard.module.css';
import { useCartStore } from '../store/useCartStore';

interface ProductCardProps {
  title: string;
  price: number;
  id?: string;
  imageUrl?: string;
}

export function ProductCard({ title, price, id, imageUrl }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: id || `prod-${Math.random().toString(36).substr(2, 9)}`,
      name: title,
      price: price,
      imageUrl: imageUrl || "/hero-bouquet.png",
      quantity: 1
    });
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageWrap}>
        <img src={imageUrl || "/hero-bouquet.png"} alt={title} />
      </div>
      <div className={styles.info}>
        <h4 className={styles.title}>{title}</h4>
        <div className={styles.bottomRow}>
          <span className={styles.price}>From {price} MAD</span>
          <button className={styles.viewBtn} onClick={handleAddToCart}>+ Add</button>
        </div>
      </div>
    </div>
  );
}
