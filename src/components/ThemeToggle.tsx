"use client";

import { useEffect, useState } from "react";

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
      className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-900 transition-colors"
    >
      <span className="flex items-center gap-2">
        <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
        {isDark ? "Modo escuro" : "Modo claro"}
      </span>
      <span
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
          isDark ? "bg-slate-700" : "bg-neutral-300"
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
