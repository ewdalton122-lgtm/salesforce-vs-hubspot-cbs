import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { Beam, DashedLine, Label, SkinProps, Tower } from './kit';
import { HS, mats } from './materials';
import { backOut, ease, easeOut, scene, seg } from './sceneStore';
import { BRANDS } from './SfWorld';

type V3 = [number, number, number];
const WEDGES = 6;
const TOWER_AT: V3 = [3.5, 0, -2.7];
const METER_AT: V3 = [-0.4, 0, 3.7];
const APPS: Array<{ at: V3; label: string }> = [
  { at: [6.4, 1.6, 1.8], label: 'Marketplace dispatch app' },
  { at: [6.0, 1.2, -2.6], label: 'Custom ERP integration' },
];

export default function HsWorld({ skin, act, towerBlocks }: { skin: string; act: number; towerBlocks: number }) {
  const hq = useRef<THREE.Group>(null);
  const props = useRef<THREE.Group>(null);
  const wedges = useRef<Array<THREE.Mesh | null>>([]);
  const brandRefs = useRef<Array<THREE.Group | null>>([]);
  const crm = useRef<THREE.Group>(null);
  const gate = useRef<THREE.Group>(null);
  const tower = useRef<THREE.Group>(null);
  const blockRefs = useRef<Array<THREE.Mesh | null>>([]);
  const arcs = useRef<THREE.Group>(null);
  const apps = useRef<Array<THREE.Group | null>>([]);
  const beta = useRef<THREE.Mesh>(null);
  const lock = useRef<THREE.Group>(null);
  const sandbox = useRef<THREE.Group>(null);
  const meter = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Mesh>(null);
  const meterText = useRef<HTMLDivElement>(null);
  const brokenLinks = useRef<THREE.Group>(null);

  const linkMat = useMemo(() => new THREE.MeshBasicMaterial({ color: HS.light, transparent: true, opacity: 0 }), []);
  const fillMat = useMemo(() => new THREE.MeshStandardMaterial({ color: HS.light, emissive: '#3b404b', roughness: 0.6 }), []);
  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#9aa3b4', transparent: true, opacity: 0.18, roughness: 0.2 }), []);
  const jitter = useMemo(() => Array.from({ length: towerBlocks }, (_, i) => [Math.sin(i * 2.1) * 0.16, Math.cos(i * 1.7) * 0.12, Math.sin(i * 3.3) * 0.12]), [towerBlocks]);

  useFrame((state) => {
    const p = scene.ps;
    const t = state.clock.elapsedTime;

    const rise = ease(seg(p, 0.02, 0.5));
    hq.current?.scale.set(1, Math.max(0.001, rise), 1);
    props.current?.scale.setScalar(Math.max(0.001, backOut(seg(p, 0.25, 0.65))));

    // Two futures: the island breaks into separate pieces.
    const f = ease(seg(p, 6.02, 6.5));
    wedges.current.forEach((w, i) => {
      if (!w) return;
      const a = ((i + 0.5) / WEDGES) * Math.PI * 2;
      const d = f * (2.2 + (i % 3) * 0.7);
      w.position.set(Math.sin(a) * d, -0.25 - f * (0.3 + (i % 2) * 0.4), Math.cos(a) * d);
      w.rotation.set(f * 0.08 * (i % 2 ? 1 : -1), 0, f * 0.06 * (i % 3 ? 1 : -1));
    });

    // Check 1: brands land; only one parent link holds, the others drift off.
    BRANDS.forEach((b, i) => {
      const g = brandRefs.current[i];
      if (!g) return;
      const k = easeOut(seg(p, 1.05 + i * 0.07, 1.3 + i * 0.07));
      const drift = i === 0 ? 0 : easeOut(seg(p, 1.42, 1.75)) * 2.6 + f * 3;
      const len = Math.hypot(b[0], b[2]);
      g.position.set(b[0] + (b[0] / len) * drift, (1 - k) * 9 - (i === 0 ? 0 : drift * 0.12), b[2] + (b[2] / len) * drift);
      g.rotation.z = i === 0 ? 0 : drift * 0.05;
      g.visible = k > 0.001;
    });
    linkMat.opacity = seg(p, 1.33, 1.5) * 0.9;
    if (brokenLinks.current) brokenLinks.current.visible = seg(p, 1.42, 1.5) > 0 && p < 2.2;
    crm.current?.scale.setScalar(Math.max(0.001, backOut(seg(p, 1.1, 1.3))));
    gate.current?.scale.setScalar(Math.max(0.001, backOut(seg(p, 1.2, 1.4))));

    // Check 2: the tower of hubs, tiers, fees and add-ons.
    let placed = 0;
    blockRefs.current.forEach((m, i) => {
      if (!m) return;
      const k = easeOut(seg(p, 2.05 + i * 0.045, 2.14 + i * 0.045));
      if (k > 0.99) placed++;
      const j = jitter[i];
      m.position.set(j[0], 0.23 + i * 0.47 + (1 - k) * 6, j[2]);
      m.rotation.y = j[1];
      m.visible = k > 0.001;
    });
    if (tower.current) {
      const wob = (placed / Math.max(1, towerBlocks)) ** 1.5;
      tower.current.rotation.z = Math.sin(t * 2.2) * 0.028 * wob + 0.035 * wob + f * 0.12;
      tower.current.rotation.x = Math.cos(t * 1.7) * 0.015 * wob;
    }

    // Check 3: the path breaks into separate apps; the voice agent is in beta.
    arcs.current?.scale.setScalar(Math.max(0.001, backOut(seg(p, 3.05, 3.3))));
    apps.current.forEach((g, i) => {
      if (!g) return;
      const k = backOut(seg(p, 3.15 + i * 0.08, 3.35 + i * 0.08));
      g.scale.setScalar(Math.max(0.001, k));
      g.position.y = APPS[i].at[1] + Math.sin(t * 1.3 + i) * 0.12;
    });
    if (beta.current) {
      const k = seg(p, 3.1, 3.3);
      beta.current.scale.setScalar(Math.max(0.001, k));
      (beta.current.material as THREE.MeshStandardMaterial).opacity = 0.45 + 0.35 * Math.abs(Math.sin(t * 5.3) * Math.sin(t * 2.1));
    }

    // Check 4: a lock on field-level permissions, one sandbox.
    lock.current?.scale.setScalar(Math.max(0.001, backOut(seg(p, 4.1, 4.3))) * (1 - seg(p, 5.0, 5.3) * 0.6));
    sandbox.current?.scale.setScalar(Math.max(0.001, backOut(seg(p, 4.25, 4.45))) * (1 - seg(p, 5.0, 5.3) * 0.6));

    // Check 5: credits fill, pause, reset. Every month.
    const mk = backOut(seg(p, 5.05, 5.25));
    meter.current?.scale.setScalar(Math.max(0.001, mk));
    const cycle = 4.2;
    const c = (t % cycle) / cycle;
    const month = Math.floor(t / cycle) % 12 + 1;
    const used = c < 0.55 ? c / 0.55 : c < 0.9 ? 1 : 1 - (c - 0.9) / 0.1;
    if (fill.current) {
      fill.current.scale.set(1, Math.max(0.001, used), 1);
      fill.current.position.y = 0.05 + used;
    }
    const paused = c >= 0.55 && c < 0.9;
    fillMat.emissive.set(paused ? (Math.sin(t * 12) > 0 ? '#6b7080' : '#2a2e37') : '#3b404b');
    if (meterText.current) {
      meterText.current.textContent = paused ? `Month ${month} · agents paused until reset` : `Month ${month} · credits used ${Math.round(used * 100)}%`;
      meterText.current.dataset.paused = String(paused);
    }
  });

  return (
    <group>
      {Array.from({ length: WEDGES }, (_, i) => (
        <mesh key={i} ref={(el) => (wedges.current[i] = el)} material={mats.hsIsland()} position={[0, -0.25, 0]}>
          <cylinderGeometry args={[5.2, 5.0, 0.5, 12, 1, false, (i / WEDGES) * Math.PI * 2, (Math.PI * 2) / WEDGES]} />
        </mesh>
      ))}
      <group ref={hq}>
        <Tower tone="hs" />
      </group>
      <group ref={props}>
        <SkinProps skin={skin} tone="hs" />
      </group>

      {/* Check 1 */}
      {BRANDS.map((b, i) => (
        <group key={i} ref={(el) => (brandRefs.current[i] = el)} position={[b[0], 9, b[2]]}>
          <Tower tone="hs" w={0.95} h={1.5} d={0.95} />
        </group>
      ))}
      <Beam from={[BRANDS[0][0], 1.5, BRANDS[0][2]]} to={[0, 2.75, 0]} material={linkMat} radius={0.03} />
      <group ref={brokenLinks}>
        <DashedLine from={[0, 2.6, 0]} to={[BRANDS[1][0] * 1.6, 1.3, BRANDS[1][2] * 1.6]} opacity={0.7} />
        <DashedLine from={[0, 2.6, 0]} to={[BRANDS[2][0] * 1.6, 1.3, BRANDS[2][2] * 1.6]} opacity={0.7} />
      </group>
      <Label position={[-1.9, 3.3, -0.4]} tone="hs" show={act === 1} size="sm">One parent</Label>
      <Label position={[4.6, 2.6, -1.2]} tone="alert" show={act === 1} size="sm">Doesn&apos;t roll up</Label>
      <group ref={crm} position={[0, 4.1, 0]}>
        {['Contacts', 'Companies', 'Deals'].map((n, i) => (
          <group key={n} position={[(i - 1) * 1.15, 0, 0]}>
            <mesh material={mats.hsLight()}>
              <boxGeometry args={[0.9, 0.5, 0.5]} />
            </mesh>
            <Label position={[0, 0.6, 0]} tone="hs" show={act === 1} size="sm">{n}</Label>
          </group>
        ))}
      </group>
      <group ref={gate} position={[-2.7, 0, 3.4]}>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} material={mats.hsDark()} position={[x, 0.7, 0]}>
            <boxGeometry args={[0.14, 1.4, 0.14]} />
          </mesh>
        ))}
        <mesh material={mats.hsLight()} position={[0, 1.25, 0]}>
          <boxGeometry args={[1.5, 0.1, 0.1]} />
        </mesh>
        <mesh material={mats.hsLight()} position={[0, 0.7, 0.05]}>
          <boxGeometry args={[0.36, 0.3, 0.12]} />
        </mesh>
        <mesh material={mats.hsLight()} position={[0, 0.92, 0.05]}>
          <torusGeometry args={[0.11, 0.035, 8, 16, Math.PI]} />
        </mesh>
        <Label position={[0, 1.8, 0]} tone="alert" show={act === 1} size="sm">Custom objects · top tier only</Label>
      </group>

      {/* Check 2 */}
      <group ref={tower} position={TOWER_AT}>
        {Array.from({ length: towerBlocks }, (_, i) => (
          <mesh key={i} ref={(el) => (blockRefs.current[i] = el)} material={i % 3 === 2 ? mats.hsDark() : i % 2 ? mats.hsLight() : mats.hsBody()}>
            <boxGeometry args={[1.35, 0.44, 0.95]} />
          </mesh>
        ))}
      </group>
      <Label position={[TOWER_AT[0], towerBlocks * 0.47 + 0.8, TOWER_AT[2]]} tone="alert" show={act === 2}>
        Hubs · tiers · fees · add-ons
      </Label>

      {/* Check 3 */}
      <group ref={arcs}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} material={mats.hsLight()} position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, (i * Math.PI * 2) / 3]}>
            <torusGeometry args={[3.85, 0.05, 8, 40, Math.PI * 0.42]} />
          </mesh>
        ))}
      </group>
      {APPS.map((a, i) => (
        <group key={a.label} ref={(el) => (apps.current[i] = el)} position={a.at}>
          <mesh material={mats.hsBody()}>
            <boxGeometry args={[1.1, 0.8, 0.8]} />
          </mesh>
          <Label position={[0, 0.85, 0]} tone="alert" show={act === 3} size="sm">{a.label}</Label>
        </group>
      ))}
      {act === 3 && APPS.map((a) => <DashedLine key={a.label} from={[0, 1.4, 0]} to={a.at} opacity={0.8} />)}
      <mesh ref={beta} position={[1.5, 3.5, 1.2]}>
        <sphereGeometry args={[0.3, 20, 20]} />
        <meshStandardMaterial color={HS.light} transparent opacity={0.6} />
      </mesh>
      <Label position={[1.5, 4.2, 1.2]} tone="alert" show={act === 3} size="sm">Voice agent: beta</Label>

      {/* Check 4 */}
      <group ref={lock} position={[0, 3.6, 1.1]}>
        <mesh material={mats.hsLight()}>
          <boxGeometry args={[0.8, 0.62, 0.3]} />
        </mesh>
        <mesh material={mats.hsLight()} position={[0, 0.42, 0]}>
          <torusGeometry args={[0.25, 0.07, 10, 20, Math.PI]} />
        </mesh>
        <Label position={[0, 1.05, 0]} tone="alert" show={act === 4} size="sm">Field-level permissions · top tier</Label>
      </group>
      <group ref={sandbox} position={[3.0, 4.6, -2.4]}>
        <lineSegments>
          <edgesGeometry args={[new THREE.BoxGeometry(0.8, 1.2, 0.8)]} />
          <lineBasicMaterial color={HS.light} />
        </lineSegments>
        <Label position={[0, 1.05, 0]} tone="hs" show={act === 4} size="sm">One standard sandbox</Label>
      </group>

      {/* Check 5 */}
      <group ref={meter} position={METER_AT}>
        <mesh material={glassMat} position={[0, 1.05, 0]}>
          <cylinderGeometry args={[0.42, 0.42, 2.1, 24, 1, true]} />
        </mesh>
        <mesh ref={fill} material={fillMat} position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.36, 0.36, 2.0, 24]} />
        </mesh>
        {act === 5 && (
          <Html position={[0, 2.6, 0]} center zIndexRange={[5, 0]} style={{ pointerEvents: 'none' }}>
            <div
              ref={meterText}
              className="whitespace-nowrap rounded-full bg-[#2a2f3a]/90 px-3 py-1 text-[12px] font-bold text-[#e6e9ef] ring-1 ring-white/25 data-[paused=true]:bg-[#454b58]"
            />
          </Html>
        )}
      </group>

      <Label position={[0, 4.4, 0]} tone="hs" show={act === 6}>Separate hubs, tiers and apps</Label>
    </group>
  );
}
