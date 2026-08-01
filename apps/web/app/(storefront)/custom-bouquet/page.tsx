import styles from './page.module.css';
import BuilderFlow from './BuilderFlow';

export default function CustomBouquetPage() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Build Your Bouquet</h1>
        <p className={styles.subtitle}>Craft your perfect everlasting arrangement</p>
      </header>
      <BuilderFlow />
    </main>
  );
}
