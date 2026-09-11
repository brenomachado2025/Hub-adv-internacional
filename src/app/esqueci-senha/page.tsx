"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 space-y-4 bg-white dark:bg-neutral-900"
      >
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Internacional Hub" width={48} height={48} />
          <div>
            <h1 className="text-lg font-bold tracking-wide">Esqueci minha senha</h1>
            <p className="text-xs text-neutral-500 mt-1">Enviamos um código de 6 dígitos por e-mail.</p>
          </div>
        </div>

        {sent ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-600">
              Se esse e-mail existir na nossa base, você vai receber um código em instantes.
            </p>
            <Link
              href={`/redefinir-senha?email=${encodeURIComponent(email)}`}
              className="block w-full text-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
            >
              Já tenho o código
            </Link>
          </div>
        ) : (
          <>
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </>
        )}

        <p className="text-xs text-center text-neutral-500">
          <Link href="/login" className="text-blue-600">
            Voltar para o login
          </Link>
        </p>
      </form>
    </div>
  );
}
