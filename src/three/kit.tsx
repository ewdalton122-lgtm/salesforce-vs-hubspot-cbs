import { forwardRef, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { body, dark, mats, windowMat, type Tone } from './materials';

type V3 = [number, number, number];

/** Office/HQ tower with lit window bands. */
export const Tower = forwardRef<THREE.Group, { tone: Tone; w?: number; h?: number; d?: number; position?: V3 }>(function Tower(
  { tone, w = 1.6, h = 2.6, d = 1.6, position },
  ref,
) {
  const bands = Math.max(2, Math.floor(h / 0.55));
  return (
    <group ref={ref} position={position}>
      <mesh material={body(tone)} position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {Array.from({ length: bands }, (_, i) => (
        <mesh key={i} material={windowMat(tone)} position={[0, 0.35 + i * (h - 0.5) / bands, d / 2 + 0.005]}>
          <planeGeometry args={[w * 0.78, 0.12]} />
        </mesh>
      ))}
      {Array.from({ length: bands }, (_, i) => (
        <mesh key={`s${i}`} material={windowMat(tone)} position={[w / 2 + 0.005, 0.35 + i * (h - 0.5) / bands, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[d * 0.78, 0.12]} />
        </mesh>
      ))}
      <mesh material={tone === 'sf' ? mats.sfGlow() : mats.hsLight()} position={[0, h + 0.05, 0]}>
        <boxGeometry args={[w * 0.6, 0.1, d * 0.6]} />
      </mesh>
    </group>
  );
});

export function House({ tone, position, rot = 0 }: { tone: Tone; position: V3; rot?: number }) {
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh material={body(tone)} position={[0, 0.3, 0]}>
        <boxGeometry args={[0.8, 0.6, 0.7]} />
      </mesh>
      <mesh material={dark(tone)} position={[0, 0.78, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.66, 0.42, 4]} />
      </mesh>
      <mesh material={windowMat(tone)} position={[0, 0.3, 0.355]}>
        <planeGeometry args={[0.22, 0.2]} />
      </mesh>
    </group>
  );
}

export function Vehicle({ tone, position, rot = 0, kind = 'van' }: { tone: Tone; position: V3; rot?: number; kind?: 'van' | 'truck' | 'rig' }) {
  const len = kind === 'rig' ? 1.6 : kind === 'truck' ? 1.15 : 0.85;
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <mesh material={body(tone)} position={[-0.08, 0.3, 0]}>
        <boxGeometry args={[len, 0.42, 0.44]} />
      </mesh>
      <mesh material={dark(tone)} position={[len / 2 + 0.06, 0.24, 0]}>
        <boxGeometry args={[0.32, 0.32, 0.42]} />
      </mesh>
      <mesh material={windowMat(tone)} position={[len / 2 + 0.225, 0.3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.34, 0.12]} />
      </mesh>
      {[-len / 2 + 0.15, len / 2 - 0.05].map((x) =>
        [-0.23, 0.23].map((z) => (
          <mesh key={`${x}${z}`} material={mats.wheel()} position={[x, 0.08, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.06, 10]} />
          </mesh>
        )),
      )}
    </group>
  );
}

export function Container({ tone, position, rot = 0 }: { tone: Tone; position: V3; rot?: number }) {
  return (
    <mesh material={dark(tone)} position={[position[0], position[1] + 0.18, position[2]]} rotation={[0, rot, 0]}>
      <boxGeometry args={[0.5, 0.36, 0.38]} />
    </mesh>
  );
}

export function Tank({ tone, position, r = 0.45, h = 0.9 }: { tone: Tone; position: V3; r?: number; h?: number }) {
  return (
    <group position={position}>
      <mesh material={body(tone)} position={[0, h / 2, 0]}>
        <cylinderGeometry args={[r, r, h, 20]} />
      </mesh>
      <mesh material={windowMat(tone)} position={[0, h + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.6, r * 0.75, 24]} />
      </mesh>
    </group>
  );
}

export function Crane({ tone, position }: { tone: Tone; position: V3 }) {
  return (
    <group position={position}>
      <mesh material={body(tone)} position={[0, 1.4, 0]}>
        <boxGeometry args={[0.14, 2.8, 0.14]} />
      </mesh>
      <mesh material={body(tone)} position={[0.6, 2.75, 0]}>
        <boxGeometry args={[1.9, 0.1, 0.1]} />
      </mesh>
      <mesh material={windowMat(tone)} position={[1.3, 2.3, 0]}>
        <boxGeometry args={[0.02, 0.9, 0.02]} />
      </mesh>
    </group>
  );
}

export function Person({ tone, position }: { tone: Tone; position: V3 }) {
  return (
    <group position={position}>
      <mesh material={body(tone)} position={[0, 0.22, 0]}>
        <capsuleGeometry args={[0.09, 0.22, 4, 8]} />
      </mesh>
      <mesh material={windowMat(tone)} position={[0, 0.48, 0]}>
        <sphereGeometry args={[0.08, 10, 10]} />
      </mesh>
    </group>
  );
}

/** Industry skin: the props that make the town recognizably "your" business. */
export function SkinProps({ skin, tone }: { skin: string; tone: Tone }) {
  switch (skin) {
    case 'waste':
      return (
        <group>
          <Vehicle tone={tone} kind="truck" position={[2.2, 0, 1.6]} rot={0.6} />
          <Vehicle tone={tone} kind="truck" position={[-2.4, 0, 1.4]} rot={-0.7} />
          {[[1.2, 0, 2.6], [1.8, 0, 2.7], [-1.0, 0, 2.7], [-1.6, 0, 2.5]].map((p, i) => (
            <Container key={i} tone={tone} position={p as V3} rot={i * 0.3} />
          ))}
        </group>
      );
    case 'water':
      return (
        <group>
          <Tank tone={tone} position={[2.2, 0, 1.2]} r={0.6} h={1.1} />
          <Tank tone={tone} position={[-2.3, 0, 1.0]} r={0.5} h={0.9} />
          <Tank tone={tone} position={[1.4, 0, 2.5]} r={0.35} h={0.6} />
          <Vehicle tone={tone} position={[-1.2, 0, 2.6]} rot={0.2} />
        </group>
      );
    case 'construction':
      return (
        <group>
          <Crane tone={tone} position={[2.4, 0, 0.6]} />
          <mesh material={dark(tone)} position={[-2.2, 0.5, 1.3]}>
            <boxGeometry args={[1.1, 1, 0.9]} />
          </mesh>
          <Vehicle tone={tone} kind="truck" position={[0.9, 0, 2.6]} rot={-0.3} />
          <House tone={tone} position={[-1.2, 0, 2.6]} rot={0.3} />
        </group>
      );
    case 'office':
      return (
        <group>
          <Tower tone={tone} w={0.8} h={1.8} d={0.8} position={[2.3, 0, 0.9]} />
          <Tower tone={tone} w={0.7} h={1.3} d={0.7} position={[-2.3, 0, 1.1]} />
          {[[0.9, 0, 2.4], [1.3, 0, 2.6], [-0.8, 0, 2.5], [-1.3, 0, 2.3], [0.1, 0, 2.8]].map((p, i) => (
            <Person key={i} tone={tone} position={p as V3} />
          ))}
        </group>
      );
    case 'logistics':
      return (
        <group>
          <Vehicle tone={tone} kind="rig" position={[2.0, 0, 1.5]} rot={0.4} />
          <Vehicle tone={tone} kind="rig" position={[-2.1, 0, 1.6]} rot={-0.4} />
          <Vehicle tone={tone} kind="truck" position={[0, 0, 2.8]} rot={0} />
          {[-1.2, 0, 1.2].map((x) => (
            <mesh key={x} material={windowMat(tone)} position={[x, 0.01, 3.6]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.7, 0.06]} />
            </mesh>
          ))}
        </group>
      );
    case 'home':
    default:
      return (
        <group>
          <House tone={tone} position={[2.3, 0, 1.2]} rot={0.5} />
          <House tone={tone} position={[-2.3, 0, 1.3]} rot={-0.4} />
          <House tone={tone} position={[1.1, 0, 2.7]} rot={0.2} />
          <Vehicle tone={tone} position={[-1.1, 0, 2.6]} rot={-0.2} />
          <Vehicle tone={tone} position={[2.6, 0, 2.4]} rot={1.1} />
        </group>
      );
  }
}

/** A screen-space label pinned to a 3D point. */
export function Label({ position, children, tone = 'sf', show = true, size = 'md' }: { position: V3; children: ReactNode; tone?: Tone | 'alert'; show?: boolean; size?: 'sm' | 'md' }) {
  if (!show) return null;
  const cls =
    tone === 'sf'
      ? 'bg-[#03183f]/85 text-white ring-1 ring-sky-300/40 shadow-[0_0_24px_rgba(0,179,255,.35)]'
      : tone === 'alert'
        ? 'bg-[#2a2f3a]/90 text-[#e6e9ef] ring-1 ring-white/30'
        : 'bg-[#2a2f3a]/85 text-[#cfd4de] ring-1 ring-white/15';
  return (
    <Html position={position} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`whitespace-nowrap rounded-full px-3 py-1 font-bold backdrop-blur ${size === 'sm' ? 'text-[11px]' : 'text-[13px]'} ${cls}`}>{children}</div>
    </Html>
  );
}

/** Straight beam between two points as a thin cylinder (so bloom catches it). */
export function Beam({ from, to, material, radius = 0.025 }: { from: V3; to: V3; material: THREE.Material; radius?: number }) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { pos: a.clone().add(b).multiplyScalar(0.5), quat, len };
  }, [from, to]);
  return (
    <mesh position={pos} quaternion={quat} material={material}>
      <cylinderGeometry args={[radius, radius, len, 6, 1, true]} />
    </mesh>
  );
}

/** Dashed line (for broken handoffs and "no roll-up" links). */
export function DashedLine({ from, to, color = '#8a93a6', opacity = 1 }: { from: V3; to: V3; color?: string; opacity?: number }) {
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)]);
    const m = new THREE.LineDashedMaterial({ color, dashSize: 0.22, gapSize: 0.18, transparent: true, opacity });
    const l = new THREE.Line(g, m);
    l.computeLineDistances();
    return l;
  }, [from, to, color, opacity]);
  return <primitive object={line} />;
}
