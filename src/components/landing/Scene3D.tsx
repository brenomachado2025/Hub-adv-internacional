"use client";

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { Earth } from "./Earth";
import { Plane } from "./Plane";
import { MapPins } from "./MapPins";
import { HubCore, type OrbitNode } from "./HubCore";
import { useScrollProgressRef } from "./scroll-progress";
import { sampleEarthStops, sampleHub } from "./timeline";

const BIRTH_NODES: OrbitNode[] = [
  { label: "LEADS" },
  { label: "VENDAS" },
  { label: "CRM" },
  { label: "MARKETING" },
  { label: "AUTOMAÇÃO" },
  { label: "DADOS" },
  { label: "APLICATIVOS" },
  { label: "PROCESSOS" },
  { label: "GESTÃO" },
];

const SOLUTION_NODES: OrbitNode[] = [
  { label: "AQUISIÇÃO DE LEADS" },
  { label: "PROCESSOS COMERCIAIS" },
  { label: "TECNOLOGIA" },
  { label: "APLICATIVOS" },
  { label: "AUTOMAÇÃO" },
  { label: "DADOS" },
  { label: "INTEGRAÇÃO" },
];

export function Scene3D({ lowPower = false }: { lowPower?: boolean }) {
  const progressRef = useScrollProgressRef();
  const [showSolutions, setShowSolutions] = useState(false);
  const lastRef = useRef(false);

  useFrame((state) => {
    const cam = sampleEarthStops(progressRef.current);
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, cam.camZ, 0.08);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, cam.camY, 0.08);
    state.camera.lookAt(0, 0, 0);
  });

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const next = sampleHub(progressRef.current).showSolutions;
      if (next !== lastRef.current) {
        lastRef.current = next;
        setShowSolutions(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progressRef]);

  return (
    <>
      <Stars
        radius={80}
        depth={50}
        count={lowPower ? 1200 : 3200}
        factor={3.2}
        saturation={0}
        fade
        speed={0.4}
      />
      <Earth segments={lowPower ? 48 : 96} />
      <MapPins />
      <Plane />
      <HubCore nodes={showSolutions ? SOLUTION_NODES : BIRTH_NODES} />
    </>
  );
}
