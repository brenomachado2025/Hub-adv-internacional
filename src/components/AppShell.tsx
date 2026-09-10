"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Greeting } from "@/components/Greeting";
import { SupportChat } from "@/components/SupportChat";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname.startsWith("/superadmin")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-end gap-4 px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
          <Greeting />
          <NotificationBell />
          <Link
            href="/configuracoes"
            aria-label="Configurações"
            className={`inline-flex items-center justify-center w-9 h-9 rounded-md border ${
              pathname === "/configuracoes"
                ? "border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950"
                : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            }`}
          >
            <Settings size={18} strokeWidth={1.75} />
          </Link>
        </header>
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>
      <SupportChat />
    </div>
  );
}
