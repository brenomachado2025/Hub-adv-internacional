import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Painel", icon: "🏠" },
  { href: "/sancoes", label: "Sanções (ONU/OFAC/UE)", icon: "🛡️" },
  { href: "/notificacoes", label: "Notificações", icon: "📬" },
  { href: "/auditoria", label: "Auditoria", icon: "📋" },
  { href: "/honorarios", label: "Honorários & Câmbio", icon: "💱" },
  { href: "/faturas", label: "Faturas", icon: "🧾" },
  { href: "/reunioes", label: "Reuniões & Fusos", icon: "🌐" },
];

export function Sidebar() {
  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 min-h-screen">
      <div className="px-5 py-6 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-bold leading-tight">Hub ADV Internacional</h1>
        <p className="text-xs text-neutral-500 mt-1">Sanções internacionais & due diligence</p>
      </div>
      <nav className="p-3 space-y-1">
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
    </aside>
  );
}
