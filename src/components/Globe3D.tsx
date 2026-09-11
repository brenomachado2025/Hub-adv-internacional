"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(THREE.TextureLoader, "/textures/earth.jpg");
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.045;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.06;
  });

  return (
    <group rotation={[0.41, 0, 0]}>
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 96, 96]} />
        <meshStandardMaterial map={texture} roughness={0.9} metalness={0} />
      </mesh>
      <mesh ref={cloudsRef} scale={1.012}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.06} depthWrite={false} />
      </mesh>
      <mesh scale={1.035}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial color="#4da6ff" transparent opacity={0.12} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

type Meteor = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  delay: number;
  duration: number;
};

function Meteors({ count = 6 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const elapsed = useRef(0);

  const meteors = useMemo<Meteor[]>(() => {
    return Array.from({ length: count }, () => {
      const startX = -14 - Math.random() * 6;
      const startY = 6 + Math.random() * 5;
      const z = -6 - Math.random() * 6;
      const travel = 22 + Math.random() * 8;
      return {
        start: new THREE.Vector3(startX, startY, z),
        end: new THREE.Vector3(startX + travel, startY - travel * 0.55, z),
        delay: Math.random() * 10,
        duration: 1.4 + Math.random() * 0.8,
      };
    });
  }, [count]);

  useFrame((_, delta) => {
    elapsed.current += delta;
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      const m = meteors[i];
      const cycle = 10;
      const t = ((elapsed.current + m.delay) % cycle) / m.duration;
      const mesh = child as THREE.Mesh;
      if (t < 0 || t > 1) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      mesh.position.lerpVectors(m.start, m.end, t);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
    });
  });

  return (
    <group ref={groupRef}>
      {meteors.map((m, i) => (
        <mesh key={i} rotation={[0, 0, Math.atan2(m.end.y - m.start.y, m.end.x - m.start.x)]}>
          <planeGeometry args={[1.4, 0.03]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

export function Globe3D() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 5.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 2, 4]} intensity={2.1} />
      <Stars radius={80} depth={50} count={3500} factor={2.4} saturation={0} fade speed={0.4} />
      <Meteors />
      <Earth />
    </Canvas>
  );
}
