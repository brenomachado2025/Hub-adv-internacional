"use client";

import { useEffect, useState } from "react";

export function Greeting() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        const user = data.user;
        if (!user) return;
        const rawFirstName = (user.name || user.email).trim().split(/\s+/)[0];
        const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);
        setLabel(user.title ? `${user.title} ${firstName}` : firstName);
      })
      .catch(() => {});
  }, []);

  if (!label) return null;

  return (
    <span className="hidden sm:inline text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
  );
}
