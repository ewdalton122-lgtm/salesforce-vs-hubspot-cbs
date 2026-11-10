export type Cue = { start: number; end: number; text: string };

const toSec = (t: string) => {
  const [h, m, s] = t.split(':');
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

export function parseVtt(raw: string): Cue[] {
  const cues: Cue[] = [];
  for (const block of raw.replace(/\r/g, '').split(/\n\n+/)) {
    const lines = block.split('\n').filter(Boolean);
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx < 0) continue;
    const [a, b] = lines[timeIdx].split('-->').map((x) => x.trim().split(' ')[0]);
    cues.push({ start: toSec(a), end: toSec(b), text: lines.slice(timeIdx + 1).join(' ').trim() });
  }
  return cues;
}
