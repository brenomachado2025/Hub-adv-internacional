"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Scene3D } from "./Scene3D";

export function CanvasBackdrop() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 760px)");
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "#000",
      }}
    >
      <Canvas
        dpr={isMobile ? [1, 1.25] : [1, 1.75]}
        gl={{ antialias: !isMobile, powerPreference: "high-performance" }}
        camera={{ fov: 45, near: 0.1, far: 100, position: [0, 0, 9] }}
      >
        <Suspense fallback={null}>
          <Scene3D lowPower={isMobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
