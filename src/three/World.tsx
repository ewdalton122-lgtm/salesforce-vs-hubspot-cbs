import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, Stars } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import SfWorld from './SfWorld';
import HsWorld from './HsWorld';
import { ease, lerp, scene, seg } from './sceneStore';
import { SF } from './materials';

export const SF_X = -6.5;
export const HS_X = 6.5;

/** Camera position and look-at height for each act (0 = day one ... 6 = two futures). */
const KEYS: Array<{ pos: [number, number, number]; look: number }> = [
  { pos: [0, 8, 23], look: 1.4 },
  { pos: [0, 8.5, 22], look: 1.6 },
  { pos: [0, 8.5, 23], look: 2.0 },
  { pos: [0, 7.5, 21.5], look: 1.0 },
  { pos: [0, 9.5, 23], look: 1.6 },
  { pos: [0, 10.5, 25], look: 3.0 },
  { pos: [0, 24, 32], look: -2 },
];

/** Portrait screens stack the worlds front to back (Salesforce behind) under a high camera. */
function usePortrait() {
  const { size } = useThree();
  return size.width / Math.max(1, size.height) < 0.85;
}

function Rig({ portrait }: { portrait: boolean }) {
  const { camera, size, scene: three } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    scene.ps += (scene.p - scene.ps) * Math.min(1, dt * 4);
    const p = Math.max(0, Math.min(KEYS.length - 1, scene.ps));
    const i = Math.min(KEYS.length - 2, Math.floor(p));
    const k = ease(p - i);
    const a = KEYS[i];
    const b = KEYS[i + 1];
    if (portrait) {
      const lift = ease(seg(scene.ps, 6, 6.6)) * 10;
      const fit = Math.max(1, 0.62 / (size.width / Math.max(1, size.height)));
      camera.position.set(scene.pointerX * 0.6, (30 + lift) * fit, (24 + lift * 0.4) * fit);
      look.set(0, 0, 1.5);
    } else {
      const aspect = size.width / Math.max(1, size.height);
      const fit = Math.min(2.6, Math.max(1, 1.75 / aspect));
      camera.position.set(
        lerp(a.pos[0], b.pos[0], k) + scene.pointerX * 0.9,
        lerp(a.pos[1], b.pos[1], k) * (0.85 + fit * 0.15) + scene.pointerY * 0.5,
        lerp(a.pos[2], b.pos[2], k) * fit,
      );
      look.set(0, lerp(a.look, b.look, k), 0);
    }
    camera.lookAt(look);
    const fog = three.fog as THREE.Fog | null;
    if (fog) {
      const d = camera.position.length();
      fog.near = d * 1.05;
      fog.far = d * 2.6;
    }
  });
  return null;
}

function Lights() {
  const amb = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const sfPoint = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const night = seg(scene.ps, 2.85, 3.15) - seg(scene.ps, 3.85, 4.15);
    if (amb.current) amb.current.intensity = lerp(0.55, 0.18, night);
    if (key.current) key.current.intensity = lerp(1.4, 0.35, night);
    if (sfPoint.current) sfPoint.current.intensity = lerp(25, 60, night) + ease(seg(scene.ps, 6, 6.4)) * 40;
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.55} />
      <directionalLight ref={key} position={[4, 12, 8]} intensity={1.4} />
      <hemisphereLight args={['#bfe3ff', '#050b1e', 0.35]} />
      <pointLight ref={sfPoint} position={[SF_X, 6, 3]} color={SF.cloud} intensity={25} distance={22} />
    </>
  );
}

function Ground({ portrait }: { portrait: boolean }) {
  return (
    <group position={[0, -0.6, 0]}>
      <gridHelper args={[120, 120, '#0b3570', '#081d44']} />
      <mesh rotation={[-Math.PI / 2, 0, portrait ? Math.PI / 2 : 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[0.06, 60]} />
        <meshBasicMaterial color={new THREE.Color(SF.sky).multiplyScalar(0.8)} transparent opacity={0.55} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Scene({ act, skin, objects, tileLabels, towerBlocks, tier }: Omit<WorldProps, 'active'> & { tier: 'high' | 'low' }) {
  const portrait = usePortrait();
  return (
    <>
      <Rig portrait={portrait} />
      <Lights />
      <Stars radius={90} depth={40} count={tier === 'high' ? 2600 : 1000} factor={3} saturation={0} fade speed={0.6} />
      <Ground portrait={portrait} />
      <Suspense fallback={null}>
        <group position={portrait ? [0, 0, -6.4] : [SF_X, 0, 0]}>
          <SfWorld skin={skin} act={act} objects={objects} tileLabels={tileLabels} />
        </group>
      </Suspense>
      <group position={portrait ? [0, 0, 6.4] : [HS_X, 0, 0]}>
        <HsWorld skin={skin} act={act} towerBlocks={towerBlocks} />
      </group>
    </>
  );
}

export type WorldProps = {
  active: boolean;
  act: number;
  skin: string;
  objects: string[];
  tileLabels: string[];
  towerBlocks: number;
};

export default function World({ active, act, skin, objects, tileLabels, towerBlocks }: WorldProps) {
  const [tier, setTier] = useState<'high' | 'low'>(() => (typeof window !== 'undefined' && window.devicePixelRatio > 1.5 && window.innerWidth < 900 ? 'low' : 'high'));
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={tier === 'high' ? [1, 1.75] : [1, 1.2]}
      camera={{ position: KEYS[0].pos, fov: 40, near: 0.1, far: 220 }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: true }}
      onCreated={({ gl }) => gl.setClearColor('#020b1f', 0)}
      aria-hidden
    >
      <PerformanceMonitor onDecline={() => setTier('low')} />
      <fog attach="fog" args={['#020b1f', 34, 80]} />
      <Scene act={act} skin={skin} objects={objects} tileLabels={tileLabels} towerBlocks={towerBlocks} tier={tier} />
      {tier === 'high' && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
