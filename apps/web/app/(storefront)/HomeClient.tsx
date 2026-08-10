"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProductCard } from "@stemory/ui";
import { HeroSlideshow } from "../../components/ui/HeroSlideshow";
import styles from "./page.module.css";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

type FeaturedProduct = {
  id: string;
  title: string;
  price: number;
  salePrice?: number | null;
  imageUrl: string;
};

export default function HomeClient({ 
  collectionProducts = [], 
  bestSellerProducts = [],
  heroImages = [],
  heroFadeSpeed = 5
}: { 
  collectionProducts?: FeaturedProduct[]; 
  bestSellerProducts?: FeaturedProduct[];
  heroImages?: string[];
  heroFadeSpeed?: number;
}) {
  return (
    <main className={styles.main}>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <motion.div 
          className={styles.heroContent}
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <span className={styles.tagline}>Everlasting Beauty</span>
          <h1 className={styles.mainHeading}>Handcrafted Pipe Cleaner Bouquets</h1>
          <p className={styles.subtitle}>
            Discover luxury, handmade everlasting floral arrangements. 
            Meticulously crafted in Morocco to bring eternal bloom to your space.
          </p>
          <div className={styles.heroActions}>
            <Link href="/shop" className={styles.primaryButton}>Shop Bouquets</Link>
            <Link href="/custom-bouquet" className={styles.secondaryButton}>Custom Order</Link>
          </div>
        </motion.div>
        
        <motion.div 
          className={styles.heroImageWrapper}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles.imageContainer}>
            <HeroSlideshow 
              images={heroImages} 
              fadeSpeedSeconds={heroFadeSpeed} 
              priority 
            />
          </div>
        </motion.div>
      </section>

      {/* FEATURES BAR */}
      <section className={styles.featuresBar}>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>✦</span>
          <span>Handmade with care</span>
        </div>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>✧</span>
          <span>Made to last forever</span>
        </div>
        <div className={styles.featureItem}>
          <span className={styles.featureIcon}>✦</span>
          <span>Customizable designs</span>
        </div>
      </section>

      {bestSellerProducts.length > 0 && (
        <section className={styles.bestSellers}>
          <div className={styles.bestSellersHeader}>
            <h2 className={styles.featuredTitle}>Best Sellers</h2>
            <p className={styles.sectionIntro}>The pieces people keep coming back for.</p>
          </div>

          <motion.div
            className={styles.bestSellerGrid}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {bestSellerProducts.map((product) => (
              <motion.div key={product.id} variants={fadeInUp}>
                <ProductCard
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  salePrice={product.salePrice}
                  imageUrl={product.imageUrl || '/hero-bouquet.png'}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* FEATURED COLLECTION */}
      <section className={styles.featured}>
        <div className={styles.featuredHeader}>
          <h2 className={styles.featuredTitle}>Latest Creations</h2>
          <Link href="/shop" className={styles.viewAllLink}>View All &rarr;</Link>
        </div>
        
        {collectionProducts.length > 0 ? (
          <motion.div 
            className={styles.productGrid}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {collectionProducts.map((product) => (
              <motion.div key={product.id} variants={fadeInUp}>
                <ProductCard 
                  id={product.id}
                  title={product.title}
                  price={product.price}
                  salePrice={product.salePrice}
                  imageUrl={product.imageUrl || '/hero-bouquet.png'}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', backgroundColor: '#F9F8F6', borderRadius: '12px', marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: '#5A5551', marginBottom: '0.5rem', fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              New collections coming soon
            </h3>
            <p style={{ color: '#7A7571', fontSize: '0.95rem' }}>Our artisans are currently crafting fresh designs. Check back shortly!</p>
          </div>
        )}
      </section>
    </main>
  );
}
