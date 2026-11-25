import styles from './page.module.css';
import {ProductCard} from '@stemory/ui';
import Link from 'next/link';
import {browseCatalog,catalogFilters} from '@/lib/commerce/catalog';
import CatalogFilters from './CatalogFilters';
export const dynamic='force-dynamic';
export const metadata={title:'Shop handcrafted arrangements',description:'Explore our handmade everlasting arrangements. Browse by category, availability, and price.',alternates:{canonical:'/shop'}};
export default async function ShopPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const input=await searchParams;let filters;
  try{filters=catalogFilters(input);}catch(error){return <main className={styles.shopContainer}><h1 className={styles.shopTitle}>The Collection</h1><p role="alert">{error instanceof Error?error.message:'Check the collection filters.'}</p><Link href="/shop">Reset filters</Link></main>;}
  // Let the route error boundary show service failures; an outage is not an empty catalog.
  const {items,count,categories,trackInventory}=await browseCatalog(filters);const pages=Math.max(1,Math.ceil(count/12));
  const url=(page:number)=>`/shop?${new URLSearchParams(Object.entries({...filters,page}).filter(([,value])=>value!==undefined).map(([key,value])=>[key,String(value)]))}`;
  const filtered=Boolean(filters.search||filters.category||filters.min!==undefined||filters.max!==undefined||filters.availability!=='ALL');
  return <main className={styles.shopContainer}><header className={styles.shopHeader}><h1 className={styles.shopTitle}>The Collection</h1><p className={styles.shopSubtitle}>Handcrafted everlasting arrangements, made in Morocco.</p></header>
    <CatalogFilters key={JSON.stringify(filters)} filters={filters} categories={categories}/><div className={styles.results}><p role="status">{count} {count===1?'arrangement':'arrangements'}{filters.search?` matching “${filters.search}”`:''}</p>{filtered&&<Link href="/shop">Clear filters</Link>}</div>
    {items.length?<div className={styles.productGrid}>{items.map(item=><ProductCard trackInventory={trackInventory} key={item.id} id={item.id} title={item.name} price={item.basePrice} salePrice={item.isSaleEnabled?item.salePrice:null} stock={item.stock} isAvailable={item.isAvailable} imageUrl={item.imageUrl||'/hero-bouquet.png'}/>)}</div>:<div className={styles.emptyState}><h2 className={styles.emptyTitle}>{filtered?'No arrangements match these filters':'Our collection is being prepared'}</h2><p className={styles.emptyDesc}>{filtered?'Try a different price range, category, or search. You can also build a custom bouquet.':'Please check back soon or contact us about a custom arrangement.'}</p><Link href={filtered?'/shop':'/contact'}>{filtered?'Reset filters':'Contact us'}</Link> · <Link href="/custom-bouquet">Build a bouquet</Link></div>}
    <nav aria-label="Collection pages" className={styles.results}>{filters.page>1&&<Link href={url(filters.page-1)}>Previous</Link>}<span>Page {filters.page} of {pages}</span>{filters.page<pages&&<Link href={url(filters.page+1)}>Next</Link>}</nav></main>;
}
