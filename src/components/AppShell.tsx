"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Greeting } from "@/components/Greeting";
import { SupportChat } from "@/components/SupportChat";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/signup") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-end gap-4 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Greeting />
          <NotificationBell />
        </header>
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
      <SupportChat />
    </div>
  );
}
