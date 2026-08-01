"use client";

import { useUser } from "@clerk/nextjs";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { User } from "lucide-react";

export function ClerkAuthSlot() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;

  if (isSignedIn) {
    return (
      <UserButton
        appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }}
      />
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
