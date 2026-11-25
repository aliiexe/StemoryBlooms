"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { User,LayoutDashboard } from "lucide-react";
import Link from "next/link";
import styles from './auth-slot.module.css';

export function ClerkAuthSlot({ isAdmin }: { isAdmin?: boolean }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <div className={styles.accountActions}>
        <Link href="/account" className={styles.accountLink} aria-label="My orders" title="My orders"><User size={18} strokeWidth={1.5}/></Link>
        {isAdmin && (
          <Link href="/admin" className={styles.accountLink} aria-label="Staff dashboard" title="Staff dashboard"><LayoutDashboard size={18} strokeWidth={1.5}/></Link>
        )}
        <UserButton
          appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }}
        />
      </div>
    );
  }

  return (
    <SignInButton mode="modal">
      <button
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          padding: '0.25rem',
        }}
        aria-label="Sign In"
      >
        <User size={18} strokeWidth={1.5} />
      </button>
    </SignInButton>
  );
}
