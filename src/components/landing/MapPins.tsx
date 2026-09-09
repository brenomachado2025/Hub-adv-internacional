"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useScrollProgressRef } from "./scroll-progress";
import {
  MAP_LOCATIONS,
  clamp01,
  latLngToVector3,
  sampleEarthStops,
  sampleMapPins,
} from "./timeline";

const RADIUS = 1.5;
const PIN_RADIUS = RADIUS * 1.008;

function buildArc(a: [number, number, number], b: [number, number, number]) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const mid = start.clone().add(end).multiplyScalar(0.5);
  mid.normalize().multiplyScalar(RADIUS * 1.35);
  const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
  const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(48));
  const material = new THREE.LineBasicMaterial({ color: "#7fe0ff", transparent: true, opacity: 0 });
  return new THREE.Line(geometry, material);
}

function Pin({ position, label, index }: { position: [number, number, number]; label: string; index: number }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const progressRef = useScrollProgressRef();

  useFrame(({ clock }) => {
    const reveal = sampleMapPins(progressRef.current);
    const local = clamp01((reveal - index * 0.18) / 0.5);
    const pulse = 0.85 + Math.sin(clock.getElapsedTime() * 2.4 + index) * 0.15;
    if (meshRef.current) meshRef.current.scale.setScalar(local * pulse);
    if (matRef.current) matRef.current.opacity = local;
    if (labelRef.current) {
      labelRef.current.style.opacity = String(local);
      labelRef.current.style.transform = `translateY(${(1 - local) * 6}px)`;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.028, 12, 12]} />
        <meshBasicMaterial ref={matRef} color="#7fe0ff" transparent opacity={0} />
      </mesh>
      <Html center distanceFactor={6.5} style={{ pointerEvents: "none" }} occlude={false}>
        <div
          ref={labelRef}
          style={{
            whiteSpace: "nowrap",
            color: "#eaf7ff",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textShadow: "0 0 10px rgba(127,224,255,0.9)",
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

export function MapPins() {
  const rootRef = useRef<THREE.Group>(null);
  const progressRef = useScrollProgressRef();

  const positions = useMemo(
    () => MAP_LOCATIONS.map((loc) => latLngToVector3(loc.lat, loc.lng, PIN_RADIUS)),
    []
  );

  const arcLines = useMemo(() => {
    const arcs: THREE.Line[] = [];
    for (let i = 0; i < positions.length - 1; i++) {
      arcs.push(buildArc(positions[i], positions[i + 1]));
    }
    return arcs;
  }, [positions]);

  useFrame(() => {
    const p = progressRef.current;
    const { rotY, scale } = sampleEarthStops(p);
    const reveal = sampleMapPins(p);

    if (rootRef.current) {
      rootRef.current.rotation.y = THREE.MathUtils.lerp(rootRef.current.rotation.y, rotY, 0.06);
      rootRef.current.scale.setScalar(THREE.MathUtils.lerp(rootRef.current.scale.x || scale, scale, 0.08));
      rootRef.current.visible = reveal > 0.01;
    }
    arcLines.forEach((lineObj, i) => {
      const local = clamp01((reveal - 0.35 - i * 0.15) / 0.4);
      (lineObj.material as THREE.LineBasicMaterial).opacity = local * 0.7;
    });
  });

  return (
    <group ref={rootRef}>
      {MAP_LOCATIONS.map((loc, i) => (
        <Pin key={loc.id} position={positions[i]} label={loc.label} index={i} />
      ))}
      {arcLines.map((lineObj, i) => (
        <primitive key={i} object={lineObj} />
      ))}
    </group>
  );
}
