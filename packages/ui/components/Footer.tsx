import React from 'react';
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
              <li><a href="/shop">All Bouquets</a></li>
              <li><a href="/custom-bouquet">Custom Bouquet</a></li>
              <li><a href="/shop">Best Sellers</a></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Company</h4>
            <ul className={styles.colLinks}>
              <li><a href="/about">About Us</a></li>
              <li><a href="/reviews">Reviews</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className={styles.colTitle}>Support</h4>
            <ul className={styles.colLinks}>
              <li><a href="/contact">FAQ</a></li>
              <li><a href="/contact">Shipping</a></li>
              <li><a href="/contact">Returns</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span>© {new Date().getFullYear()} Stemory Blooms. All rights reserved.</span>
          <div className={styles.socials}>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="TikTok">TikTok</a>
            <a href="#" aria-label="WhatsApp">WhatsApp</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
