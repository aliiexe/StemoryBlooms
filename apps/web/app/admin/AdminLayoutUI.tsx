"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Package,
  FileText, ClipboardList, Truck, Image as ImageIcon,
  BarChart2, Settings, Bell, ChevronDown, ChevronRight
} from 'lucide-react';
import { AdminUserSlot } from './AdminUserSlot';
import styles from './admin.module.css';

const sidebarSections = [
  {
    title: 'Store',
    links: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
      { href: '/admin/custom-orders', label: 'Custom Orders', icon: FileText },
      { href: '/admin/deliveries', label: 'Deliveries', icon: Truck },
    ],
  },
  {
    title: 'Catalog',
    links: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: Package },
      { href: '/admin/inventory', label: 'Inventory & Materials', icon: ClipboardList },
    ],
  },
  {
    title: 'Operations',
    links: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/users', label: 'User Management', icon: Users },
      { href: '/admin/finances', label: 'Finances', icon: FileText },
      { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
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

export default function AdminLayoutUI({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sidebarSections.map((section) => [section.title, false]))
  );
  const lastAdminPathKey = 'stemory-admin-last-path';

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
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
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
            const isOpen = openSections[section.title] ?? false;
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
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {isOpen && (
                  <div className={styles.sectionLinks}>
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
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topBar}>
          <div>
            <div className={styles.topBarEyebrow}>Commerce control center</div>
            <h1 className={styles.pageTitle}>{activeSection?.title ?? 'Dashboard'}</h1>
          </div>
          <div className={styles.topBarRight}>
            <button className={styles.topBarIcon} aria-label="Notifications">
              <Bell size={18} />
            </button>
            <AdminUserSlot />
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
