/**
 * Shared, non-React scroll state for the 3D story. The DOM writes `p` on scroll; the render loop
 * reads it every frame without causing React re-renders.
 *
 * Timeline: act 0 = day one, acts 1-5 = the five checks, act 6 = two futures.
 */
export const scene = {
  p: 0,
  /** Smoothed p, advanced inside the render loop. */
  ps: 0,
  pointerX: 0,
  pointerY: 0,
};

export const ACT_COUNT = 7;

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Local progress of p between a and b. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const backOut = (x: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
