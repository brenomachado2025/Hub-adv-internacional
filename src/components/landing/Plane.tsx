"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollProgressRef } from "./scroll-progress";
import { clamp01, lerp, sceneLocalProgress } from "./timeline";

function useTrailTexture() {
  return useMemo(() => {
    const w = 256;
    const h = 16;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(0, 0, w, 0);
    gradient.addColorStop(0, "rgba(180,220,255,0)");
    gradient.addColorStop(0.85, "rgba(200,230,255,0.55)");
    gradient.addColorStop(1, "rgba(255,255,255,0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    return new THREE.CanvasTexture(canvas);
  }, []);
}

/** A stylized low-poly jet, built from primitives, that streaks across the screen. */
export function Plane() {
  const rootRef = useRef<THREE.Group>(null);
  const group = useRef<THREE.Group>(null);
  const trailMat = useRef<THREE.MeshBasicMaterial>(null);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const wingMat = useRef<THREE.MeshStandardMaterial>(null);
  const finMat = useRef<THREE.MeshStandardMaterial>(null);
  const trailTexture = useTrailTexture();
  const progressRef = useScrollProgressRef();

  const startX = -9;
  const endX = 9;

  useFrame(() => {
    const progress = sceneLocalProgress(progressRef.current, "connection");
    const opacity = Math.sin(Math.PI * clamp01(progress));
    if (rootRef.current) rootRef.current.visible = opacity > 0.02;
    if (!group.current) return;

    const x = lerp(startX, endX, progress);
    const y = lerp(-1.4, 1.1, progress) + Math.sin(progress * Math.PI) * 0.6;
    const z = lerp(-1, 1.5, progress);
    group.current.position.set(x, y, z);
    group.current.rotation.z = lerp(0.12, -0.05, progress);
    group.current.rotation.y = Math.PI / 2 + 0.12;

    if (bodyMat.current) bodyMat.current.opacity = opacity;
    if (wingMat.current) wingMat.current.opacity = opacity;
    if (finMat.current) finMat.current.opacity = opacity;
    if (trailMat.current) trailMat.current.opacity = Math.max(opacity, 0) * 0.9;
  });

  return (
    <group ref={rootRef}>
      <group ref={group}>
        <mesh scale={[0.16, 0.16, 1.6]}>
          <coneGeometry args={[1, 2, 8]} />
          <meshStandardMaterial ref={bodyMat} color="#dfe7f0" metalness={0.7} roughness={0.25} transparent opacity={1} />
        </mesh>
        <mesh position={[0, 0, 0.15]} scale={[0.9, 0.05, 0.35]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial ref={wingMat} color="#c7d2dc" metalness={0.6} roughness={0.3} transparent opacity={1} />
        </mesh>
        <mesh position={[0, 0.15, -0.55]} scale={[0.35, 0.3, 0.25]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial ref={finMat} color="#c7d2dc" metalness={0.6} roughness={0.3} transparent opacity={1} />
        </mesh>
        <mesh position={[0, 0, -1.4]} rotation={[0, 0, Math.PI / 2]}>
          <planeGeometry args={[0.5, 5]} />
          <meshBasicMaterial
            ref={trailMat}
            map={trailTexture}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
