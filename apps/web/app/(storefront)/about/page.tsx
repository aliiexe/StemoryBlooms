import Image from 'next/image';
import styles from './page.module.css';

export default function AboutPage() {
  return (
    <main className={styles.container}>
      <div className={styles.splitLayout}>
        <div className={styles.imageWrapper}>
          <Image
            src="/hero-bouquet.png"
            alt="Handcrafted bouquet"
            fill
            className={styles.image}
            priority
          />
        </div>
        <div className={styles.content}>
          <h1 className={styles.title}>Our Story</h1>
          <p className={styles.description}>
            Born from a passion for timeless beauty, Stemory Blooms is a luxury handcrafted 
            floral studio based in the heart of Morocco. We specialize in creating exquisite, 
            everlasting pipe-cleaner flowers that capture the delicate essence of nature.
          </p>
          <p className={styles.description}>
            Each bloom is meticulously shaped by hand, transforming simple materials into 
            stunning botanical art pieces. Whether for an unforgettable gift, an elegant 
            home centerpiece, or a custom event arrangement, our creations are designed to 
            bring joy that never fades.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>100%</span>
              <span className={styles.statLabel}>Handcrafted</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>Everlasting</span>
              <span className={styles.statLabel}>Beauty</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
