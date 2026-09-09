"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title, email, password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Falha ao criar conta");
      }
      router.push("/dashboard");
      router.refresh();
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
          <h1 className="text-lg font-bold">Criar conta</h1>
          <p className="text-xs text-neutral-500 mt-1">
            INTERNACIONAL HUB — sua área é individual, seus dados não são compartilhados com outras contas.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="text-xs text-neutral-500">Nome</label>
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-neutral-500">Tratamento</label>
          <select
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
          >
            <option value="">—</option>
            <option value="Sr.">Sr.</option>
            <option value="Sra.">Sra.</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-neutral-500">E-mail</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500">Senha (mínimo 8 caracteres)</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
      </div>

      <div>
        <label className="text-xs text-neutral-500">Confirmar senha</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
      >
        {loading ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-xs text-center text-neutral-500">
        Já tem conta?{" "}
        <Link href="/login" className="text-blue-600">
          Entrar
        </Link>
      </p>
    </form>
  );
}
