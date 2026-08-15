"use client";

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Package,
  FileText, ClipboardList, Truck, Image as ImageIcon,
  BarChart2, Settings, Bell, ChevronDown, Store,
  Radio, Clock, Wrench, ChevronUp
} from 'lucide-react';
import { AdminUserSlot } from './AdminUserSlot';
import { AdminNotifications } from './AdminNotifications';
import { setSiteMode } from './settings/actions';
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
    title: 'Marketing & App',
    links: [
      { href: '/admin/content', label: 'Marketing', icon: ImageIcon },
      { href: '/admin/announcements', label: 'Announcements', icon: Bell },
      { href: '/admin/messages', label: 'Messages', icon: FileText },
      { href: '/admin/waitlist', label: 'Waitlist', icon: Users },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function isLinkActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminLayoutUI({ children, currentMode = 'LIVE' }: { children: React.ReactNode; currentMode?: 'LIVE' | 'WAITLIST' | 'MAINTENANCE' | 'DRAFT' }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSection, setOpenSection] = useState<string | null>(() => {
    const active = sidebarSections.find((s) => s.links.some((l) => isLinkActive(pathname, l.href)));
    return active ? active.title : null;
  });
  const lastAdminPathKey = 'stemory-admin-last-path';
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [optimisticMode, setOptimisticMode] = useState(currentMode);

  const MODE_OPTIONS = [
    { value: 'LIVE', label: 'Live', icon: Radio, color: '#1B5E20', bg: '#E8F5E9' },
    { value: 'WAITLIST', label: 'Waitlist', icon: Clock, color: '#E65100', bg: '#FFF3E0' },
    { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, color: '#B71C1C', bg: '#FFEBEE' },
  ] as const;

  const activeMode = MODE_OPTIONS.find(m => m.value === optimisticMode) ?? MODE_OPTIONS[0];

  const switchMode = (mode: typeof currentMode) => {
    setOptimisticMode(mode);
    setModeMenuOpen(false);
    startTransition(async () => {
      await setSiteMode(mode);
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !pathname.startsWith('/admin')) {
      return;
    }

    window.localStorage.setItem(lastAdminPathKey, pathname);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== '/admin' || typeof window === 'undefined') {
      return;
    }

    const rememberedPath = window.localStorage.getItem(lastAdminPathKey);
    if (rememberedPath && rememberedPath.startsWith('/admin') && rememberedPath !== '/admin') {
      router.replace(rememberedPath);
    }
  }, [pathname, router]);

  const activeSection = useMemo(() =>
    sidebarSections.find((section) => section.links.some((link) => isLinkActive(pathname, link.href))),
    [pathname]
  );

  const toggleSection = (title: string) => {
    setOpenSection((prev) => (prev === title ? null : title));
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Link href="/admin">
            <Image src="/logoSB.png" alt="Stemory Blooms" width={144} height={40} priority />
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarSections.map((section) => {
            const isOpen = openSection === section.title;
            const hasActiveLink = section.links.some((link) => isLinkActive(pathname, link.href));

            return (
              <div key={section.title} className={`${styles.sidebarSection} ${hasActiveLink ? styles.sidebarSectionActive : ''}`}>
                <button
                  type="button"
                  className={styles.sidebarSectionToggle}
                  onClick={() => toggleSection(section.title)}
                  aria-expanded={isOpen}
                >
                  <span>{section.title}</span>
                  <ChevronDown 
                    size={16} 
                    style={{ 
                      transition: 'transform 0.3s ease',
                      transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)'
                    }} 
                  />
                </button>
                <div style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.3s ease-out'
                }}>
                  <div className={styles.sectionLinks} style={{ overflow: 'hidden' }}>
                    {section.links.map((link) => {
                      const isActive = isLinkActive(pathname, link.href);
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                        >
                          <Icon size={18} />
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Link href="/" className={styles.backToStoreBtn}>
            <Store size={18} />
            <span>Back to Store</span>
          </Link>
        </div>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topBar}>
          <div>
            <div className={styles.topBarEyebrow}>Commerce control center</div>
            <h1 className={styles.pageTitle}>{activeSection?.title ?? 'Dashboard'}</h1>
          </div>
          <div className={styles.topBarRight}>
            <AdminNotifications />
            <AdminUserSlot />
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>

      {/* Mobile bottom bar — visible only on small screens where sidebar is hidden */}
      <div className={styles.mobileBar}>
        <Link href="/admin" className={styles.mobileBarLink}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </Link>
        <Link href="/admin/orders" className={styles.mobileBarLink}>
          <ShoppingBag size={20} />
          <span>Orders</span>
        </Link>
        <Link href="/admin/products" className={styles.mobileBarLink}>
          <Package size={20} />
          <span>Products</span>
        </Link>
        <Link href="/admin/settings" className={styles.mobileBarLink}>
          <Settings size={20} />
          <span>Settings</span>
        </Link>

        {/* Mode quick-toggle */}
        <div style={{ position: 'relative' }}>
          <button
            className={styles.mobileBarLink}
            onClick={() => setModeMenuOpen(o => !o)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', flexDirection: 'column', color: activeMode.color }}
          >
            <activeMode.icon size={20} />
            <span style={{ color: activeMode.color }}>{activeMode.label}</span>
          </button>

          {modeMenuOpen && (
            <div className={styles.modePicker}>
              <div className={styles.modePickerTitle}>Site Mode</div>
              {MODE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  className={styles.modePickerBtn}
                  onClick={() => switchMode(opt.value)}
                  style={{
                    backgroundColor: optimisticMode === opt.value ? opt.bg : 'transparent',
                    color: optimisticMode === opt.value ? opt.color : '#3A3531',
                    fontWeight: optimisticMode === opt.value ? 700 : 400,
                  }}
                >
                  <opt.icon size={16} />
                  {opt.label}
                  {optimisticMode === opt.value && <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>✓ Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
