"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";
import { GoogleIcon } from "@/components/GoogleIcon";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(searchParams.get("error"));
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao entrar");
      }
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 space-y-4 bg-white dark:bg-neutral-900"
    >
      <div className="flex items-center gap-3">
        <Image src="/logo.png" alt="Internacional Hub" width={48} height={48} />
        <div>
          <h1 className="text-lg font-bold tracking-wide">INTERNACIONAL HUB</h1>
          <p className="text-xs text-neutral-500 mt-1">Acesso restrito — entre com suas credenciais.</p>
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500">E-mail</label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="text-xs text-neutral-500">Senha</label>
          <Link href="/esqueci-senha" className="text-xs text-blue-600">
            Esqueceu a senha?
          </Link>
        </div>
        <PasswordInput
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1"
          inputClassName="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        <span className="text-xs text-neutral-400">ou</span>
        <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <a
        href={`/api/auth/google?next=${encodeURIComponent(next)}`}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800"
      >
        <GoogleIcon />
        Continuar com o Google
      </a>

      <p className="text-xs text-center text-neutral-500">
        Ainda não tem conta?{" "}
        <Link href="/signup" className="text-blue-600">
          Criar conta
        </Link>
      </p>
    </form>
  );
}
