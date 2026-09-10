"use client";

import { useState } from "react";
import { PasswordInput } from "@/components/PasswordInput";

export default function SuperadminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao entrar");
      }
      // Navegação client-side (router.push) podia ficar presa num cache de rota
      // antigo, apontando de volta pro login mesmo com o cookie já setado.
      // Um redirecionamento de página cheia evita isso de vez.
      window.location.href = "/superadmin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-red-950 p-6 space-y-4 bg-zinc-950 text-zinc-200"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <h1 className="text-lg font-bold tracking-wide text-white">Painel Super-Admin</h1>
          </div>
          <p className="text-xs text-zinc-500">Acesso restrito à administração do Internacional Hub.</p>
        </div>

        <div>
          <label className="text-xs text-zinc-500">Usuário (não é seu e-mail — é um login fixo separado)</label>
          <input
            required
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="hub_master"
            className="w-full mt-1 px-3 py-2 rounded-md border border-red-950 bg-black text-sm text-white placeholder:text-zinc-600"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500">Senha</label>
          <PasswordInput
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1"
            inputClassName="px-3 py-2 rounded-md border border-red-950 bg-black text-sm text-white"
            iconClassName="text-zinc-500 hover:text-zinc-300"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
