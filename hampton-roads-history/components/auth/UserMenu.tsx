"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/auth/sign-out", { method: "POST" });
    router.refresh();
  };

  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex items-center justify-between bg-surface-1 border border-line rounded-lg p-4">
      <div>
        <p className="text-sm text-ink-3 font-mono uppercase tracking-wide">Signed in as</p>
        <p className="text-ink font-semibold">{user.email}</p>
      </div>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 text-sm font-semibold text-accent hover:text-accent-dim transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
