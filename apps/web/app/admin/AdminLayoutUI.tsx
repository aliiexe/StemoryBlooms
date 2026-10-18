"use client";

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Users, Package, FileText, ClipboardList, Truck, Image as ImageIcon,
  BarChart2, Settings, Bell, Store, Calculator, Menu, X } from 'lucide-react';
import { AdminUserSlot } from './AdminUserSlot';
import { AdminNotifications } from './AdminNotifications';
import styles from './admin.module.css';

const sidebarSections = [
  {
    title: 'Store',
    links: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/orders/new', label: 'New Assisted Order', icon: ShoppingBag },
      { href: '/admin/custom-orders', label: 'Custom Orders', icon: FileText },
      { href: '/admin/deliveries', label: 'Deliveries', icon: Truck },
    ],
  },
  {
    title: 'Catalog',
    links: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: Package },
      { href: '/admin/builder', label: 'Custom Builder', icon: Package },
      { href: '/admin/inventory', label: 'Inventory & Materials', icon: ClipboardList },
      { href: '/admin/suppliers', label: 'Suppliers', icon: Truck },
    ],
  },
  {
    title: 'Operations',
    links: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/users', label: 'User Management', icon: Users },
      { href: '/admin/finances', label: 'Finances', icon: FileText },
    ],
  },
  {
    title: 'Tools',
    links: [
      { href: '/admin/price-helper', label: 'Price Helper', icon: Calculator },
      { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
    ],
  },
  {
    title: 'Marketing & App',
    links: [
      { href: '/admin/content', label: 'Marketing', icon: ImageIcon },
      { href: '/admin/announcements', label: 'Announcements', icon: Bell },
      { href: '/admin/messages', label: 'Messages', icon: FileText },
      { href: '/admin/reviews', label: 'Review moderation', icon: Bell },
      { href: '/admin/waitlist', label: 'Waitlist', icon: Users },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];


export default function AdminLayoutUI({ children, currentMode = 'LIVE' }: { children: React.ReactNode; currentMode?: 'LIVE' | 'WAITLIST' | 'MAINTENANCE' | 'DRAFT' }) {
  const pathname = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const links = sidebarSections.flatMap(section => section.links);
  const current = [...links].sort((a,b) => b.href.length - a.href.length).find(link => pathname === link.href || (link.href !== '/admin' && pathname.startsWith(`${link.href}/`)));
  const title = pathname === '/admin' ? 'Dashboard' : pathname.match(/^\/admin\/orders\/[^/]+$/) && !pathname.endsWith('/new') ? 'Order details' : current?.label || 'Admin';
  useEffect(() => { menu.current?.close(); }, [pathname]);
  const navigation = <nav aria-label="Admin navigation" className={styles.sidebarNav}>
    {sidebarSections.map(section => <section key={section.title} className={styles.navSection}>
      <h2 className={styles.navHeading}>{section.title}</h2>
      {section.links.map(link => { const Icon = link.icon; const active = current?.href === link.href;
        return <Link key={link.href} href={link.href} aria-current={active ? 'page' : undefined}
          className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`} onClick={() => menu.current?.close()}><Icon size={18} aria-hidden="true" /><span>{link.label}</span></Link>;
      })}
    </section>)}
  </nav>;
  return <div className={styles.wrapper}>
    <aside className={styles.sidebar}>
      <div className={styles.sidebarLogo}><Link href="/admin"><Image src="/logoSB.png" alt="Stemory Blooms admin" width={144} height={40} priority /></Link></div>
      {navigation}
      <Link href="/" className={styles.backToStoreBtn}><Store size={18} aria-hidden="true" />Back to store</Link>
    </aside>
    <div className={styles.mainArea}>
      <header className={styles.topBar}>
        <div><Link href="/admin" className={styles.topBarEyebrow}>Stemory Blooms</Link><p className={styles.pageTitle}>{title}</p></div>
        <div className={styles.topBarRight}><Link className={styles.modeIndicator} href="/admin/settings">{currentMode === 'LIVE' ? 'Store live' : currentMode === 'DRAFT' ? 'Draft mode' : currentMode === 'WAITLIST' ? 'Waitlist mode' : 'Maintenance'}</Link><AdminNotifications /><AdminUserSlot /></div>
      </header>
      <main className={styles.content}>{children}</main>
    </div>
    <nav className={styles.mobileBar} aria-label="Quick admin navigation">
      <Link href="/admin" className={styles.mobileBarLink}><LayoutDashboard size={20} aria-hidden="true" />Overview</Link>
      <Link href="/admin/orders" className={styles.mobileBarLink}><ShoppingBag size={20} aria-hidden="true" />Orders</Link>
      <Link href="/admin/inventory" className={styles.mobileBarLink}><ClipboardList size={20} aria-hidden="true" />Inventory</Link>
      <button className={styles.mobileMenuButton} type="button" onClick={() => menu.current?.showModal()} aria-haspopup="dialog"><Menu size={20} aria-hidden="true" />Menu</button>
    </nav>
    <dialog ref={menu} className={styles.mobileMenu} aria-label="All admin sections">
      <div className={styles.menuHeader}><strong>Admin menu</strong><button type="button" onClick={() => menu.current?.close()} aria-label="Close admin menu"><X size={24} /></button></div>
      {navigation}<Link href="/" className={styles.backToStoreBtn}>Back to store</Link>
    </dialog>
  </div>;
}
