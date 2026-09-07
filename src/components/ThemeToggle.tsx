"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage indisponível (modo privado etc.) - a preferência só não persiste.
    }
  };

  // Evita divergência entre o que o servidor renderiza e o tema já aplicado pelo script inline.
  if (!mounted) {
    return <div className="h-9" aria-hidden />;
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
    >
      <span className="flex items-center gap-3">
        {isDark ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
        {isDark ? "Modo escuro" : "Modo claro"}
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          isDark ? "bg-blue-600" : "bg-white/20"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isDark ? "translate-x-[18px]" : "translate-x-[2px]"
          }`}
        />
      </span>
    </button>
  );
}
