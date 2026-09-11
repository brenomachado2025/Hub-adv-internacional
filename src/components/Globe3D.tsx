"use client";

import { useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
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

export function Globe3D({ size = 640 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} aria-hidden>
      <Canvas camera={{ position: [0, 0, 5.4], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 2, 4]} intensity={2.1} />
        <Earth />
      </Canvas>
    </div>
  );
}
