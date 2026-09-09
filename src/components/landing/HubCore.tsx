"use client";

import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { clamp01, sampleHub } from "./timeline";
import { useScrollProgressRef } from "./scroll-progress";

export type OrbitNode = { label: string; sub?: string };

type HubState = { growth: number; reveal: number };

function Node({
  label,
  sub,
  angle,
  radius,
  index,
  count,
  hubState,
}: {
  label: string;
  sub?: string;
  angle: number;
  radius: number;
  index: number;
  count: number;
  hubState: MutableRefObject<HubState>;
}) {
  const ref = useRef<THREE.Group>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const localDelay = index / Math.max(count, 1);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const localReveal = clamp01((hubState.current.reveal - localDelay * 0.6) / 0.4);
    const t = clock.getElapsedTime() * 0.08 + angle;
    const x = Math.cos(t) * radius;
    const z = Math.sin(t) * radius;
    const y = Math.sin(t * 1.4) * 0.25;
    ref.current.position.set(x, y, z);
    ref.current.scale.setScalar(localReveal);
    ref.current.visible = localReveal > 0.02;
    if (labelRef.current) {
      labelRef.current.style.opacity = String(localReveal);
      labelRef.current.style.transform = `translateY(${(1 - localReveal) * 8}px)`;
    }
  });

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshStandardMaterial color="#8fd8ff" emissive="#4fb2ff" emissiveIntensity={1.6} />
      </mesh>
      <Html center distanceFactor={7} style={{ pointerEvents: "none" }} occlude={false}>
        <div
          ref={labelRef}
          style={{
            whiteSpace: "nowrap",
            color: "#dbeeff",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textShadow: "0 0 12px rgba(79,178,255,0.8)",
          }}
        >
          {label}
          {sub && (
            <div style={{ fontSize: "10px", fontWeight: 400, opacity: 0.7, letterSpacing: "0.04em" }}>{sub}</div>
          )}
        </div>
      </Html>
    </group>
  );
}

export function HubCore({
  nodes,
  position = [0, 0, 0],
}: {
  nodes: OrbitNode[];
  position?: [number, number, number];
}) {
  const rootRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const progressRef = useScrollProgressRef();
  const hubState = useRef<HubState>({ growth: 0, reveal: 0 });

  useFrame((_, delta) => {
    const { growth, reveal } = sampleHub(progressRef.current);
    hubState.current.growth = growth;
    hubState.current.reveal = reveal;

    if (rootRef.current) rootRef.current.visible = growth > 0.01;
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.15;
      coreRef.current.scale.setScalar(0.05 + growth * 0.55);
    }
    if (wireRef.current) {
      wireRef.current.rotation.y -= delta * 0.1;
      wireRef.current.rotation.x += delta * 0.05;
      wireRef.current.scale.setScalar(0.05 + growth * 0.78);
    }
    if (lightRef.current) lightRef.current.intensity = growth * 6;
  });

  const radius = 2.3;

  return (
    <group ref={rootRef} position={position}>
      <pointLight ref={lightRef} color="#5fc2ff" distance={8} intensity={0} />
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color="#0d3a5c"
          emissive="#4fb2ff"
          emissiveIntensity={1.4}
          metalness={0.4}
          roughness={0.25}
        />
      </mesh>
      <mesh ref={wireRef}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#bfe6ff" wireframe transparent opacity={0.35} />
      </mesh>

      {nodes.map((n, i) => (
        <Node
          key={n.label}
          label={n.label}
          sub={n.sub}
          angle={(i / nodes.length) * Math.PI * 2}
          radius={radius}
          index={i}
          count={nodes.length}
          hubState={hubState}
        />
      ))}
    </group>
  );
}
