import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function ParticleField({ count = 160 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.03;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.12) * 0.06;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#7c8cff"
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function WireTorus() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = Math.PI / 2.6 + Math.sin(clock.elapsedTime * 0.2) * 0.12;
      ref.current.rotation.z = clock.elapsedTime * 0.08;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -1.5]}>
      <torusGeometry args={[3.1, 0.012, 8, 128]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.28} />
    </mesh>
  );
}

function InnerGlow() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 0.6) * 0.04;
      ref.current.scale.setScalar(s);
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, -2.5]}>
      <sphereGeometry args={[1.6, 32, 32]} />
      <meshBasicMaterial color="#6366f1" transparent opacity={0.05} />
    </mesh>
  );
}

/** Ambient 3D backdrop: slow particle drift + orbital wire rings. */
export default function SceneBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      <Canvas camera={{ position: [0, 0, 6], fov: 55 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <ParticleField />
        <WireTorus />
        <InnerGlow />
      </Canvas>
    </div>
  );
}
