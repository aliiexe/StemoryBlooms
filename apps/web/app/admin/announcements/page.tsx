import {assertAdmin} from '@/lib/user-sync';
import {db,eq,announcement,announcementTemplate,asc,desc} from '@stemory/database';
import Link from 'next/link';
import {Plus,Settings2} from 'lucide-react';
import AnnouncementList from './AnnouncementList';
import styles from '../dashboard.module.css';
import ui from '../workspace.module.css';
export default async function Page(){
 await assertAdmin();const [entries,settings,templates]=await Promise.all([db.query.announcement.findMany({orderBy:[asc(announcement.order),desc(announcement.createdAt)]}),db.query.announcementBarSettings.findFirst(),db.query.announcementTemplate.findMany({where:eq(announcementTemplate.active,true)})]);
 return <div className={styles.dashboard}><header className={styles.pageHeader}><div><h1 className={styles.pageTitle}>Announcements</h1><p>Short messages shown at the top of your store.</p></div><div className={ui.actions}><Link className={ui.secondary} href="/admin/announcements/settings"><Settings2 size={15}/>Bar settings</Link><Link className={ui.primary} href="/admin/announcements/new"><Plus size={16}/>Create announcement</Link></div></header><div className={ui.notice}>The announcement bar is {settings?.enabled?'enabled':'off'}. <Link href="/admin/announcements/settings">Manage visibility</Link></div><AnnouncementList entries={entries.map(row=>({id:row.id,internalTitle:row.internalTitle,message:row.message,status:row.status,startAt:row.startAt?.toISOString()||null,endAt:row.endAt?.toISOString()||null,noEndDate:row.noEndDate,backgroundColor:row.backgroundColor}))}/>{templates.length>0&&<details className={ui.panel}><summary style={{cursor:'pointer',color:'#64794f'}}>Start from a template</summary><div className={ui.rateGrid} style={{marginTop:20}}>{templates.map(row=><Link key={row.id} href={`/admin/announcements/new?templateId=${row.id}`} className={ui.rate} style={{textDecoration:'none'}}><strong>{row.name}</strong><p>{row.description}</p></Link>)}</div></details>}</div>;
}
