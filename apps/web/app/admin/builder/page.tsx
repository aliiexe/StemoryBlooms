import { assertAdmin } from '@/lib/user-sync';
import React from 'react';
import { db, builderComponent, material } from '@stemory/database';
import { asc } from 'drizzle-orm';
import { AdminBuilderClient } from './AdminBuilderClient';

export const dynamic = 'force-dynamic';

export default async function AdminBuilderPage({searchParams}:{searchParams:Promise<{edit?:string}>}) {
  await assertAdmin();
  const {edit} = await searchParams;
  const [components, materials, settings] = await Promise.all([
    db.query.builderComponent.findMany({
      orderBy: [asc(builderComponent.type), asc(builderComponent.name)],
    }),
    db.query.material.findMany({ orderBy: [asc(material.name)] }),
    db.query.siteSettings.findFirst(),
  ]);

  type RawComponent = (typeof components)[number];
  const typedComponents = components.map((c: RawComponent) => ({
    ...c,
    materials: c.materials as { materialId: string; quantity: number }[] | null | undefined,
  }));

  const config = settings?.config as {builderSections?:Record<string,boolean>;inventoryTrackingEnabled?:boolean} | null;
  const builderSections: Record<string, boolean> = config?.builderSections ?? {
    Flowers: true,
    Leaves: true,
    'Animals or Bugs': true,
    Wrapping: true,
    Cards: true,
  };

  return (
    <div>
      <AdminBuilderClient
        initialComponents={typedComponents}
        initialEditingId={edit}
        allMaterials={materials}
        initialSections={builderSections}
        trackInventory={config?.inventoryTrackingEnabled!==false}
      />
    </div>
  );
}
