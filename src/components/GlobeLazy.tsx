"use client";

import dynamic from "next/dynamic";

const Globe3D = dynamic(() => import("@/components/Globe3D").then((m) => m.Globe3D), { ssr: false });

export function GlobeLazy({ size }: { size?: number }) {
  return <Globe3D size={size} />;
}
