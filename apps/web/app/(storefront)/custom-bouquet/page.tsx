import { db, builderComponent, eq } from '@stemory/database';
import styles from './page.module.css';
import BuilderFlow from './BuilderFlow';



export default async function CustomBouquetPage() {
  const components = await db.query.builderComponent.findMany({
    where: eq(builderComponent.isAvailable, true)
  });

  // Group by type
  type Component = (typeof components)[number];
  
  const mapItem = (c: Component) => ({ 
    id: c.id, 
    name: c.name, 
    price: c.unitPrice,
    imageUrl: c.imageUrl 
  });

  const itemsData = {
    'Flowers': components.filter((c: Component) => c.type === 'FLOWER').map(mapItem),
    'Leaves': components.filter((c: Component) => c.type === 'LEAF').map(mapItem),
    'Animals or Bugs': components.filter((c: Component) => c.type === 'ANIMAL_BUG').map(mapItem),
    'Wrapping': components.filter((c: Component) => c.type === 'WRAPPING').map(mapItem),
    'Cards': components.filter((c: Component) => c.type === 'CARD').map(mapItem)
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Build Your Bouquet</h1>
        <p className={styles.subtitle}>Craft your perfect everlasting arrangement</p>
      </header>
      
      {components.length === 0 ? (
        <div style={{ padding: '6rem 2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-editorial)', fontSize: '2rem', color: '#3A3531', marginBottom: '1rem' }}>
            Custom Builder Unavailable
          </h2>
          <p style={{ color: '#7A7571', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            We are currently restocking our supply of raw materials for custom arrangements. 
            The builder will be back online as soon as our master florists restock!
          </p>
        </div>
      ) : (
        <BuilderFlow initialData={itemsData} />
      )}
    </main>
  );
}
