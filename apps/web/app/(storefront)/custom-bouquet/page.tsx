import { db, builderComponent, eq } from '@stemory/database';
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
  const [components, settings] = await Promise.all([
    db.query.builderComponent.findMany({
      where: eq(builderComponent.isAvailable, true)
    }),
    db.query.siteSettings.findFirst(),
  ]);

  const config = settings?.config as Record<string, any> | null;
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
    imageUrl: c.imageUrl
  });

  const itemsData: Record<string, ReturnType<typeof mapItem>[]> = {};
  for (const section of enabledSections) {
    const type = SECTION_TO_TYPE[section];
    itemsData[section] = components.filter((c: Component) => c.type === type).map(mapItem);
  }

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
        <BuilderFlow initialData={itemsData} enabledSteps={enabledSections} />
      )}
    </main>
  );
}
