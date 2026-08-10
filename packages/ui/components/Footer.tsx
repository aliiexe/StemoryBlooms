import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div className={styles.brand}>
            <img src="/logoSB.png" alt="Stemory Blooms" />
            <p>Artisanal pipe-cleaner flowers that never wilt. Handcrafted with love in Morocco for the perfect timeless gift.</p>
          </div>

          <div>
            <h4 className={styles.colTitle}>Shop</h4>
            <ul className={styles.colLinks}>
              <li><Link href="/shop">All Bouquets</Link></li>
              <li><Link href="/custom-bouquet">Custom Bouquet</Link></li>
              <li><Link href="/shop">Best Sellers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Company</h4>
            <ul className={styles.colLinks}>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/reviews">Reviews</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Support</h4>
            <ul className={styles.colLinks}>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/shipping">Shipping</Link></li>
              <li><Link href="/returns">Returns</Link></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Stemory Blooms. All rights reserved.</span>
          <div className={styles.socials}>
            <a href="https://instagram.com/stemory.blooms" aria-label="Instagram">Instagram</a>
            <a href="https://tiktok.com/@stemory.blooms" aria-label="TikTok">TikTok</a>
            <a href="#" aria-label="WhatsApp">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
