import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Environment, Html, Lightformer, OrbitControls, ContactShadows } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { LOOP_HEX, BRAND } from "./colors";
import type { HubPart } from "@/components/ll/ClientCanvas";

interface Props {
  selected: HubPart | null;
  onSelect: (p: HubPart) => void;
  exploded: boolean;
  reduce?: boolean;
}

const LABELS: Record<HubPart, string> = {
  solar: "Solar roof",
  oht: "Overhead tank",
  sump: "Sump",
  pump: "Pump room",
  biogas: "Biogas unit",
  stp: "Sewage plant",
  pit: "Recharge pit",
  garden: "Garden reuse",
  gateway: "Edge gateway",
  kitchen: "Kitchens",
};

function useWindowTexture(seed: number) {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#e9dcc9";
    g.fillRect(0, 0, 256, 512);
    g.fillStyle = "#d8c6ad";
    for (let y = 0; y < 512; y += 46) g.fillRect(0, y + 38, 256, 6);
    let s = seed;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let y = 8; y < 500; y += 46) {
      for (let x = 12; x < 250; x += 40) {
        const lit = rnd() > 0.55;
        g.fillStyle = lit ? "#f6c46b" : "#28463d";
        g.fillRect(x, y, 26, 26);
        g.fillStyle = "rgba(0,0,0,0.15)";
        g.fillRect(x, y + 22, 26, 4);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [seed]);
}

function useGroundTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d")!;
    g.fillStyle = "#16362b";
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = "rgba(243,210,175,0.07)";
    g.lineWidth = 1;
    for (let i = 0; i <= 512; i += 32) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(512, i); g.stroke();
    }
    g.fillStyle = "rgba(243,210,175,0.08)";
    g.fillRect(0, 380, 512, 40);
    g.fillStyle = "rgba(243,210,175,0.18)";
    for (let x = 0; x < 512; x += 40) g.fillRect(x, 398, 20, 3);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(2, 2);
    return t;
  }, []);
}

function Part({ id, selected, hovered, setHovered, onSelect, position, children, labelY = 1.6 }: { id: HubPart; selected: HubPart | null; hovered: HubPart | null; setHovered: (p: HubPart | null) => void; onSelect: (p: HubPart) => void; position: [number, number, number]; children: React.ReactNode; labelY?: number }) {
  const active = selected === id || hovered === id;
  return (
    <group
      position={position}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect(id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "";
      }}
    >
      {children}
      <Html position={[0, labelY, 0]} center distanceFactor={18} zIndexRange={[20, 0]}>
        <button
          onClick={() => onSelect(id)}
          className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-popover/80 text-foreground"}`}
        >
          {LABELS[id]}
        </button>
      </Html>
    </group>
  );
}

function hl(active: boolean, base: string) {
  return { color: base, emissive: active ? BRAND.amber : "#000000", emissiveIntensity: active ? 0.45 : 0 };
}

function FlowPipe({ points, color, reduce, radius = 0.06, count = 7, speed = 0.18 }: { points: [number, number, number][]; color: string; reduce?: boolean; radius?: number; count?: number; speed?: number }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "catmullrom", 0.1), [points]);
  const geo = useMemo(() => new THREE.TubeGeometry(curve, 80, radius, 8, false), [curve, radius]);
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((s) => {
    const m = ref.current;
    if (!m) return;
    const t = reduce ? 0 : s.clock.elapsedTime * speed;
    for (let i = 0; i < count; i++) {
      const u = (t + i / count) % 1;
      dummy.position.copy(curve.getPointAt(u));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh geometry={geo}>
        <meshStandardMaterial color={color} transparent opacity={0.35} roughness={0.4} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <sphereGeometry args={[radius * 1.9, 10, 10]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Lifted({ by, children }: { by: number; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (g.current) g.current.position.y += (by - g.current.position.y) * Math.min(1, d * 4);
  });
  return <group ref={g}>{children}</group>;
}

function Scene({ selected, onSelect, exploded, reduce }: Props) {
  const [hovered, setHovered] = useState<HubPart | null>(null);
  const winA = useWindowTexture(7);
  const winB = useWindowTexture(19);
  const ground = useGroundTexture();
  const P = { selected, hovered, setHovered, onSelect };
  const lift = exploded ? 2.6 : 0;
  const water = "#6fd0c8";

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 22]} />
        <meshStandardMaterial map={ground} roughness={0.95} />
      </mesh>

      {/* Towers */}
      <mesh position={[-4, 3.5, -2]} castShadow receiveShadow>
        <boxGeometry args={[4, 7, 4]} />
        <meshStandardMaterial map={winA} roughness={0.8} />
      </mesh>
      <mesh position={[1, 4.5, -3]} castShadow receiveShadow>
        <boxGeometry args={[4, 9, 4]} />
        <meshStandardMaterial map={winB} roughness={0.8} />
      </mesh>
      <mesh position={[-4, 7.05, -2]}><boxGeometry args={[4.2, 0.12, 4.2]} /><meshStandardMaterial color="#cdb796" /></mesh>
      <mesh position={[1, 9.05, -3]}><boxGeometry args={[4.2, 0.12, 4.2]} /><meshStandardMaterial color="#cdb796" /></mesh>

      {/* Solar on tower B roof */}
      <Lifted by={lift}>
        <Part id="solar" {...P} position={[1, 9.2, -3]} labelY={1.4}>
          {Array.from({ length: 4 }).map((_, r) =>
            Array.from({ length: 3 }).map((__, c) => (
              <mesh key={`${r}-${c}`} position={[-1.2 + c * 1.2, 0.25, -1.4 + r * 0.95]} rotation={[-0.35, 0, 0]} castShadow>
                <boxGeometry args={[1.05, 0.06, 0.75]} />
                <meshStandardMaterial {...hl(selected === "solar" || hovered === "solar", "#22404f")} metalness={0.6} roughness={0.25} />
              </mesh>
            )),
          )}
        </Part>
        {/* OHT on tower A roof */}
        <Part id="oht" {...P} position={[-4, 7.75, -2.2]} labelY={1.5}>
          <mesh castShadow>
            <cylinderGeometry args={[0.9, 0.9, 1.3, 32]} />
            <meshStandardMaterial {...hl(selected === "oht" || hovered === "oht", BRAND.cream)} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.95, 0.95, 0.08, 32]} /><meshStandardMaterial color="#b9a284" /></mesh>
        </Part>
      </Lifted>

      {/* Kitchens marker on tower A */}
      <Part id="kitchen" {...P} position={[-4, 0.6, 0.05]} labelY={1.3}>
        <mesh>
          <boxGeometry args={[3.2, 0.9, 0.1]} />
          <meshStandardMaterial color={LOOP_HEX.waste} emissive={LOOP_HEX.waste} emissiveIntensity={selected === "kitchen" || hovered === "kitchen" ? 0.9 : 0.35} />
        </mesh>
      </Part>

      {/* Pump room + gateway */}
      <Part id="pump" {...P} position={[-4.6, 0.65, 3]} labelY={1.6}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.8, 1.3, 1.4]} />
          <meshStandardMaterial {...hl(selected === "pump" || hovered === "pump", "#b98a5a")} roughness={0.7} />
        </mesh>
        <mesh position={[0.95, -0.3, 0]}><cylinderGeometry args={[0.22, 0.22, 0.6, 16]} /><meshStandardMaterial color="#3a5a50" metalness={0.5} /></mesh>
      </Part>
      <Part id="gateway" {...P} position={[-4.1, 1.55, 3.3]} labelY={1.2}>
        <mesh castShadow><boxGeometry args={[0.5, 0.3, 0.35]} /><meshStandardMaterial {...hl(selected === "gateway" || hovered === "gateway", "#f3d2af")} /></mesh>
        <mesh position={[0.15, 0.45, 0]}><cylinderGeometry args={[0.025, 0.025, 0.7, 8]} /><meshStandardMaterial color="#dddddd" /></mesh>
        <mesh position={[0.15, 0.82, 0]}><sphereGeometry args={[0.06, 12, 12]} /><meshBasicMaterial color={BRAND.amber} toneMapped={false} /></mesh>
      </Part>

      {/* Sump (partly below ground) */}
      <Lifted by={exploded ? 1.2 : 0}>
        <Part id="sump" {...P} position={[-1.6, 0.18, 3]} labelY={1.1}>
          <mesh receiveShadow>
            <boxGeometry args={[2.6, 0.36, 1.8]} />
            <meshStandardMaterial {...hl(selected === "sump" || hovered === "sump", "#7f8f86")} roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2.3, 1.5]} />
            <meshStandardMaterial color={water} emissive={water} emissiveIntensity={0.25} transparent opacity={0.85} />
          </mesh>
        </Part>
      </Lifted>

      {/* Biogas */}
      <Part id="biogas" {...P} position={[4.2, 0, 3]} labelY={2.4}>
        <mesh position={[0, 0.35, 0]} castShadow><cylinderGeometry args={[1.1, 1.1, 0.7, 32]} /><meshStandardMaterial color="#5f7d5a" roughness={0.8} /></mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <sphereGeometry args={[1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial {...hl(selected === "biogas" || hovered === "biogas", LOOP_HEX.waste)} roughness={0.5} />
        </mesh>
      </Part>

      {/* STP */}
      <Part id="stp" {...P} position={[6.6, 0, -1]} labelY={1.9}>
        {[-1, 1].map((z) => (
          <group key={z} position={[0, 0.5, z]}>
            <mesh castShadow receiveShadow><boxGeometry args={[1.8, 1, 1.6]} /><meshStandardMaterial {...hl(selected === "stp" || hovered === "stp", "#9aa89f")} roughness={0.8} /></mesh>
            <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.6, 1.4]} /><meshStandardMaterial color={water} emissive={water} emissiveIntensity={0.3} /></mesh>
          </group>
        ))}
        <mesh position={[-1.4, 0.35, 0]} castShadow><boxGeometry args={[0.6, 0.7, 0.8]} /><meshStandardMaterial color="#c8b08f" /></mesh>
      </Part>

      {/* Recharge pit */}
      <Part id="pit" {...P} position={[1.2, 0.05, 6]} labelY={1.1}>
        <mesh><cylinderGeometry args={[0.85, 0.85, 0.12, 32]} /><meshStandardMaterial {...hl(selected === "pit" || hovered === "pit", "#8a8f7e")} /></mesh>
        <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.7, 32]} /><meshStandardMaterial color="#0d1f19" /></mesh>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[-0.55 + i * 0.22, 0.09, 0]}><boxGeometry args={[0.05, 0.03, 1.3]} /><meshStandardMaterial color="#c9c3b5" metalness={0.6} /></mesh>
        ))}
      </Part>

      {/* Garden */}
      <Part id="garden" {...P} position={[-6.2, 0.02, 6.2]} labelY={2.2}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[3.6, 2.6]} /><meshStandardMaterial {...hl(selected === "garden" || hovered === "garden", "#3f6b3e")} /></mesh>
        {[[-1, -0.5], [0.6, 0.4], [1.2, -0.7]].map(([x, z], i) => (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.07, 0.09, 0.7, 8]} /><meshStandardMaterial color="#6b4a2b" /></mesh>
            <mesh position={[0, 1.0, 0]} castShadow><icosahedronGeometry args={[0.55, 0]} /><meshStandardMaterial color="#5d9a5a" flatShading /></mesh>
          </group>
        ))}
      </Part>

      {/* Flows */}
      <FlowPipe reduce={reduce} color={LOOP_HEX.solar} points={[[1, 9.1 + lift, -1.1], [3.2, 8.9, -1.0], [3.2, 0.25, -0.8], [-3.6, 0.25, 2.2]]} radius={0.045} speed={0.22} />
      <FlowPipe reduce={reduce} color={water} points={[[-2.9, 0.4, 3], [-3.7, 0.4, 3]]} radius={0.06} count={3} />
      <FlowPipe reduce={reduce} color={water} points={[[-5.4, 1.2, 2.4], [-5.6, 1.2, 0.3], [-5.6, 7.2 + lift, 0.3], [-4.6, 7.5 + lift, -1.5]]} radius={0.07} />
      <FlowPipe reduce={reduce} color={LOOP_HEX.waste} points={[[-2.6, 0.35, 0.3], [0.5, 0.35, 1.6], [3.1, 0.35, 2.8]]} radius={0.06} speed={0.12} />
      <FlowPipe reduce={reduce} color={LOOP_HEX.rain} points={[[-1, 9.1 + lift, -0.95], [-1.05, 0.25, -0.95], [0.2, 0.15, 3.8], [1.2, 0.15, 5.6]]} radius={0.06} speed={0.26} />
      <FlowPipe reduce={reduce} color={LOOP_HEX.save} points={[[3.05, 0.2, -2.2], [5.6, 0.2, -1.4]]} radius={0.06} count={4} />
      <FlowPipe reduce={reduce} color={LOOP_HEX.reuse} points={[[6.6, 0.3, 0.4], [4.5, 0.15, 5.4], [-1, 0.15, 7.2], [-5, 0.15, 6.4]]} radius={0.06} speed={0.15} />
      <FlowPipe reduce={reduce} color={LOOP_HEX.waste} points={[[3.2, 0.9, 3.4], [0, 1.0, 4.2], [-3.7, 1.0, 3.6]]} radius={0.035} count={5} speed={0.1} />
    </group>
  );
}

export default function HubModel(props: Props) {
  const [ready, setReady] = useState(false);
  return (
    <div className="absolute inset-0" data-scene-ready={ready ? "" : undefined}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [15, 12, 17], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={() => requestAnimationFrame(() => setReady(true))}
        onPointerMissed={() => (document.body.style.cursor = "")}
      >
        <hemisphereLight args={["#fff1dd", "#0d2a20", 0.7]} />
        <directionalLight position={[10, 16, 8]} intensity={2.2} color="#ffe2b8" castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={16} shadow-camera-bottom={-16} />
        <Environment resolution={128}>
          <Lightformer intensity={2} position={[0, 6, 0]} scale={[12, 12, 1]} rotation-x={Math.PI / 2} />
          <Lightformer intensity={1} color="#f3d2af" position={[-6, 2, -2]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          <Lightformer intensity={0.8} color="#6fd0c8" position={[6, 2, 2]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
        </Environment>
        <Scene {...props} />
        <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={30} blur={2.5} far={10} />
        <OrbitControls makeDefault target={[0, 2.5, 1]} enablePan={false} minDistance={12} maxDistance={40} maxPolarAngle={1.42} autoRotate={!props.selected && !props.reduce} autoRotateSpeed={0.5} enableDamping />
      </Canvas>
    </div>
  );
}
