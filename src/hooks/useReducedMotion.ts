import { useEffect } from 'react';
import { useThemeStore } from '../theme/useThemeStore';

/**
 * Returns effective reduced-motion boolean combining OS preference and user toggle.
 */
export function useReducedMotion(): {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean) => void;
} {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const setReducedMotion = useThemeStore((s) => s.setReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setReducedMotion(true);
      }
    };
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, [setReducedMotion]);

  return { reducedMotion, setReducedMotion };
}
