"use client";

import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";

export function AdminUserSlot() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded || !isSignedIn) return null;
  return (
    <UserButton
      appearance={{ elements: { avatarBox: { width: 32, height: 32 } } }}
    />
  );
}
