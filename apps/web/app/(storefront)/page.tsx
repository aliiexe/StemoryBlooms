"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ProductCard } from "@stemory/ui";
import styles from "./page.module.css";

const products = [
  { id: "1", title: "Classic Lavender Bunch", price: 150, imageUrl: "/products/lavender.png" },
  { id: "2", title: "Signature Pink Tulip", price: 200, imageUrl: "/products/pink-tulip.png" },
  { id: "3", title: "Sunshine Daisy Mix", price: 180, imageUrl: "/products/daisy.png" },
  { id: "4", title: "Mini Rose Bouquet", price: 120, imageUrl: "/products/mini-rose.png" },
];

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

export default function HomePage() {
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
            <Link href="/custom" className={styles.secondaryButton}>Custom Order</Link>
          </div>
        </motion.div>
        
        <motion.div 
          className={styles.heroImageWrapper}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className={styles.imageContainer}>
            <Image 
              src="/hero-bouquet.png"
              alt="Luxury Handcrafted Pipe Cleaner Bouquet"
              fill
              className={styles.heroImage}
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

      {/* FEATURED COLLECTION */}
      <section className={styles.featured}>
        <div className={styles.featuredHeader}>
          <h2 className={styles.featuredTitle}>Latest Creations</h2>
          <Link href="/shop" className={styles.viewAllLink}>View All &rarr;</Link>
        </div>
        
        <motion.div 
          className={styles.productGrid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          {products.map((product) => (
            <motion.div key={product.id} variants={fadeInUp}>
              <ProductCard 
                id={product.id}
                title={product.title}
                price={product.price}
                imageUrl={product.imageUrl}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
