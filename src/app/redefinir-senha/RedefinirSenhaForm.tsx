"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/PasswordInput";

export function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha ao redefinir a senha");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
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
            <h1 className="text-lg font-bold tracking-wide">Redefinir senha</h1>
            <p className="text-xs text-neutral-500 mt-1">Digite o código recebido por e-mail.</p>
          </div>
        </div>

        {done ? (
          <div className="space-y-3">
            <p className="text-sm text-emerald-600">Senha redefinida com sucesso!</p>
            <Link
              href="/login"
              className="block w-full text-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium"
            >
              Ir para o login
            </Link>
          </div>
        ) : (
          <>
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
              <label className="text-xs text-neutral-500">Código de 6 dígitos</label>
              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full mt-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm tracking-[0.3em] text-center font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Nova senha</label>
              <PasswordInput
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
                inputClassName="px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500">Confirmar nova senha</label>
              <PasswordInput
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? "Redefinindo..." : "Redefinir senha"}
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
