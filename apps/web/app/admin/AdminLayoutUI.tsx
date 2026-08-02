"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingBag, Users, Package,
  FileText, ClipboardList, Truck, Image as ImageIcon,
  BarChart2, Settings, Bell, LogOut
} from 'lucide-react';
import { AdminUserSlot } from './AdminUserSlot';
import styles from './admin.module.css';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/custom-orders', label: 'Custom Orders', icon: FileText },
  { href: '/admin/inventory', label: 'Inventory', icon: ClipboardList },
  { href: '/admin/deliveries', label: 'Deliveries', icon: Truck },
  { href: '/admin/content', label: 'Content', icon: ImageIcon },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/reports', label: 'Reports', icon: BarChart2 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayoutUI({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <Link href="/">
            <img src="/logoSB.png" alt="Stemory Blooms" />
          </Link>
        </div>

        <nav className={styles.sidebarNav}>
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
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
        </nav>
      </aside>

      <div className={styles.mainArea}>
        <header className={styles.topBar}>
          <h1 className={styles.pageTitle}>Dashboard</h1>
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
