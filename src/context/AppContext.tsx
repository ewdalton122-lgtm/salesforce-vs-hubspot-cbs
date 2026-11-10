import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { industryById, type Industry } from '../lib/content';
import { hasWebGL, prefersReducedMotion, readFlags, type Flags } from '../lib/env';

type AppState = {
  industry: Industry;
  setIndustry: (id: string) => void;
  flags: Flags;
  reducedMotion: boolean;
  webgl: boolean;
};

const Ctx = createContext<AppState | null>(null);
const KEY = 'sfhs-industry';

export function AppProvider({ children }: { children: ReactNode }) {
  const [industryId, setIndustryId] = useState<string>(() => {
    try {
      return localStorage.getItem(KEY) ?? 'all';
    } catch {
      return 'all';
    }
  });
  const [reducedMotion, setReduced] = useState(prefersReducedMotion);
  const flags = useMemo(readFlags, []);
  const webgl = useMemo(hasWebGL, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      industry: industryById(industryId),
      setIndustry: (id) => {
        setIndustryId(id);
        try {
          localStorage.setItem(KEY, id);
        } catch {
          /* storage unavailable */
        }
      },
      flags,
      reducedMotion,
      webgl,
    }),
    [industryId, flags, reducedMotion, webgl],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}
