'use client';

import { CustomSelect } from '@/components/ui/CustomSelect';
import type { AssistedCatalog } from '@/lib/commerce/assisted-catalog';
import type { AssistedDraftData } from '@stemory/contracts';
import styles from './assisted-order.module.css';
import Link from 'next/link';
import { Plus } from 'lucide-react';

type Configuration = NonNullable<AssistedDraftData['items'][number]['configuration']>;
export default function BouquetRecipeEditor({ value, onChange, components, number, trackInventory = true, onAddNew }: {
  value: Configuration; onChange: (value: Configuration) => void; components: AssistedCatalog['components']; number: number; trackInventory?: boolean; onAddNew: () => void;
}) {
  return <div className={styles.recipe}>
    <p className={styles.hint}>Choose the flowers for this bouquet. Packaging and a card are included in the base fee.</p>
    <CustomSelect label={`Add component to bouquet ${number}`} value="" placeholder="Search flowers, wrapping, or cards…" searchable
      options={components.map(component => ({ value: component.id, label: `${component.name}${!component.available ? ' · hidden online' : ''}${trackInventory ? ` · ${component.stock} in stock` : ''} · ${['WRAPPING', 'CARD'].includes(component.type) ? 'included' : `${component.price} MAD`}`,
        disabled: component.id in value.components || (trackInventory && component.stock < Math.max(1, component.minQuantity)) }))}
      onChange={id => { const component = components.find(entry => entry.id === id); if (component) onChange({ ...value, components: { ...value.components, [id]: Math.max(1, component.minQuantity) } }); }} />
    <button type="button" className={styles.secondaryButton} onClick={onAddNew}><Plus size={16} />New flower or item</button>
    {Object.entries(value.components).map(([id, quantity]) => {
      const component = components.find(entry => entry.id === id);
      return <div key={id} className={styles.recipeRow}>
        <div><strong>{component?.name || 'Unavailable component'}</strong><p className={styles.hint}>{component ? `${['WRAPPING', 'CARD'].includes(component.type) ? 'Included in base fee' : `${component.price} MAD each`} · ${trackInventory ? `${component.stock} in stock · ` : ''}${component.available ? component.type.toLowerCase().replaceAll('_', ' ') : 'hidden online'}` : 'Replace this selection before creating the order.'}</p>{component && !component.imageUrl && <Link href={`/admin/builder?edit=${encodeURIComponent(component.id)}`} target="_blank" rel="noopener" className={styles.hint}>Add photo & details later ↗</Link>}</div>
        <label>Per bouquet<input aria-label={`${component?.name || 'Unavailable component'} quantity in bouquet ${number}`} type="number" min={Math.max(1, component?.minQuantity || 1)} max={Math.min(100, component?.maxQuantity ?? 100)} step="1" value={quantity}
          onChange={event => onChange({ ...value, components: { ...value.components, [id]: Number(event.target.value) } })} /></label>
        <button type="button" className={styles.quietButton} aria-label={`Remove ${component?.name || 'component'} from bouquet ${number}`} onClick={() => { const remaining = { ...value.components }; delete remaining[id]; onChange({ ...value, components: remaining }); }}>Remove</button>
      </div>;
    })}
    <label>Card message for bouquet {number}<textarea maxLength={500} rows={3} value={value.cardMessage || ''} onChange={event => onChange({ ...value, cardMessage: event.target.value })} /></label>
  </div>;
}
