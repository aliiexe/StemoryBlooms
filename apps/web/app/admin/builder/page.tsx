import React from 'react';
import { db, builderComponent } from '@stemory/database';
import { asc } from 'drizzle-orm';
import { AdminBuilderClient } from './AdminBuilderClient';

export default async function AdminBuilderPage() {
  const components = await db.query.builderComponent.findMany({
    orderBy: [asc(builderComponent.type), asc(builderComponent.name)],
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <AdminBuilderClient initialComponents={components} />
    </div>
  );
}
