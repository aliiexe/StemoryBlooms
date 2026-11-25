import {assertAdmin} from '@/lib/user-sync';
import {db,deliveryCompany,asc} from '@stemory/database';
import Link from 'next/link';
import {HeroSettingsForm} from './HeroSettingsForm';
import {CustomBuilderSettingsForm} from './CustomBuilderSettingsForm';
import StoreModeControl from './StoreModeControl';
import InventoryModeControl from './InventoryModeControl';
import CarriersManager from './CarriersManager';
import SettingsSections from './SettingsSections';
import styles from '../dashboard.module.css';
import ui from '../workspace.module.css';
export default async function AdminSettingsPage({searchParams}:{searchParams:Promise<{section?:string}>}){
 await assertAdmin();const [{section},settings,companies]=await Promise.all([searchParams,db.query.siteSettings.findFirst(),db.select().from(deliveryCompany).orderBy(asc(deliveryCompany.name))]);
 const config=settings?.config&&typeof settings.config==='object'?settings.config as Record<string,unknown>:{};const images=Array.isArray(config.heroImages)?config.heroImages.filter((value):value is string=>typeof value==='string'):['/hero-bouquet.png'];
 return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Settings</h1><p>Set how your store sells, presents products, and handles deliveries.</p></div><Link className={ui.secondary} href="/admin/content">Website text</Link></header><SettingsSections initial={section||'selling'} sections={[
 {id:'selling',label:'Selling & availability',content:<><StoreModeControl key={settings?.mode||'WAITLIST'} current={settings?.mode||'WAITLIST'}/><InventoryModeControl key={String(config.inventoryTrackingEnabled!==false)} enabled={config.inventoryTrackingEnabled!==false}/></>},
 {id:'builder',label:'Bouquet pricing',content:<CustomBuilderSettingsForm initialBaseFee={typeof config.customBouquetBaseFee==='number'?config.customBouquetBaseFee:19}/>},
 {id:'appearance',label:'Website images',content:<HeroSettingsForm initialImages={images} initialFadeSpeed={typeof config.heroFadeSpeed==='number'?config.heroFadeSpeed:5}/>},
 {id:'delivery',label:'Delivery carriers',content:<><div className={ui.notice}>City prices are managed separately. <Link href="/admin/deliveries/zones">Look up or edit a city price</Link></div><CarriersManager companies={companies}/></>},
 {id:'notifications',label:'Notifications',content:<section className={ui.panel}><h2>Delivery of notifications</h2><p className={ui.subtle}>Check failed email attempts and reconcile uncertain carrier submissions from their dedicated queues.</p><div className={ui.actions}><Link className={ui.secondary} href="/admin/notifications">Notification jobs</Link><Link className={ui.secondary} href="/admin/deliveries?status=EXCEPTIONS">Carrier issues</Link></div></section>}
 ]}/></div>;
}
