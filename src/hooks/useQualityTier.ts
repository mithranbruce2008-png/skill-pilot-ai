import { useCallback, useRef } from 'react';
import type { QualityTier } from '../theme/themeSchema';
import { THEMES } from '../theme/themes';
import { useThemeStore } from '../theme/useThemeStore';

/**
 * Detects whether WebGL is running on a software rasterizer (SwiftShader, llvmpipe, WARP).
 */
export function isSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const renderer = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(renderer);
  } catch {
    return true;
  }
}

/**
 * Computes average FPS from frame delta samples (in seconds) and determines if downgrade is needed.
 */
export function evaluateFpsDowngrade(
  deltasSec: number[],
  currentTier: QualityTier,
): { avgFps: number; nextTier: QualityTier; downgraded: boolean } {
  if (deltasSec.length === 0 || currentTier === 'off') {
    return { avgFps: 60, nextTier: currentTier, downgraded: false };
  }
  const totalTime = deltasSec.reduce((sum, d) => sum + d, 0);
  if (totalTime <= 0) {
    return { avgFps: 60, nextTier: currentTier, downgraded: false };
  }
  const avgFps = deltasSec.length / totalTime;
  if (avgFps < 40 && currentTier === 'full') {
    return { avgFps, nextTier: 'lite', downgraded: true };
  }
  if (avgFps < 15 && currentTier === 'lite') {
    return { avgFps, nextTier: 'off', downgraded: true };
  }
  return { avgFps, nextTier: currentTier, downgraded: false };
}

/**
 * Returns the effective quality tier, DPR cap, particle budget, and FPS auto-downgrade tracker.
 */
export function useQualityTier(onAutoDowngrade?: (nextTier: QualityTier, avgFps: number) => void) {
  const themeId = useThemeStore((s) => s.themeId);
  const qualityTier = useThemeStore((s) => s.qualityTier);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const hasWebGL = useThemeStore((s) => s.hasWebGL);
  const setQualityTier = useThemeStore((s) => s.setQualityTier);

  const theme = THEMES[themeId];
  const effectiveTier: QualityTier =
    !hasWebGL || !theme.supports3D || qualityTier === 'off' ? 'off' : qualityTier;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const maxDpr = effectiveTier === 'full' ? 1.5 : 1;
  const maxParticles =
    effectiveTier === 'off'
      ? 0
      : isMobile
        ? effectiveTier === 'full'
          ? 200
          : 100
        : effectiveTier === 'full'
          ? 600
          : 220;

  const samplesRef = useRef<number[]>([]);
  const elapsedRef = useRef<number>(0);
  const evaluatedRef = useRef<boolean>(false);

  const recordFrameDelta = useCallback(
    (deltaSec: number) => {
      if (evaluatedRef.current || effectiveTier === 'off' || reducedMotion) return;
      samplesRef.current.push(deltaSec);
      elapsedRef.current += deltaSec;
      if (elapsedRef.current >= 2.0) {
        evaluatedRef.current = true;
        const result = evaluateFpsDowngrade(samplesRef.current, effectiveTier);
        if (result.downgraded) {
          setQualityTier(result.nextTier);
          onAutoDowngrade?.(result.nextTier, Math.round(result.avgFps));
        }
      }
    },
    [effectiveTier, reducedMotion, setQualityTier, onAutoDowngrade],
  );

  const resetMonitor = useCallback(() => {
    samplesRef.current = [];
    elapsedRef.current = 0;
    evaluatedRef.current = false;
  }, []);

  return {
    qualityTier,
    effectiveTier,
    setQualityTier,
    hasWebGL,
    maxDpr,
    maxParticles,
    recordFrameDelta,
    resetMonitor,
  };
}
