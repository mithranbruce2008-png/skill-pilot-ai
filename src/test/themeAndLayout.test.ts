import { describe, expect, it } from 'vitest';
import {
  computeAgentOrbitPositions,
  computeGalaxyLayout,
  computeRoadmapLayout,
  getCriterionVisual,
  getStatusVisual,
} from '../components/three/layoutMath';
import { INITIAL_ROADMAP_MODULES, SKILLS_CATALOG, type ModuleStatus } from '../data/skillPilotData';
import { evaluateFpsDowngrade } from '../hooks/useQualityTier';
import { contrastRatio } from '../theme/contrast';
import { parseStoredVisualSettings, parseThemeId } from '../theme/themeSchema';
import { THEME_LIST } from '../theme/themes';
import { selectInitialQualityTier } from '../theme/useThemeStore';

describe('Theme schema and WCAG contrast compliance', () => {
  it('validates stored settings and falls back to null on corrupted JSON or invalid fields', () => {
    expect(parseStoredVisualSettings('{broken-json')).toBeNull();
    expect(parseStoredVisualSettings(JSON.stringify({ themeId: 'unknown-theme' }))).toBeNull();
    expect(parseThemeId('invalid-theme', 'cosmos')).toBe('cosmos');

    const valid = JSON.stringify({
      themeId: 'neon-cyber',
      qualityTier: 'lite',
      reducedMotion: false,
      highContrast: false,
      viewAsTable: true,
    });
    expect(parseStoredVisualSettings(valid)).toEqual({
      themeId: 'neon-cyber',
      qualityTier: 'lite',
      reducedMotion: false,
      highContrast: false,
      viewAsTable: true,
    });
  });

  it('guarantees >= 4.5:1 contrast ratio across every theme', () => {
    for (const theme of THEME_LIST) {
      const c = theme.colors;
      expect(contrastRatio(c.text, c.bg), `${theme.id} text/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.text, c.surface), `${theme.id} text/surface`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.textMuted, c.bg), `${theme.id} muted/bg`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.textMuted, c.surface), `${theme.id} muted/surface`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.accentText, c.accent), `${theme.id} accentText/accent`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.success, c.surface), `${theme.id} success/surface`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.warning, c.surface), `${theme.id} warning/surface`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(c.danger, c.surface), `${theme.id} danger/surface`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('Quality tier selector and FPS auto-downgrade', () => {
  it('selects Off when WebGL is missing, reduced motion is active, high contrast is on, or Clean Light is active', () => {
    expect(
      selectInitialQualityTier({
        hasWebGL: false,
        prefersReducedMotion: false,
        highContrast: false,
      }),
    ).toBe('off');
    expect(
      selectInitialQualityTier({
        hasWebGL: true,
        prefersReducedMotion: true,
        highContrast: false,
      }),
    ).toBe('off');
    expect(
      selectInitialQualityTier({
        hasWebGL: true,
        prefersReducedMotion: false,
        highContrast: true,
      }),
    ).toBe('off');
    expect(
      selectInitialQualityTier({
        hasWebGL: true,
        prefersReducedMotion: false,
        highContrast: false,
        themeId: 'clean-light',
      }),
    ).toBe('off');
  });

  it('selects Lite on low-core or low-memory devices and Full otherwise', () => {
    expect(
      selectInitialQualityTier({
        hasWebGL: true,
        prefersReducedMotion: false,
        highContrast: false,
        hardwareConcurrency: 4,
        deviceMemory: 8,
      }),
    ).toBe('lite');
    expect(
      selectInitialQualityTier({
        hasWebGL: true,
        prefersReducedMotion: false,
        highContrast: false,
        hardwareConcurrency: 8,
        deviceMemory: 4,
      }),
    ).toBe('lite');
    expect(
      selectInitialQualityTier({
        hasWebGL: true,
        prefersReducedMotion: false,
        highContrast: false,
        hardwareConcurrency: 8,
        deviceMemory: 16,
      }),
    ).toBe('full');
  });

  it('downgrades Full to Lite when average fps < 40 and Lite to Off when < 15', () => {
    const slowSamples = Array.from({ length: 50 }, () => 0.04); // 25 fps
    expect(evaluateFpsDowngrade(slowSamples, 'full')).toMatchObject({
      nextTier: 'lite',
      downgraded: true,
    });

    const verySlowSamples = Array.from({ length: 20 }, () => 0.1); // 10 fps
    expect(evaluateFpsDowngrade(verySlowSamples, 'lite')).toMatchObject({
      nextTier: 'off',
      downgraded: true,
    });

    const fastSamples = Array.from({ length: 120 }, () => 1 / 60);
    expect(evaluateFpsDowngrade(fastSamples, 'full')).toMatchObject({
      nextTier: 'full',
      downgraded: false,
    });
  });
});

describe('Pure 3D layout functions and status-to-visual mapping', () => {
  it('generates deterministic galaxy positions with minimum separation', () => {
    const layoutA = computeGalaxyLayout(SKILLS_CATALOG, 0.85);
    const layoutB = computeGalaxyLayout(SKILLS_CATALOG, 0.85);
    expect(layoutA.nodes).toHaveLength(60);
    expect(layoutA.nodes[0].position).toEqual(layoutB.nodes[0].position);
    expect(layoutA.links.length).toBeGreaterThan(20);

    for (let i = 0; i < layoutA.nodes.length; i += 1) {
      for (let j = i + 1; j < layoutA.nodes.length; j += 1) {
        const a = layoutA.nodes[i].position;
        const b = layoutA.nodes[j].position;
        const dist = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        expect(dist).toBeGreaterThanOrEqual(0.75);
      }
    }
  });

  it('orders roadmap gates sequentially along X and computes 5 agent orbits', () => {
    const gates = computeRoadmapLayout(INITIAL_ROADMAP_MODULES);
    for (let i = 1; i < gates.length; i += 1) {
      expect(gates[i].position[0]).toBeGreaterThan(gates[i - 1].position[0]);
      expect(gates[i].order).toBe(i);
    }
    const agents = computeAgentOrbitPositions(3.0);
    expect(agents).toHaveLength(5);
  });

  it('maps every module and criterion status to both icon and text label', () => {
    const statuses: ModuleStatus[] = [
      'completed',
      'in_progress',
      'unlocked',
      'locked',
      'revision',
      'paused',
    ];
    statuses.forEach((status) => {
      const vis = getStatusVisual(status);
      expect(vis.label.length).toBeGreaterThan(0);
      expect(vis.iconName.length).toBeGreaterThan(0);
    });

    expect(getCriterionVisual(22, 25).status).toBe('Mastered');
    expect(getCriterionVisual(18, 25).status).toBe('Developing');
    expect(getCriterionVisual(13, 25).status).toBe('Needs Revision');
  });
});
