import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html, useTexture } from '@react-three/drei';
import { Beam, Label, SkinProps, Tower, Vehicle } from './kit';
import { mats, SF } from './materials';
import { backOut, ease, easeOut, scene, seg } from './sceneStore';
import { asset } from '../lib/env';

type V3 = [number, number, number];
const HQ_TOP: V3 = [0, 2.75, 0];
export const BRANDS: V3[] = [[-3.4, 0, -1.0], [3.4, 0, -0.8], [0, 0, -3.6]];
const PYLONS: Array<{ x: number; logo: string; label: string }> = [
  { x: -6, logo: 'snowflake.svg', label: 'Snowflake' },
  { x: -3, logo: 'databricks.svg', label: 'Databricks' },
  { x: 0, logo: 'googlecloud.svg', label: 'Google Cloud' },
  { x: 3, logo: 'aws.svg', label: 'AWS' },
  { x: 6, logo: 'azure.svg', label: 'Azure' },
];
const CORE: V3 = [0, 6.2, 0];
const RIVER_PTS = 36;

function fadeMat(color: string, mult = 1.4) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(mult), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
}

export default function SfWorld({ skin, act, objects, tileLabels }: { skin: string; act: number; objects: string[]; tileLabels: string[] }) {
  const hq = useRef<THREE.Group>(null);
  const props = useRef<THREE.Group>(null);
  const brandRefs = useRef<Array<THREE.Group | null>>([]);
  const graph = useRef<THREE.Group>(null);
  const pulses = useRef<Array<THREE.Mesh | null>>([]);
  const tileRefs = useRef<Array<THREE.Mesh | null>>([]);
  const conveyor = useRef<THREE.Group>(null);
  const tokens = useRef<Array<THREE.Mesh | null>>([]);
  const truck = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Group>(null);
  const orbRing = useRef<THREE.Mesh>(null);
  const shieldRefs = useRef<Array<THREE.Mesh | null>>([]);
  const twin = useRef<THREE.Group>(null);
  const pylons = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const agent = useRef<THREE.Sprite>(null);
  const flex = useRef<THREE.Group>(null);
  const continent = useRef<THREE.Mesh>(null);
  const edge = useRef<THREE.Mesh>(null);
  const root = useRef<THREE.Group>(null);

  const beamMat = useMemo(() => fadeMat(SF.cloud, 1.6), []);
  const twinBeamMat = useMemo(() => fadeMat(SF.sky, 1.3), []);
  const pulseMat = useMemo(() => fadeMat('#ffffff', 1.8), []);
  const graphLineMat = useMemo(() => fadeMat(SF.sky, 1.2), []);
  const shieldMats = useMemo(() => [0, 1, 2].map(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(SF.cloud).multiplyScalar(1.2), wireframe: true, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })), []);
  const tileMats = useMemo(() => tileLabels.map(() => new THREE.MeshStandardMaterial({ color: '#0b2a5c', emissive: new THREE.Color(SF.cloud), emissiveIntensity: 0, toneMapped: false })), [tileLabels]);
  const continentMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0a2350', emissive: '#063a8a', emissiveIntensity: 0.5, transparent: true, opacity: 0 }), []);
  const edgeMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(SF.cloud).multiplyScalar(1.5), toneMapped: false }), []);
  const riverMat = useMemo(() => new THREE.PointsMaterial({ color: new THREE.Color(SF.sky).multiplyScalar(1.6), size: 0.16, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }), []);
  const agentTex = useTexture(asset('assets/images/brand/agentforce-3d.png'));

  const rivers = useMemo(() => {
    const curves = PYLONS.map((p) => new THREE.QuadraticBezierCurve3(new THREE.Vector3(p.x, 2.6, -7.5), new THREE.Vector3(p.x * 0.5, 7.5, -4), new THREE.Vector3(...CORE)));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(PYLONS.length * RIVER_PTS * 3), 3));
    return { curves, geo };
  }, []);

  const graphNodes = useMemo(() => objects.slice(0, 5).map((_, i) => {
    const a = (i / 5) * Math.PI * 2;
    return [Math.cos(a) * 1.9, 4.3, Math.sin(a) * 1.9] as V3;
  }), [objects]);

  const tilePos = useMemo(() => tileLabels.map((_, i) => {
    const a = THREE.MathUtils.degToRad(-62 + (i * 124) / Math.max(1, tileLabels.length - 1)) + Math.PI / 2;
    return [Math.cos(a) * 4.45, 0.06, Math.sin(a) * 4.45] as V3;
  }), [tileLabels]);

  useFrame((state) => {
    const p = scene.ps;
    const t = state.clock.elapsedTime;

    // Day one: HQ and props rise.
    const rise = ease(seg(p, 0.02, 0.5));
    hq.current?.scale.set(1, Math.max(0.001, rise), 1);
    const pr = backOut(seg(p, 0.25, 0.65));
    props.current?.scale.setScalar(Math.max(0.001, pr));

    // Check 1: acquired brands drop in and lock into the hierarchy.
    BRANDS.forEach((b, i) => {
      const g = brandRefs.current[i];
      if (!g) return;
      const k = easeOut(seg(p, 1.05 + i * 0.07, 1.3 + i * 0.07));
      g.position.set(b[0], (1 - k) * 9, b[2]);
      g.visible = k > 0.001;
    });
    const link = seg(p, 1.33, 1.5);
    beamMat.opacity = link * 0.95;
    pulseMat.opacity = link;
    pulses.current.forEach((m, i) => {
      if (!m) return;
      const b = BRANDS[i];
      const k = (t * 0.45 + i / 3) % 1;
      m.position.set(b[0] * (1 - k), 1.5 + (HQ_TOP[1] - 1.5) * k, b[2] * (1 - k));
    });
    const gk = backOut(seg(p, 1.1, 1.35));
    if (graph.current) {
      graph.current.scale.setScalar(Math.max(0.001, gk));
      graph.current.rotation.y = t * 0.22;
    }
    graphLineMat.opacity = seg(p, 1.2, 1.4) * 0.8;

    // Check 2: capability tiles light up on one foundation.
    tileMats.forEach((m, i) => {
      const k = seg(p, 2.05 + i * 0.06, 2.12 + i * 0.06);
      m.emissiveIntensity = k * 1.6;
      const mesh = tileRefs.current[i];
      if (mesh) mesh.position.y = 0.06 + Math.sin(k * Math.PI) * 0.25;
    });

    // Check 3: quote-to-service conveyor, voice agent, truck dispatch.
    const ck = backOut(seg(p, 3.05, 3.3));
    conveyor.current?.scale.setScalar(Math.max(0.001, ck));
    tokens.current.forEach((m, i) => {
      if (!m) return;
      const a = t * 0.6 + (i / tokens.current.length) * Math.PI * 2;
      m.position.set(Math.cos(a) * 3.85, 0.42, Math.sin(a) * 3.85);
    });
    if (truck.current) {
      const a = -t * 0.35;
      truck.current.position.set(Math.cos(a) * 3.3, 0.05, Math.sin(a) * 3.3);
      truck.current.rotation.y = -a + Math.PI;
      truck.current.visible = ck > 0.05;
    }
    const ok = backOut(seg(p, 3.1, 3.3));
    orb.current?.scale.setScalar(Math.max(0.001, ok) * (1 + Math.sin(t * 3) * 0.04));
    if (orbRing.current) {
      const r = (t * 0.8) % 1;
      orbRing.current.scale.setScalar(1 + r * 2.2);
      (orbRing.current.material as THREE.MeshBasicMaterial).opacity = (1 - r) * 0.8 * ok;
    }

    // Check 4: nested governance shields and a sandbox twin.
    const after = 1 - seg(p, 5.0, 5.3) * 0.75;
    shieldMats.forEach((m, i) => {
      m.opacity = seg(p, 4.05 + i * 0.08, 4.2 + i * 0.08) * (0.32 - i * 0.07) * after;
    });
    shieldRefs.current.forEach((s, i) => s && (s.rotation.y = t * (0.05 + i * 0.03) * (i % 2 ? -1 : 1)));
    const tw = backOut(seg(p, 4.25, 4.45));
    twin.current?.scale.setScalar(Math.max(0.001, tw * after));
    twinBeamMat.opacity = seg(p, 4.35, 4.5) * 0.8 * after;

    // Check 5: data rivers from the warehouse into Data 360, then Agentforce.
    const pk = backOut(seg(p, 5.02, 5.2));
    pylons.current?.scale.set(1, Math.max(0.001, pk), 1);
    riverMat.opacity = seg(p, 5.1, 5.3);
    const pos = rivers.geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    rivers.curves.forEach((c, ci) => {
      for (let j = 0; j < RIVER_PTS; j++) {
        c.getPoint(((t * 0.22 + j / RIVER_PTS + ci * 0.13) % 1), v);
        pos.setXYZ(ci * RIVER_PTS + j, v.x, v.y, v.z);
      }
    });
    pos.needsUpdate = true;
    const coreK = backOut(seg(p, 5.15, 5.35));
    if (core.current) {
      core.current.scale.setScalar(Math.max(0.001, coreK));
      core.current.rotation.set(t * 0.4, t * 0.6, 0);
    }
    const ak = backOut(seg(p, 5.25, 5.45));
    if (agent.current) {
      agent.current.scale.setScalar(Math.max(0.001, ak * 1.9));
      agent.current.position.y = 8.1 + Math.sin(t * 1.4) * 0.15;
    }
    flex.current?.scale.set(Math.max(0.001, easeOut(seg(p, 5.2, 5.45))), 1, 1);

    // Two futures: one connected continent.
    const f = ease(seg(p, 6.02, 6.45));
    continentMat.opacity = f * 0.9;
    continent.current?.scale.setScalar(0.6 + f * 0.4);
    edgeMat.color.setScalar(1).multiply(new THREE.Color(SF.cloud)).multiplyScalar(1.5 + f * 1.2);
    root.current?.scale.setScalar(1 + f * 0.08);
    if (edge.current) edge.current.scale.setScalar(1 + f * 0.5);
  });

  return (
    <group ref={root}>
      {/* Island and glowing edge */}
      <mesh material={mats.sfIsland()} position={[0, -0.25, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.0, 0.5, 64]} />
      </mesh>
      <mesh ref={edge} material={edgeMat} position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.12, 5.24, 96]} />
      </mesh>
      <mesh ref={continent} material={continentMat} position={[0, -0.32, 0]}>
        <cylinderGeometry args={[9.5, 9.0, 0.3, 64]} />
      </mesh>

      <group ref={hq}>
        <Tower tone="sf" />
      </group>
      <group ref={props}>
        <SkinProps skin={skin} tone="sf" />
      </group>

      {/* Check 1 */}
      {BRANDS.map((b, i) => (
        <group key={i} ref={(el) => (brandRefs.current[i] = el)} position={[b[0], 9, b[2]]}>
          <Tower tone="sf" w={0.95} h={1.5} d={0.95} />
        </group>
      ))}
      {BRANDS.map((b, i) => (
        <Beam key={`b${i}`} from={[b[0], 1.5, b[2]]} to={HQ_TOP} material={beamMat} radius={0.035} />
      ))}
      {BRANDS.map((_, i) => (
        <mesh key={`p${i}`} ref={(el) => (pulses.current[i] = el)} material={pulseMat}>
          <sphereGeometry args={[0.1, 12, 12]} />
        </mesh>
      ))}
      <group ref={graph}>
        <mesh material={mats.sfGlow()} position={[0, 4.3, 0]}>
          <icosahedronGeometry args={[0.32, 1]} />
        </mesh>
        {graphNodes.map((n, i) => (
          <group key={i}>
            <mesh material={mats.sfGlowSoft()} position={n}>
              <sphereGeometry args={[0.2, 16, 16]} />
            </mesh>
            <Beam from={n} to={[0, 4.3, 0]} material={graphLineMat} radius={0.02} />
            <Beam from={n} to={graphNodes[(i + 1) % graphNodes.length]} material={graphLineMat} radius={0.015} />
            <Label position={[n[0], n[1] + 0.45, n[2]]} show={act === 1} size="sm">{objects[i]}</Label>
          </group>
        ))}
      </group>
      <Label position={[0, 5.4, 0]} show={act === 1}>Account hierarchy · every brand rolls up</Label>

      {/* Check 2 */}
      {tilePos.map((tp, i) => (
        <group key={i}>
          <mesh ref={(el) => (tileRefs.current[i] = el)} material={tileMats[i]} position={tp}>
            <boxGeometry args={[0.95, 0.1, 0.7]} />
          </mesh>
          <Label position={[tp[0], 0.7, tp[2] + 0.2]} show={act === 2} size="sm">{tileLabels[i]}</Label>
        </group>
      ))}

      {/* Check 3 */}
      <group ref={conveyor}>
        <mesh material={mats.sfGlow()} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.85, 0.05, 8, 120]} />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => {
          const a = (i / 7) * Math.PI * 2;
          return (
            <mesh key={i} material={mats.sfBody()} position={[Math.cos(a) * 3.85, 0.3, Math.sin(a) * 3.85]}>
              <cylinderGeometry args={[0.16, 0.16, 0.3, 14]} />
            </mesh>
          );
        })}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={`t${i}`} ref={(el) => (tokens.current[i] = el)} material={mats.sfWindow()}>
            <sphereGeometry args={[0.11, 12, 12]} />
          </mesh>
        ))}
      </group>
      <group ref={truck}>
        <Vehicle tone="sf" kind="truck" position={[0, 0, 0]} />
      </group>
      <group ref={orb} position={[1.5, 3.5, 1.2]}>
        <mesh material={mats.sfGlow()}>
          <sphereGeometry args={[0.32, 24, 24]} />
        </mesh>
        <mesh ref={orbRing} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.42, 0.02, 8, 48]} />
          <meshBasicMaterial color={SF.sky} transparent toneMapped={false} />
        </mesh>
      </group>
      <Label position={[1.5, 4.25, 1.2]} show={act === 3}>Agentforce Voice answers</Label>
      <Label position={[0, 1.1, 4.6]} show={act === 3}>Quote → contract → dispatch → billing → service</Label>

      {/* Check 4 */}
      {[5.7, 6.1, 6.5].map((r, i) => (
        <mesh key={r} ref={(el) => (shieldRefs.current[i] = el)} material={shieldMats[i]} position={[0, -0.1, 0]}>
          <sphereGeometry args={[r, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      ))}
      <group ref={twin} position={[-2.8, 5.0, -2.2]}>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(1.4, 2.2, 1.4)]} />
          <lineBasicMaterial color={SF.sky} toneMapped={false} />
        </lineSegments>
      </group>
      <Beam from={[-2.8, 3.9, -2.2]} to={HQ_TOP} material={twinBeamMat} radius={0.02} />
      <Label position={[-2.8, 6.6, -2.2]} show={act === 4}>Sandbox: test every change first</Label>
      <Label position={[0, 6.9, 0]} show={act === 4}>Roles · record-level security · approvals</Label>

      {/* Check 5 */}
      <group ref={pylons}>
        {PYLONS.map((py) => (
          <group key={py.x} position={[py.x, 0, -7.5]}>
            <mesh material={mats.sfDark()} position={[0, 1.2, 0]}>
              <boxGeometry args={[0.5, 2.4, 0.5]} />
            </mesh>
            <mesh material={mats.sfGlow()} position={[0, 2.5, 0]}>
              <boxGeometry args={[0.6, 0.12, 0.6]} />
            </mesh>
            {act === 5 && (
              <Html position={[0, 3.3, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
                <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#03183f]/85 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-sky-300/40">
                  <img src={asset(`assets/logos/${py.logo}`)} alt="" className="h-3.5 w-3.5" />
                  {py.label}
                </div>
              </Html>
            )}
          </group>
        ))}
      </group>
      <points geometry={rivers.geo} material={riverMat} />
      <mesh ref={core} material={mats.sfGlow()} position={CORE}>
        <icosahedronGeometry args={[0.75, 0]} />
      </mesh>
      <sprite ref={agent} position={[0, 8.1, 0]}>
        <spriteMaterial map={agentTex} transparent toneMapped={false} />
      </sprite>
      <Label position={[1.4, 6.2, 0]} show={act === 5}>Data 360 · Zero Copy</Label>
      <group ref={flex} position={[-2.2, 0.15, 5.6]}>
        <mesh material={mats.sfGlow()} position={[2.2, 0, 0]}>
          <boxGeometry args={[4.4, 0.12, 0.18]} />
        </mesh>
      </group>
      <Label position={[0, 0.75, 5.7]} show={act === 5} size="sm">Flex Credits: the whole contract term</Label>

      <Label position={[0, 4.2, 0]} show={act === 6}>One platform</Label>
    </group>
  );
}
