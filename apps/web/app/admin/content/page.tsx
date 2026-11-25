import { assertAdmin } from '@/lib/user-sync';
import { db, contentBlock, giftCard, promoCode, desc } from '@stemory/database';
import { contentDefaults, parseManagedContent, type SiteContentKey } from '@/lib/site-content';
import BenefitsManager from './BenefitsManager';
import WebsiteCopyEditor from './WebsiteCopyEditor';
import styles from '../dashboard.module.css';
import ui from '../workspace.module.css';
import Link from 'next/link';
export default async function AdminContentPage({searchParams}:{searchParams:Promise<{tab?:string}>}){
  await assertAdmin();
  const tab=(await searchParams).tab==='offers'?'offers':'pages';
  const [blocks,promos,cards]=await Promise.all([db.select().from(contentBlock),db.select().from(promoCode).orderBy(desc(promoCode.createdAt)),db.select().from(giftCard).orderBy(desc(giftCard.createdAt))]);
  const records=(Object.keys(contentDefaults) as SiteContentKey[]).map(key=>{const value=parseManagedContent(blocks.find(row=>row.key===`site.${key}`)?.content);return{key,copy:value?.draft||contentDefaults[key],revision:value?.revision||0,published:Boolean(value?.published)};});
  return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Website content</h1><p>Manage your pages, offers, and customer-facing messages.</p></div><div className={ui.actions}><Link className={ui.secondary} href="/admin/announcements">Announcements</Link><Link className={ui.secondary} href="/admin/settings?section=appearance">Website images</Link></div></header><nav className={ui.tabs} aria-label="Content sections"><Link className={ui.tab} aria-current={tab==='pages'?'page':undefined} href="/admin/content">Website pages</Link><Link className={ui.tab} aria-current={tab==='offers'?'page':undefined} href="/admin/content?tab=offers">Discounts & gift cards</Link></nav>{tab==='pages'?<WebsiteCopyEditor records={records}/>:<BenefitsManager promos={promos} cards={cards}/>}</div>;
}
