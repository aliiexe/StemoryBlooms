"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, X, Menu, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/useCartStore';
import styles from './Header.module.css';

interface HeaderProps {
  authSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ authSlot }) => {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Zustand Cart Store
  const { items, isCartOpen, toggleCart, removeItem, updateQuantity } = useCartStore();
  
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shop', label: 'Shop' },
    { href: '/custom-bouquet', label: 'Custom Bouquet' },
    { href: '/about', label: 'About' },
    { href: '/reviews', label: 'Reviews' },
    { href: '/contact', label: 'Contact' },
  ];

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [isSearchOpen]);

  const runSearch = () => {
    const query = searchValue.trim();
    setIsSearchOpen(false);
    router.push(query ? `/shop?search=${encodeURIComponent(query)}` : '/shop');
  };

  return (
    <>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <img src="/logoSB.png" alt="Stemory Blooms" />
        </Link>

        <nav className={styles.nav}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <button className={styles.iconBtn} aria-label="Search" onClick={() => setIsSearchOpen(true)}>
            <Search size={18} strokeWidth={1.5} />
          </button>

          {authSlot || (
            <Link href="/sign-in" className={styles.iconBtn} aria-label="Account">
              <User size={18} strokeWidth={1.5} />
            </Link>
          )}

          <button className={styles.iconBtn} aria-label="Cart" onClick={() => toggleCart(true)} style={{ position: 'relative' }}>
            <ShoppingCart size={18} strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className={styles.cartBadge}>{itemCount}</span>
            )}
          </button>

          <button className={styles.hamburger} aria-label="Menu" onClick={() => setIsMobileNavOpen(true)}>
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            className={styles.searchOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              className={styles.searchModal}
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.searchModalHeader}>
                <div>
                  <p className={styles.searchEyebrow}>Search the collection</p>
                  <h2 className={styles.searchTitle}>Find bouquets, gifts, or custom pieces</h2>
                </div>
                <button className={styles.searchCloseBtn} onClick={() => setIsSearchOpen(false)} aria-label="Close search">
                  <X size={18} />
                </button>
              </div>

              <div className={styles.searchFieldWrap}>
                <Search size={18} className={styles.searchFieldIcon} />
                <input
                  ref={searchInputRef}
                  className={styles.searchInput}
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      runSearch();
                    }
                  }}
                  placeholder="Search for roses, custom bouquets, best sellers..."
                  aria-label="Search products"
                />
              </div>

              <div className={styles.searchActions}>
                <button className={styles.searchPrimaryBtn} onClick={runSearch}>
                  Search
                </button>
                <button className={styles.searchSecondaryBtn} onClick={() => { setSearchValue(''); setIsSearchOpen(false); router.push('/shop'); }}>
                  Browse all
                </button>
              </div>

              <p className={styles.searchHint}>
                Tip: search by occasion, color, or bouquet type.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation */}
      <div className={`${styles.mobileNav} ${isMobileNavOpen ? styles.open : ''}`}>
        <div className={styles.mobileNavHeader}>
          <Link href="/" className={styles.logo}>
            <img src="/logoSB.png" alt="Stemory Blooms" />
          </Link>
          <button className={styles.iconBtn} onClick={() => setIsMobileNavOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <div className={styles.mobileNavLinks}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setIsMobileNavOpen(false)}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              className={styles.overlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => toggleCart(false)}
            />
            <motion.div
              className={styles.cartDrawer}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            >
              <div className={styles.cartHeader}>
                <h2>Your Bag</h2>
                <button className={styles.iconBtn} onClick={() => toggleCart(false)}>
                  <X size={22} />
                </button>
              </div>
              
              {items.length === 0 ? (
                <div className={styles.cartEmpty}>
                  <ShoppingCart size={40} strokeWidth={1} style={{ opacity: 0.4 }} />
                  <p>Your bag is empty.</p>
                  <a href="/shop" className={styles.cartCta} onClick={() => toggleCart(false)}>
                    Shop Bouquets
                  </a>
                </div>
              ) : (
                <>
                  <div className={styles.cartItems}>
                    {items.map(item => (
                      <div key={item.id} className={styles.cartItem}>
                        <div className={styles.cartItemImage}>
                           <img src={item.imageUrl || '/hero-bouquet.png'} alt={item.name} />
                        </div>
                        <div className={styles.cartItemDetails}>
                          <div className={styles.cartItemHeader}>
                            <h4>{item.name}</h4>
                            <button onClick={() => removeItem(item.id)} className={styles.removeBtn}>
                              <X size={14} />
                            </button>
                          </div>
                          <p className={styles.cartItemPrice}>{item.price} MAD</p>
                          <div className={styles.quantityControl}>
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className={styles.cartFooter}>
                    <div className={styles.cartSubtotal}>
                      <span>Subtotal</span>
                      <span>{subtotal} MAD</span>
                    </div>
                    <p className={styles.shippingNotice}>Shipping & taxes calculated at checkout</p>
                    <a 
                      href="/checkout"
                      className={styles.checkoutBtn}
                      onClick={() => {
                        // Let the native anchor navigation happen
                        // Just close the cart UI
                        toggleCart(false);
                      }}
                      style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
                    >
                      Checkout
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
