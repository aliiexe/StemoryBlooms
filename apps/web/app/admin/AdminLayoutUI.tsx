'use client';
import ContextLink from '@/components/navigation/ContextLink';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Users, Package, FileText, ClipboardList, Truck, Image as ImageIcon, BarChart2, Settings, Bell, Store, Calculator, Menu, X, PanelLeftClose, PanelLeftOpen, Plus, MapPin } from 'lucide-react';
import ListLink from '@/components/navigation/ListLink';
import { AdminUserSlot } from './AdminUserSlot';
import { AdminNotifications } from './AdminNotifications';
import styles from './admin.module.css';
const groups = [
  { title: 'Workspace', links: [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard }, { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/custom-orders', label: 'Drafts', icon: FileText }, { href: '/admin/deliveries', label: 'Delivery & pickup', icon: Truck },
    { href: '/admin/deliveries/zones', label: 'City delivery prices', icon: MapPin }, { href: '/admin/customers', label: 'Customers', icon: Users } ] },
  { title: 'Products & money', links: [ { href: '/admin/products', label: 'Products', icon: Package }, { href: '/admin/builder', label: 'Bouquet builder', icon: ImageIcon },
    { href: '/admin/finances', label: 'Money & expenses', icon: FileText }, { href: '/admin/reports', label: 'Reports', icon: BarChart2 } ] },
  { title: 'Stock tools · optional', secondary: true, links: [ { href: '/admin/inventory', label: 'Materials', icon: ClipboardList }, { href: '/admin/production', label: 'Production', icon: Package },
    { href: '/admin/inventory/movements', label: 'Stock history', icon: ClipboardList }, { href: '/admin/suppliers', label: 'Suppliers', icon: Truck }, { href: '/admin/price-helper', label: 'Price calculator', icon: Calculator } ] },
  { title: 'Website & settings', secondary: true, links: [ { href: '/admin/content', label: 'Website content', icon: ImageIcon }, { href: '/admin/categories', label: 'Categories', icon: Package },
    { href: '/admin/announcements', label: 'Announcements', icon: Bell }, { href: '/admin/messages', label: 'Messages', icon: FileText }, { href: '/admin/reviews', label: 'Reviews', icon: Bell },
    { href: '/admin/waitlist', label: 'Subscribers', icon: Users }, { href: '/admin/notifications', label: 'Notifications', icon: FileText }, { href: '/admin/users', label: 'Staff access', icon: Users }, { href: '/admin/settings', label: 'Settings', icon: Settings } ] },
];
const subscribe = (callback: () => void) => { window.addEventListener('stemory-sidebar', callback); window.addEventListener('storage', callback); return () => { window.removeEventListener('stemory-sidebar', callback); window.removeEventListener('storage', callback); }; };
const snapshot = () => { try { return localStorage.getItem('stemory-sidebar-collapsed') === '1'; } catch { return false; } };
export default function AdminLayoutUI({ children, currentMode = 'LIVE' }: { children: React.ReactNode; currentMode?: 'LIVE' | 'WAITLIST' | 'MAINTENANCE' | 'DRAFT' }) {
  const pathname = usePathname(); const menu = useRef<HTMLDialogElement>(null);
  const collapsed = useSyncExternalStore(subscribe, snapshot, () => false);
  const links = groups.flatMap(group => group.links);
  const current = [...links].sort((a, b) => b.href.length - a.href.length).find(link => pathname === link.href || (link.href !== '/admin' && pathname.startsWith(`${link.href}/`)));
  const title = pathname === '/admin/orders/new' ? 'Create order' : /^\/admin\/orders\/[^/]+$/.test(pathname) ? 'Order details' : current?.label || 'Workspace';
  useEffect(() => { menu.current?.close(); }, [pathname]);
  function toggleSidebar() { try { localStorage.setItem('stemory-sidebar-collapsed', collapsed ? '0' : '1'); window.dispatchEvent(new Event('stemory-sidebar')); } catch { /* Storage can be disabled. */ } }
  const navigation = <nav aria-label="Admin navigation" className={styles.sidebarNav}>{groups.map(group => {
    const groupLinks = group.links.map(link => { const Icon = link.icon; return <ListLink key={link.href} href={link.href} title={link.label} aria-current={current?.href === link.href ? 'page' : undefined} className={`${styles.navLink} ${current?.href === link.href ? styles.navLinkActive : ''}`} onClick={() => menu.current?.close()}><Icon size={18} aria-hidden="true" /><span>{link.label}</span></ListLink>; });
    return group.secondary && !collapsed ? <details key={group.title} className={styles.navSection} open={group.links.some(link => link.href === current?.href)}><summary>{group.title}</summary>{groupLinks}</details> : <section key={group.title} className={styles.navSection}><h2 className={styles.navHeading}>{group.title}</h2>{groupLinks}</section>;
  })}</nav>;
  return <div className={`${styles.wrapper} ${collapsed ? styles.collapsed : ''}`}><a href="#workspace-main" className={styles.skipLink}>Skip to content</a><aside className={styles.sidebar} aria-label="Workspace sidebar"><div className={styles.sidebarLogo}><Link href="/admin"><span className={styles.brandLogo}><img src="/logoSB.png" alt="Stemory Blooms" width="210" height="64" /></span></Link></div><ContextLink href="/admin/orders/new" className={styles.createOrder} title="Create order"><Plus size={18} /><span>Create order</span></ContextLink>{navigation}<div className={styles.sidebarFooter}><Link href="/" className={styles.backToStoreBtn} title="View storefront"><Store size={18} /><span>View storefront</span></Link><button type="button" className={styles.collapseButton} onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}<span>Collapse sidebar</span></button></div></aside><div className={styles.mainArea}><header className={styles.topBar}><div className={styles.breadcrumb}><button type="button" className={styles.mobileMenuTrigger} aria-label="Open navigation" onClick={() => menu.current?.showModal()}><Menu size={20} /></button><Link href="/admin">Workspace</Link><span>/</span><strong>{title}</strong></div><div className={styles.topBarRight}><Link className={styles.modeIndicator} href="/admin/settings">{currentMode === 'LIVE' ? 'Store live' : currentMode === 'WAITLIST' ? 'Waitlist' : currentMode === 'DRAFT' ? 'Draft' : 'Maintenance'}</Link><AdminNotifications /><AdminUserSlot /></div></header><main id="workspace-main" className={styles.content}>{children}</main></div><nav className={styles.mobileBar} aria-label="Quick admin navigation">{[{ href: '/admin', label: 'Overview', icon: LayoutDashboard }, { href: '/admin/orders', label: 'Orders', icon: ShoppingBag }, { href: '/admin/orders/new', label: 'Create', icon: Plus }].map(link => { const NavigationLink=link.href==='/admin/orders/new'?ContextLink:ListLink; return <NavigationLink key={link.href} href={link.href} className={styles.mobileBarLink}><link.icon size={20} />{link.label}</NavigationLink>; })}<button className={styles.mobileMenuButton} type="button" onClick={() => menu.current?.showModal()} aria-haspopup="dialog"><Menu size={20} />More</button></nav><dialog ref={menu} className={styles.mobileMenu} aria-label="All workspace sections"><div className={styles.menuHeader}><img src="/logoSB.png" alt="Stemory Blooms" width="180" height="55" /><button type="button" onClick={() => menu.current?.close()} aria-label="Close navigation"><X size={22} /></button></div>{navigation}</dialog></div>;
}
