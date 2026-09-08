"use client";

import { useState } from "react";
import { User, Users, ChevronDown } from "lucide-react";
import { ProfilePanel } from "./ProfilePanel";
import { UsersPanel } from "./UsersPanel";
import { TeamPanel } from "./TeamPanel";

type Item = "perfil" | "usuarios" | "equipes";

export function SettingsShell() {
  const [active, setActive] = useState<Item>("perfil");
  const [pessoalOpen, setPessoalOpen] = useState(true);
  const [usuariosOpen, setUsuariosOpen] = useState(true);

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-6 items-start">
      <nav className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-2 space-y-1">
        <GroupHeader icon={User} label="Pessoal" open={pessoalOpen} onToggle={() => setPessoalOpen((v) => !v)} />
        {pessoalOpen && (
          <NavItem label="Perfil" active={active === "perfil"} onClick={() => setActive("perfil")} />
        )}

        <GroupHeader icon={Users} label="Usuários" open={usuariosOpen} onToggle={() => setUsuariosOpen((v) => !v)} />
        {usuariosOpen && (
          <>
            <NavItem label="Usuários" active={active === "usuarios"} onClick={() => setActive("usuarios")} />
            <NavItem label="Equipes" active={active === "equipes"} onClick={() => setActive("equipes")} />
          </>
        )}
      </nav>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
        {active === "perfil" && <ProfilePanel />}
        {active === "usuarios" && <UsersPanel />}
        {active === "equipes" && <TeamPanel />}
      </div>
    </div>
  );
}

function GroupHeader({
  icon: Icon,
  label,
  open,
  onToggle,
}: {
  icon: typeof User;
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
    >
      <Icon size={14} strokeWidth={2} />
      <span className="flex-1 text-left">{label}</span>
      <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
  );
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
        active
          ? "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-medium"
          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900"
      }`}
    >
      {label}
    </button>
  );
}
