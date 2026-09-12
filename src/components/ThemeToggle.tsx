"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const showToast = useToast();
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    setMounted(true);

    // A preferência salva na conta é a fonte de verdade - localStorage sozinho
    // some em alguns navegadores embutidos (ex.: WebView do WhatsApp), o que
    // fazia o modo escuro "resetar" ao reabrir o app. Corrige assim que a
    // conta responder, se for diferente do que já está aplicado.
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const accountTheme = data.user?.theme as string | undefined;
        if (accountTheme === "dark" || accountTheme === "light") {
          const shouldBeDark = accountTheme === "dark";
          document.documentElement.classList.toggle("dark", shouldBeDark);
          setIsDark(shouldBeDark);
          try {
            localStorage.setItem("theme", accountTheme);
          } catch {
            // localStorage indisponível - tudo bem, a conta já é a fonte de verdade.
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage indisponível (modo privado etc.) - a preferência só não persiste localmente.
    }
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next ? "dark" : "light" }),
    })
      .then((res) => {
        if (!res.ok) throw new Error();
      })
      .catch(() => {
        showToast("Não foi possível salvar a preferência de tema nesta conta.", "error");
      });
  };

  // Evita divergência entre o que o servidor renderiza e o tema já aplicado pelo script inline.
  if (!mounted) {
    return <div className="h-9" aria-hidden />;
  }

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        role="switch"
        aria-checked={isDark}
        title={isDark ? "Modo escuro" : "Modo claro"}
        aria-label={isDark ? "Modo escuro" : "Modo claro"}
        className="flex items-center justify-center w-11 h-11 mx-auto rounded-2xl text-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
      >
        <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
    >
      <span className="flex items-center gap-3">
        <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
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
