import * as THREE from 'three';

// Salesforce side: luminous blues. HubSpot side: neutral grays only.
export const SF = {
  blue: '#0176d3',
  electric: '#066afe',
  cloud: '#00b3ff',
  sky: '#7fd3ff',
  ice: '#9cdcff',
  deep: '#032d60',
};
export const HS = {
  base: '#3a404c',
  mid: '#5e687c',
  light: '#8a93a6',
  pale: '#b9c0cc',
};

const cache = new Map<string, THREE.Material>();
function memo<T extends THREE.Material>(key: string, make: () => T): T {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
}

export const mats = {
  sfBody: () => memo('sfBody', () => new THREE.MeshStandardMaterial({ color: '#1559b5', metalness: 0.35, roughness: 0.25, emissive: '#0a3a8a', emissiveIntensity: 0.55 })),
  sfDark: () => memo('sfDark', () => new THREE.MeshStandardMaterial({ color: '#0b2a5c', metalness: 0.2, roughness: 0.5, emissive: '#06306e', emissiveIntensity: 0.35 })),
  sfIsland: () => memo('sfIsland', () => new THREE.MeshStandardMaterial({ color: '#0a2350', metalness: 0.1, roughness: 0.7, emissive: '#05224f', emissiveIntensity: 0.6 })),
  sfGlow: () => memo('sfGlow', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(SF.cloud).multiplyScalar(1.6), toneMapped: false })),
  sfGlowSoft: () => memo('sfGlowSoft', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(SF.sky).multiplyScalar(1.3), toneMapped: false, transparent: true, opacity: 0.9 })),
  sfWindow: () => memo('sfWindow', () => new THREE.MeshBasicMaterial({ color: new THREE.Color(SF.ice).multiplyScalar(1.2), toneMapped: false })),
  hsBody: () => memo('hsBody', () => new THREE.MeshStandardMaterial({ color: HS.mid, metalness: 0.05, roughness: 0.85 })),
  hsDark: () => memo('hsDark', () => new THREE.MeshStandardMaterial({ color: HS.base, metalness: 0.05, roughness: 0.9 })),
  hsIsland: () => memo('hsIsland', () => new THREE.MeshStandardMaterial({ color: '#2c313b', metalness: 0.05, roughness: 0.95 })),
  hsLight: () => memo('hsLight', () => new THREE.MeshStandardMaterial({ color: HS.light, metalness: 0.05, roughness: 0.8 })),
  hsWindow: () => memo('hsWindow', () => new THREE.MeshBasicMaterial({ color: HS.pale })),
  wheel: () => memo('wheel', () => new THREE.MeshStandardMaterial({ color: '#0d1220', roughness: 0.9 })),
};

export type Tone = 'sf' | 'hs';
export const body = (t: Tone) => (t === 'sf' ? mats.sfBody() : mats.hsBody());
export const dark = (t: Tone) => (t === 'sf' ? mats.sfDark() : mats.hsDark());
export const windowMat = (t: Tone) => (t === 'sf' ? mats.sfWindow() : mats.hsWindow());
