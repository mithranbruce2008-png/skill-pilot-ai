import { create } from 'zustand';
import {
  parseStoredVisualSettings,
  type PersistedVisualSettings,
  type QualityTier,
} from './themeSchema';
import { THEMES, type Theme, type ThemeId } from './themes';

const STORAGE_KEY = 'skillpilot_visual_settings_v1';

/**
 * Detects browser reduced-motion and high-contrast media queries safely.
 */
export function detectSystemPreferences(): {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  hasWebGL: boolean;
  isLowEnd: boolean;
} {
  if (typeof window === 'undefined') {
    return {
      prefersReducedMotion: false,
      prefersHighContrast: false,
      hasWebGL: false,
      isLowEnd: false,
    };
  }
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersHighContrast =
    typeof window.matchMedia === 'function' &&
    (window.matchMedia('(prefers-contrast: more)').matches ||
      window.matchMedia('(forced-colors: active)').matches);

  let hasWebGL = false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    hasWebGL = Boolean(gl);
    if (gl && 'getExtension' in gl) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    hasWebGL = false;
  }

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : 8;
  const memory = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : 8;
  const isLowEnd = cores <= 4 || memory <= 4;

  return { prefersReducedMotion, prefersHighContrast, hasWebGL, isLowEnd };
}

/**
 * Pure selector for choosing initial quality tier based on hardware and accessibility signals.
 */
export function selectInitialQualityTier(opts: {
  hasWebGL: boolean;
  prefersReducedMotion: boolean;
  highContrast: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  themeId?: ThemeId;
}): QualityTier {
  if (!opts.hasWebGL || opts.prefersReducedMotion || opts.highContrast || opts.themeId === 'clean-light') {
    return 'off';
  }
  const lowCores = typeof opts.hardwareConcurrency === 'number' && opts.hardwareConcurrency <= 4;
  const lowMem = typeof opts.deviceMemory === 'number' && opts.deviceMemory <= 4;
  if (lowCores || lowMem) {
    return 'lite';
  }
  return 'full';
}

function getInitialSettings(): PersistedVisualSettings {
  const sys = detectSystemPreferences();
  const defaultTheme: ThemeId =
    sys.prefersReducedMotion || sys.prefersHighContrast ? 'clean-light' : 'cosmos';

  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = parseStoredVisualSettings(raw);
      if (parsed) {
        return {
          ...parsed,
          qualityTier: !sys.hasWebGL ? 'off' : parsed.qualityTier,
        };
      }
      if (raw !== null) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  const nav = typeof navigator !== 'undefined' ? (navigator as Navigator & { deviceMemory?: number }) : undefined;
  return {
    themeId: defaultTheme,
    qualityTier: selectInitialQualityTier({
      hasWebGL: sys.hasWebGL,
      prefersReducedMotion: sys.prefersReducedMotion,
      highContrast: sys.prefersHighContrast,
      hardwareConcurrency: nav?.hardwareConcurrency,
      deviceMemory: nav?.deviceMemory,
      themeId: defaultTheme,
    }),
    reducedMotion: sys.prefersReducedMotion,
    highContrast: sys.prefersHighContrast,
    viewAsTable: false,
  };
}

/**
 * Synchronizes active theme CSS variables and DOM attributes onto documentElement.
 */
export function applyThemeToDocument(
  theme: Theme,
  reducedMotion: boolean,
  highContrast: boolean,
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const c = theme.colors;
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-reduced-motion', String(reducedMotion));
  root.setAttribute('data-high-contrast', String(highContrast));
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.style.setProperty('--sp-bg', c.bg);
  root.style.setProperty('--sp-bg-secondary', c.bgSecondary);
  root.style.setProperty('--sp-surface', c.surface);
  root.style.setProperty('--sp-surface-glass', c.surfaceGlass);
  root.style.setProperty('--sp-border', highContrast ? c.text : c.border);
  root.style.setProperty('--sp-text', c.text);
  root.style.setProperty('--sp-text-muted', highContrast ? c.text : c.textMuted);
  root.style.setProperty('--sp-accent', c.accent);
  root.style.setProperty('--sp-accent-hover', c.accentHover);
  root.style.setProperty('--sp-accent-text', c.accentText);
  root.style.setProperty('--sp-success', c.success);
  root.style.setProperty('--sp-warning', c.warning);
  root.style.setProperty('--sp-danger', c.danger);
  root.style.setProperty('--sp-focus', c.focus);
  root.style.setProperty('--sp-font-display', theme.fonts.display);
  root.style.setProperty('--sp-font-body', theme.fonts.body);
  root.style.setProperty('--sp-font-mono', theme.fonts.mono);
  root.style.setProperty('--sp-transition-speed', reducedMotion ? '0ms' : '220ms');
}

function persistSettings(settings: PersistedVisualSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export interface ThemeStoreState extends PersistedVisualSettings {
  hasWebGL: boolean;
  setThemeId: (themeId: ThemeId) => void;
  setQualityTier: (tier: QualityTier) => void;
  setReducedMotion: (reduced: boolean) => void;
  setHighContrast: (highContrast: boolean) => void;
  setViewAsTable: (viewAsTable: boolean) => void;
  resetCorruptedSettings: () => void;
}

const initial = getInitialSettings();
if (typeof document !== 'undefined') {
  applyThemeToDocument(THEMES[initial.themeId], initial.reducedMotion, initial.highContrast);
}

/**
 * Global Zustand store for theme, 3D quality tier, motion, contrast, and table view preferences.
 */
export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  ...initial,
  hasWebGL: detectSystemPreferences().hasWebGL,

  setThemeId: (themeId) => {
    const state = get();
    const nextTier: QualityTier =
      themeId === 'clean-light'
        ? 'off'
        : state.qualityTier === 'off' && state.hasWebGL && !state.reducedMotion && !state.highContrast
          ? 'lite'
          : state.qualityTier;
    const next: PersistedVisualSettings = {
      themeId,
      qualityTier: nextTier,
      reducedMotion: state.reducedMotion,
      highContrast: state.highContrast,
      viewAsTable: state.viewAsTable,
    };
    persistSettings(next);
    applyThemeToDocument(THEMES[themeId], next.reducedMotion, next.highContrast);
    set(next);
  },

  setQualityTier: (qualityTier) => {
    const state = get();
    const resolvedTier = !state.hasWebGL ? 'off' : qualityTier;
    const next: PersistedVisualSettings = {
      themeId: state.themeId,
      qualityTier: resolvedTier,
      reducedMotion: state.reducedMotion,
      highContrast: state.highContrast,
      viewAsTable: state.viewAsTable,
    };
    persistSettings(next);
    set({ qualityTier: resolvedTier });
  },

  setReducedMotion: (reducedMotion) => {
    const state = get();
    const next: PersistedVisualSettings = {
      themeId: state.themeId,
      qualityTier: reducedMotion && state.qualityTier === 'full' ? 'lite' : state.qualityTier,
      reducedMotion,
      highContrast: state.highContrast,
      viewAsTable: state.viewAsTable,
    };
    persistSettings(next);
    applyThemeToDocument(THEMES[state.themeId], reducedMotion, state.highContrast);
    set(next);
  },

  setHighContrast: (highContrast) => {
    const state = get();
    const themeId = highContrast ? 'clean-light' : state.themeId;
    const next: PersistedVisualSettings = {
      themeId,
      qualityTier: highContrast ? 'off' : state.qualityTier,
      reducedMotion: state.reducedMotion,
      highContrast,
      viewAsTable: state.viewAsTable,
    };
    persistSettings(next);
    applyThemeToDocument(THEMES[themeId], state.reducedMotion, highContrast);
    set(next);
  },

  setViewAsTable: (viewAsTable) => {
    const state = get();
    const next: PersistedVisualSettings = {
      themeId: state.themeId,
      qualityTier: state.qualityTier,
      reducedMotion: state.reducedMotion,
      highContrast: state.highContrast,
      viewAsTable,
    };
    persistSettings(next);
    set({ viewAsTable });
  },

  resetCorruptedSettings: () => {
    const fallback: PersistedVisualSettings = {
      themeId: 'cosmos',
      qualityTier: detectSystemPreferences().hasWebGL ? 'lite' : 'off',
      reducedMotion: false,
      highContrast: false,
      viewAsTable: false,
    };
    persistSettings(fallback);
    applyThemeToDocument(THEMES[fallback.themeId], false, false);
    set(fallback);
  },
}));
