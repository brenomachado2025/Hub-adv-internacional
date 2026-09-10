"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  inputClassName?: string;
  iconClassName?: string;
};

export function PasswordInput({ inputClassName, iconClassName, className, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className ?? ""}`}>
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={`w-full pr-10 ${inputClassName ?? ""}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        className={`absolute right-2 top-1/2 -translate-y-1/2 ${iconClassName ?? "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"}`}
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
