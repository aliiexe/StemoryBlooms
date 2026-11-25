import { db, builderComponent, eq, and, sql } from '@stemory/database';
import styles from './page.module.css';
import BuilderFlow from './BuilderFlow';

const ALL_SECTIONS = ['Flowers', 'Leaves', 'Animals or Bugs', 'Wrapping', 'Cards'] as const;
const SECTION_TO_TYPE: Record<string, string> = {
  'Flowers': 'FLOWER',
  'Leaves': 'LEAF',
  'Animals or Bugs': 'ANIMAL_BUG',
  'Wrapping': 'WRAPPING',
  'Cards': 'CARD',
};

export default async function CustomBouquetPage() {
  const settings = await db.query.siteSettings.findFirst();
  const config = settings?.config as { builderSections?: Record<string, boolean>; customBouquetBaseFee?: number; inventoryTrackingEnabled?:boolean } | null;
  const trackInventory=config?.inventoryTrackingEnabled!==false;
  const components=await db.query.builderComponent.findMany({where:and(eq(builderComponent.isAvailable,true),trackInventory?sql`${builderComponent.stock} >= GREATEST(1, ${builderComponent.minQuantity})`:undefined)});
  const builderSections: Record<string, boolean> = config?.builderSections ?? {};

  // Determine which steps are enabled (default: all enabled if no config)
  const enabledSections = ALL_SECTIONS.filter(section => {
    // If config doesn't mention this section, default to true
    if (typeof builderSections[section] === 'undefined') return true;
    return builderSections[section] === true;
  });

  type Component = (typeof components)[number];

  const mapItem = (c: Component) => ({
    id: c.id,
    name: c.name,
    price: c.unitPrice,
    imageUrl: c.imageUrl,
    minQuantity: c.minQuantity,stock:trackInventory?c.stock:100,
    maxQuantity: Math.min(c.maxQuantity ?? 100, trackInventory?c.stock:100, 100)
  });

  const itemsData: Record<string, ReturnType<typeof mapItem>[]> = {};
  for (const section of enabledSections) {
    const type = SECTION_TO_TYPE[section];
    itemsData[section] = components.filter((c: Component) => c.type === type).map((c: Component) => {
      const item = mapItem(c);
      if (section === 'Wrapping' || section === 'Cards') {
        item.price = 0;
      }
      return item;
    });
  }

  const baseFee = (config?.customBouquetBaseFee as number) ?? 19;

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
            Custom bouquet choices are not available at the moment. Please contact us to arrange a bouquet, or explore the collection.
          </p>
        </div>
      ) : (
        <BuilderFlow initialData={itemsData} enabledSteps={enabledSections} baseFee={baseFee} />
      )}
    </main>
  );
}
