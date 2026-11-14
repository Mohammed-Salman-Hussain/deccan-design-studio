import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Line, Sparkles } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { LOOP_HEX, LOOP_ORDER, BRAND } from "./colors";

const R = 2.1;
const ARC = (Math.PI * 2) / 5;
const GAP = 0.14;
const N = 70;

function Arcs() {
  return (
    <group>
      {LOOP_ORDER.map((k, i) => (
        <group key={k} rotation={[0, 0, i * ARC + GAP / 2]}>
          <mesh>
            <torusGeometry args={[R, 0.075, 24, 160, ARC - GAP]} />
            <meshStandardMaterial color={LOOP_HEX[k]} emissive={LOOP_HEX[k]} emissiveIntensity={1.4} toneMapped={false} roughness={0.3} />
          </mesh>
          <mesh>
            <torusGeometry args={[R, 0.24, 16, 120, ARC - GAP]} />
            <meshBasicMaterial color={LOOP_HEX[k]} transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Particles({ reduce }: { reduce: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => ({ a: (i / N) * Math.PI * 2, s: 0.25 + Math.random() * 0.35, r: R + (Math.random() - 0.5) * 0.18, z: (Math.random() - 0.5) * 0.18, sc: 0.6 + Math.random() * 0.8 })), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = reduce ? 0 : state.clock.elapsedTime;
    seeds.forEach((p, i) => {
      const a = (p.a + t * p.s) % (Math.PI * 2);
      dummy.position.set(Math.cos(a) * p.r, Math.sin(a) * p.r, p.z);
      const pulse = 0.04 * p.sc * (1 + 0.3 * Math.sin(t * 3 + i));
      dummy.scale.setScalar(pulse / 0.04);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      const idx = Math.floor(((a + Math.PI * 2) % (Math.PI * 2)) / ARC) % 5;
      color.set(LOOP_HEX[LOOP_ORDER[idx]]);
      m.setColorAt(i, color);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <sphereGeometry args={[0.04, 10, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Spokes({ reduce }: { reduce: boolean }) {
  const refs = useRef<any[]>([]);
  useFrame((_, d) => {
    if (reduce) return;
    refs.current.forEach((l) => {
      if (l?.material) l.material.dashOffset -= d * 0.6;
    });
  });
  return (
    <group>
      {LOOP_ORDER.map((k, i) => {
        const a = i * ARC + ARC / 2;
        const end: [number, number, number] = [Math.cos(a) * (R - 0.2), Math.sin(a) * (R - 0.2), 0];
        const mid: [number, number, number] = [Math.cos(a + 0.35) * R * 0.55, Math.sin(a + 0.35) * R * 0.55, 0.25];
        return (
          <Line
            key={k}
            ref={(el: any) => (refs.current[i] = el)}
            points={[[0, 0, 0], mid, end]}
            color={LOOP_HEX[k]}
            lineWidth={1.2}
            dashed
            dashSize={0.12}
            gapSize={0.1}
            transparent
            opacity={0.7}
          />
        );
      })}
    </group>
  );
}

function Core({ reduce }: { reduce: boolean }) {
  const ico = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.Mesh>(null);
  useFrame((s, d) => {
    if (reduce) return;
    if (ico.current) {
      ico.current.rotation.y += d * 0.35;
      ico.current.rotation.x += d * 0.12;
    }
    if (glow.current) glow.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 1.6) * 0.06);
  });
  return (
    <group>
      <mesh ref={glow}>
        <sphereGeometry args={[0.42, 32, 32]} />
        <meshStandardMaterial color={BRAND.amber} emissive="#e0892a" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshBasicMaterial color="#e0892a" transparent opacity={0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ico}>
        <icosahedronGeometry args={[0.72, 1]} />
        <meshBasicMaterial color={BRAND.peach} wireframe transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

function Rig({ reduce, children }: { reduce: boolean; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s, d) => {
    if (!g.current) return;
    const tx = -0.55 + s.pointer.y * 0.18;
    const ty = s.pointer.x * 0.3;
    g.current.rotation.x += (tx - g.current.rotation.x) * Math.min(1, d * 3);
    g.current.rotation.y += (ty - g.current.rotation.y) * Math.min(1, d * 3);
    if (!reduce) g.current.rotation.z += d * 0.08;
  });
  return <group ref={g}>{children}</group>;
}

export default function HeroRing({ reduce = false }: { reduce?: boolean }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="absolute inset-0" data-scene-ready={ready ? "" : undefined}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0, 6.4], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => requestAnimationFrame(() => setReady(true))}
        aria-label="Animated LoopLocal ring: five loops of waste, solar, savings, reuse and rain circling a central core"
        role="img"
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[3, 3, 4]} intensity={30} color={BRAND.peach} />
        <pointLight position={[-4, -2, 2]} intensity={18} color="#6fd0c8" />
        <Float speed={reduce ? 0 : 1.2} rotationIntensity={0.15} floatIntensity={0.5}>
          <Rig reduce={reduce}>
            <Arcs />
            <Particles reduce={reduce} />
            <Spokes reduce={reduce} />
            <Core reduce={reduce} />
          </Rig>
        </Float>
        <Sparkles count={70} scale={[9, 6, 4]} size={2.2} speed={reduce ? 0 : 0.3} color={BRAND.peach} opacity={0.5} />
      </Canvas>
    </div>
  );
}
