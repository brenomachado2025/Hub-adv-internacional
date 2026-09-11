"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

type MeUser = { email: string; name: string; title: string; role: string; avatarUrl?: string };

// Redimensiona/comprime a foto no navegador antes de enviar - evita depender de
// um serviço de storage externo, guardando a foto direto como data-URL no banco.
function resizeImage(file: File, maxSize = 256, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo não é uma imagem válida"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Falha ao processar imagem"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function ProfilePanel() {
  const showToast = useToast();
  const [user, setUser] = useState<MeUser | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name ?? "");
          setTitle(data.user.title ?? "");
        }
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, title }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data.user);
      setSaved(true);
    } catch {
      showToast("Não foi possível salvar. Tente novamente.", "error");
    } finally {
      setSaving(false);
    }
  };

  const onSelectAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Escolha um arquivo de imagem.", "error");
      return;
    }
    setUploadingAvatar(true);
    try {
      const dataUrl = await resizeImage(file);
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data.user);
      showToast("Foto de perfil atualizada.");
    } catch {
      showToast("Não foi possível atualizar a foto. Tente novamente.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUser(data.user);
    } catch {
      showToast("Não foi possível remover a foto. Tente novamente.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return <p className="text-sm text-neutral-500">Carregando...</p>;

  const initial = (name || user.email).charAt(0).toUpperCase();

  return (
    <div className="space-y-5 max-w-md">
      <h3 className="font-semibold">Perfil</h3>

      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-semibold flex items-center justify-center">
            {initial}
          </div>
        )}
        <div className="space-y-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onSelectAvatar}
            className="hidden"
          />
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-700 text-xs disabled:opacity-50"
            >
              {uploadingAvatar ? "Enviando..." : "Trocar foto"}
            </button>
            {user.avatarUrl && (
              <button
                onClick={removeAvatar}
                disabled={uploadingAvatar}
                className="px-3 py-1.5 rounded-md text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                Remover
              </button>
            )}
          </div>
          <p className="text-xs text-neutral-400">JPG ou PNG, redimensionada automaticamente.</p>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-neutral-500">E-mail</label>
        <input
          value={user.email}
          disabled
          className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-sm text-neutral-500"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-neutral-500">Nome</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-neutral-500">Tratamento</label>
        <select
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent text-sm"
        >
          <option value="">Nenhum</option>
          <option value="Sr.">Sr.</option>
          <option value="Sra.">Sra.</option>
        </select>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-900 text-white text-sm disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar"}
      </button>
      {saved && <span className="text-xs text-emerald-600 ml-3">Salvo!</span>}
    </div>
  );
}
