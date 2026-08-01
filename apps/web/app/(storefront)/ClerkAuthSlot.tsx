"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";
import Link from "next/link";

export function ClerkAuthSlot({ isAdmin }: { isAdmin?: boolean }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {isAdmin && (
          <Link href="/admin" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Dashboard
          </Link>
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
