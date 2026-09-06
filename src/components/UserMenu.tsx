"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function UserMenu() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setEmail(data.user?.email ?? null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (!email) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-neutral-500 hidden sm:inline">{email}</span>
      <button
        onClick={logout}
        className="px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
      >
        Sair
      </button>
    </div>
  );
}
