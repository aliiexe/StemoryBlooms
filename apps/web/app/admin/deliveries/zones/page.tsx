import { assertAdmin } from '@/lib/user-sync';
import { db, deliveryZone, asc } from '@stemory/database';
import CityRates from './CityRates';
export default async function DeliveryZonesPage() {
  await assertAdmin();
  const zones = await db.select().from(deliveryZone).orderBy(asc(deliveryZone.name));
  return <CityRates zones={zones.map(zone => ({ id: zone.id, name: zone.name, fee: zone.fee, deliveryTime: zone.deliveryTime, isActive: zone.isActive, updatedAt: zone.updatedAt.toISOString() }))} />;
}
