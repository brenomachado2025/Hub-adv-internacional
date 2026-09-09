"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollProgressRef } from "./scroll-progress";
import { sampleEarthStops } from "./timeline";

const TEXTURE_BASE = "https://threejs.org/examples/textures/planets/";

const ATMOSPHERE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  void main() {
    vNormal = normalize( normalMatrix * normal );
    vPositionNormal = normalize(( modelViewMatrix * vec4(position, 1.0) ).xyz);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vPositionNormal;
  uniform vec3 glowColor;
  void main() {
    float intensity = pow( 0.68 - dot( vNormal, vPositionNormal ), 3.5 );
    gl_FragColor = vec4( glowColor, 1.0 ) * intensity;
  }
`;

function useSunFlareTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.15, "rgba(255,250,230,0.9)");
    gradient.addColorStop(0.4, "rgba(255,220,150,0.25)");
    gradient.addColorStop(1, "rgba(255,220,150,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);
}

export type EarthHandle = {
  group: THREE.Group | null;
};

export function Earth({ segments = 96 }: { segments?: number }) {
  const rootRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const earthMatRef = useRef<THREE.MeshPhongMaterial>(null);
  const cloudsMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const atmoMatRef = useRef<THREE.ShaderMaterial>(null);
  const flareMatRef = useRef<THREE.SpriteMaterial>(null);

  const [dayMap, nightMap, cloudsMap] = useLoader(THREE.TextureLoader, [
    `${TEXTURE_BASE}earth_atmos_2048.jpg`,
    `${TEXTURE_BASE}earth_lights_2048.png`,
    `${TEXTURE_BASE}earth_clouds_1024.png`,
  ]);

  const flareTexture = useSunFlareTexture();
  const progressRef = useScrollProgressRef();

  useFrame((_, delta) => {
    const { opacity, rotY: rotationY, scale } = sampleEarthStops(progressRef.current);

    if (rootRef.current) rootRef.current.visible = opacity > 0.003;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.018;
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, rotationY, 0.06);
      const nextScale = THREE.MathUtils.lerp(groupRef.current.scale.x || scale, scale, 0.08);
      groupRef.current.scale.setScalar(nextScale);
    }
    if (earthMatRef.current) earthMatRef.current.opacity = opacity;
    if (cloudsMatRef.current) cloudsMatRef.current.opacity = opacity * 0.3;
    if (atmoMatRef.current) atmoMatRef.current.opacity = opacity;
    if (flareMatRef.current) flareMatRef.current.opacity = opacity;
  });

  return (
    <group ref={rootRef}>
      {/* Lit roughly along the camera axis (not a fixed "sun" world position) so
          whichever hemisphere the scroll journey is currently facing the camera
          reads clearly, instead of drifting into shadow as the Earth rotates. */}
      <directionalLight position={[2, 1.4, 6]} intensity={2.6} color="#fff6e6" />
      <ambientLight intensity={0.16} />

      <sprite position={[6.2, 1.6, 4.6]} scale={[3.2, 3.2, 1]}>
        <spriteMaterial
          ref={flareMatRef}
          map={flareTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={1}
        />
      </sprite>

      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[1.5, segments, segments]} />
          <meshPhongMaterial
            ref={earthMatRef}
            map={dayMap}
            emissiveMap={nightMap}
            emissive={new THREE.Color(0xffdca0)}
            emissiveIntensity={0.35}
            specular={new THREE.Color("#223")}
            shininess={6}
            transparent
            opacity={1}
          />
        </mesh>

        {/* The classic threejs.org 1024px cloud alpha map reads as blocky, low-res
            noise once the globe fills most of the viewport (it was never meant to
            be seen this close). Rather than ship a visibly broken cloud layer, it
            stays off until we have art we can zoom into — swap in a higher-res
            (2k+) cloud texture and flip `visible` back on. */}
        <mesh ref={cloudsRef} scale={1.015} visible={false}>
          <sphereGeometry args={[1.5, 96, 96]} />
          <meshStandardMaterial
            ref={cloudsMatRef}
            alphaMap={cloudsMap}
            transparent
            depthWrite={false}
            color="#ffffff"
            roughness={1}
            opacity={0.3}
          />
        </mesh>

        <mesh scale={1.16}>
          <sphereGeometry args={[1.5, 64, 64]} />
          <shaderMaterial
            ref={atmoMatRef}
            vertexShader={ATMOSPHERE_VERTEX}
            fragmentShader={ATMOSPHERE_FRAGMENT}
            uniforms={{ glowColor: { value: new THREE.Color("#4fb2ff") } }}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            transparent
            depthWrite={false}
            opacity={1}
          />
        </mesh>
      </group>
    </group>
  );
}
