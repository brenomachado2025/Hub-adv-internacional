import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { href: "/", label: "Painel", icon: "🏠" },
  { href: "/crm", label: "CRM de Clientes", icon: "📇" },
  { href: "/sancoes", label: "Sanções (ONU/OFAC/UE)", icon: "🛡️" },
  { href: "/notificacoes", label: "Notificações", icon: "📬" },
  { href: "/auditoria", label: "Auditoria", icon: "📋" },
  { href: "/honorarios", label: "Honorários & Câmbio", icon: "💱" },
  { href: "/faturas", label: "Faturas", icon: "🧾" },
  { href: "/reunioes", label: "Reuniões & Fusos", icon: "🌐" },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 min-h-screen flex flex-col">
      <div className="px-5 py-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col items-center text-center gap-2">
        <Image src="/logo.png" alt="Internacional Hub" width={56} height={56} />
        <div>
          <h1 className="text-base font-bold leading-tight">INTERNACIONAL HUB</h1>
          <p className="text-xs text-neutral-500 mt-1">Sanções internacionais & due diligence</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-colors"
          >
            <span aria-hidden>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
        <ThemeToggle />
      </div>
    </aside>
  );
}
