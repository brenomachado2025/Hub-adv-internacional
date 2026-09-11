"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Menu, Search } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { Greeting } from "@/components/Greeting";
import { SupportChat } from "@/components/SupportChat";
import { ToastProvider } from "@/components/Toast";
import { CommandPalette } from "@/components/CommandPalette";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  if (pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname.startsWith("/superadmin")) {
    return <>{children}</>;
  }

  return (
    <ToastProvider>
      <div className="min-h-full flex">
        <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-between md:justify-end gap-2 sm:gap-4 px-4 sm:px-6 py-3 border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menu"
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 shrink-0"
            >
              <Menu size={18} strokeWidth={1.75} />
            </button>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => window.dispatchEvent(new Event("hub:open-search"))}
                aria-label="Buscar"
                title="Buscar (Ctrl+K)"
                className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-sm text-neutral-500"
              >
                <Search size={16} strokeWidth={1.75} />
                <span className="hidden lg:inline text-xs">Ctrl+K</span>
              </button>
              <Greeting />
              <NotificationBell />
              <Link
                href="/configuracoes"
                aria-label="Configurações"
                className={`inline-flex items-center justify-center w-9 h-9 rounded-md border shrink-0 ${
                  pathname === "/configuracoes"
                    ? "border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950"
                    : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                }`}
              >
                <Settings size={18} strokeWidth={1.75} />
              </Link>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 max-w-6xl w-full mx-auto">{children}</main>
        </div>
        <SupportChat />
        <CommandPalette />
      </div>
    </ToastProvider>
  );
}
