"use client";

import dynamic from "next/dynamic";

const Globe3D = dynamic(() => import("@/components/Globe3D").then((m) => m.Globe3D), { ssr: false });

export function GlobeLazy() {
  return <Globe3D />;
}
