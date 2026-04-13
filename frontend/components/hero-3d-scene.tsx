"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Environment } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function LesionCore() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!meshRef.current) return;

    meshRef.current.rotation.y = t * 0.18;
    meshRef.current.rotation.x = Math.sin(t * 0.35) * 0.08;
    meshRef.current.position.y = Math.sin(t * 0.6) * 0.08;
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.35}>
      <mesh ref={meshRef} scale={[1.45, 1.1, 1.2]}>
        <icosahedronGeometry args={[1, 18]} />
        <MeshTransmissionMaterial
          backside
          samples={8}
          thickness={0.8}
          roughness={0.28}
          transmission={0.92}
          ior={1.12}
          chromaticAberration={0.02}
          anisotropy={0.08}
          distortion={0.18}
          distortionScale={0.32}
          temporalDistortion={0.12}
          clearcoat={1}
          attenuationDistance={1.2}
          color="#f5d0d0"
        />
      </mesh>
    </Float>
  );
}

function ScanRing({
  radius,
  y = 0,
  speed = 0.2,
  opacity = 0.18,
}: {
  radius: number;
  y?: number;
  speed?: number;
  opacity?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.rotation.z = t * speed;
  });

  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 16, 120]} />
      <meshBasicMaterial color="#7dd3fc" transparent opacity={opacity} />
    </mesh>
  );
}

function SignalParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const count = 120;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const colorA = new THREE.Color("#7dd3fc");
    const colorB = new THREE.Color("#c4b5fd");
    const colorC = new THREE.Color("#fde68a");

    for (let i = 0; i < count; i++) {
      const r = 1.8 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.65;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const mixed =
        i % 3 === 0 ? colorA : i % 3 === 1 ? colorB : colorC;

      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    return { positions, colors };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = t * 0.04;
    pointsRef.current.rotation.x = Math.sin(t * 0.1) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.75}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function DiagnosticShell() {
  const shellRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (!shellRef.current) return;
    shellRef.current.rotation.y = -t * 0.08;
  });

  return (
    <mesh ref={shellRef} scale={[2.2, 2.2, 2.2]}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.05} />
    </mesh>
  );
}

export default function Hero3DScene() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_30%_30%,rgba(125,211,252,0.10),transparent_24%),radial-gradient(circle_at_70%_65%,rgba(196,181,253,0.10),transparent_22%)]" />

      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5.8], fov: 34 }}
        gl={{ antialias: true, alpha: true }}
      >
        <fog attach="fog" args={["#000000", 6, 12]} />

        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 4]} intensity={1.7} color="#ffffff" />
        <pointLight position={[-4, 1, 3]} intensity={1.4} color="#7dd3fc" />
        <pointLight position={[4, -1, 2]} intensity={1.0} color="#c4b5fd" />
        <spotLight position={[0, 5, 2]} intensity={1.6} angle={0.45} penumbra={1} color="#fde68a" />

        <group position={[0, 0.1, 0]}>
          <DiagnosticShell />
          <ScanRing radius={1.55} y={0} speed={0.18} opacity={0.16} />
          <ScanRing radius={1.95} y={0.12} speed={-0.14} opacity={0.1} />
          <ScanRing radius={1.25} y={-0.18} speed={0.22} opacity={0.14} />
          <SignalParticles />
          <LesionCore />
        </group>

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}