"use client";
import Link from './ContextLink';
import styles from './ProductCard.module.css';
import { useCartStore } from '../store/useCartStore';

interface ProductCardProps {
  title: string; price: number; salePrice?: number | null; id?: string; imageUrl?: string; images?: string[] | null;
  stock?: number; isAvailable?: boolean; trackInventory?: boolean;
}
export function ProductCard({ title, price, salePrice, id, imageUrl, images, stock = 0, isAvailable = false, trackInventory = true }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem);
  const available = Boolean(id && isAvailable && (!trackInventory || stock > 0));
  const primary = imageUrl || images?.[0] || '/hero-bouquet.png';
  const photo = <div className={styles.imageWrap}><img src={primary} alt={title} className={styles.primaryImg} loading="lazy" />{images?.[1] && <img src={images[1]} alt="" className={styles.hoverImg} loading="lazy" />}</div>;
  return <article className={styles.card}>
    {id ? <Link href={`/shop/${id}`} aria-label={`View ${title}`}>{photo}</Link> : photo}
    <div className={styles.info}><h3 className={styles.title}>{id ? <Link href={`/shop/${id}`} style={{ color: 'inherit', textDecoration: 'none' }}>{title}</Link> : title}</h3>
      <div className={styles.bottomRow}><span className={styles.price}>{salePrice !== null && salePrice !== undefined ? <><strong>{salePrice} MAD</strong> <s style={{ fontSize: '0.8em' }}>{price} MAD</s></> : <strong>{price} MAD</strong>}</span>
        <button type="button" className={styles.viewBtn} disabled={!available} aria-label={available ? `Add ${title} to cart` : `${title} is out of stock`}
          onClick={() => { if (available && id) addItem({ id, productId: id, kind: 'PRODUCT', name: title, price: salePrice ?? price, quantity: 1, maxQuantity: trackInventory ? Math.min(stock, 100) : 100, imageUrl: primary }); }}>{available ? '+ Add' : 'Out of stock'}</button>
      </div>
    </div>
  </article>;
}
