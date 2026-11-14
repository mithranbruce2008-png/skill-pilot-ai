import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { SKILLS_CATALOG, type GoalId } from '../../data/skillPilotData';
import { isSoftwareWebGL, useQualityTier } from '../../hooks/useQualityTier';
import { sanitizeLabel } from '../../schemas/authSchemas';
import type { QualityTier } from '../../theme/themeSchema';
import { THEMES } from '../../theme/themes';
import { useThemeStore } from '../../theme/useThemeStore';
import { computeGalaxyLayout, type GalaxyNodeLayout } from './layoutMath';
import { AgentOrbitRings } from './galaxy/AgentOrbitRings';
import { CoreLearnerSphere } from './galaxy/CoreLearnerSphere';
import { SkillNodesInstanced } from './galaxy/SkillNodesInstanced';

export interface SkillGalaxyCanvasProps {
  mode: 'login' | 'analysis';
  emailFocused?: boolean;
  passwordFocused?: boolean;
  invalidTrigger?: number;
  warpSuccess?: boolean;
  demoHighlight?: boolean;
  goalId?: GoalId;
  skillLevels?: Record<string, number>;
  adaptationActive?: boolean;
  selectedSkillId?: string | null;
  onSelectSkill?: (skillId: string) => void;
  onQualityDowngrade?: (tier: QualityTier, avgFps: number) => void;
  onContextLost?: (lost: boolean) => void;
}

interface GalaxySceneRigProps {
  mode: 'login' | 'analysis';
  emailFocused: boolean;
  passwordFocused: boolean;
  invalidTrigger: number;
  warpSuccess: boolean;
  demoHighlight: boolean;
  goalId: GoalId;
  skillLevels: Record<string, number>;
  adaptationActive: boolean;
  selectedSkillId: string | null;
  reducedMotion: boolean;
  maxParticles: number;
  enableBloom: boolean;
  recordFrameDelta: (dt: number) => void;
  onHoverNode: (node: GalaxyNodeLayout | null, x: number, y: number) => void;
  onSelectNode: (node: GalaxyNodeLayout) => void;
}

function GalaxySceneRig({
  mode,
  emailFocused,
  passwordFocused,
  invalidTrigger,
  warpSuccess,
  demoHighlight,
  goalId,
  skillLevels,
  adaptationActive,
  selectedSkillId,
  reducedMotion,
  maxParticles,
  enableBloom,
  recordFrameDelta,
  onHoverNode,
  onSelectNode,
}: GalaxySceneRigProps) {
  const themeId = useThemeStore((s) => s.themeId);
  const theme = THEMES[themeId];
  const galaxyGroupRef = useRef<THREE.Group>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const { camera } = useThree();
  const layout = useMemo(() => computeGalaxyLayout(SKILLS_CATALOG, 0.85), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      pointerRef.current.y = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    recordFrameDelta(dt);

    if (warpSuccess && !reducedMotion) {
      camera.position.z = THREE.MathUtils.damp(camera.position.z, 0.2, 4.5, dt);
      camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 4.5, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, 0, 4.5, dt);
      return;
    }

    if (galaxyGroupRef.current && !reducedMotion) {
      galaxyGroupRef.current.rotation.y += dt * 0.055;
      if (mode === 'login') {
        const targetRotX = pointerRef.current.y * 0.08;
        const targetOffsetX = pointerRef.current.x * 0.25;
        galaxyGroupRef.current.rotation.x = THREE.MathUtils.damp(
          galaxyGroupRef.current.rotation.x,
          targetRotX,
          4,
          dt,
        );
        galaxyGroupRef.current.position.x = THREE.MathUtils.damp(
          galaxyGroupRef.current.position.x,
          -1.6 + targetOffsetX,
          4,
          dt,
        );
      }
    }
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const handleHover = useCallback(
    (node: GalaxyNodeLayout | null, x: number, y: number) => {
      setHoveredIdx(node ? node.index : null);
      onHoverNode(node, x, y);
    },
    [onHoverNode],
  );

  return (
    <>
      <color attach="background" args={[theme.colors.bg]} />
      {theme.three.fogDensity > 0 && (
        <fogExp2 attach="fog" args={[theme.three.fogColor, theme.three.fogDensity]} />
      )}
      <ambientLight color={theme.three.ambientColor} intensity={0.65} />
      <directionalLight position={[6, 8, 6]} color={theme.three.keyLightColor} intensity={1.15} />
      <pointLight position={[-6, -4, -6]} color={theme.three.rimLightColor} intensity={0.9} />

      <group ref={galaxyGroupRef} position={mode === 'login' ? [-1.6, 0, 0] : [0, 0, 0]}>
        <CoreLearnerSphere
          coreColor={theme.three.coreColor}
          fresnelColor={theme.three.fresnelColor}
          dangerColor={theme.colors.danger}
          emailFocused={emailFocused}
          passwordFocused={passwordFocused}
          invalidTrigger={invalidTrigger}
          reducedMotion={reducedMotion}
        />
        <AgentOrbitRings
          agentColors={theme.colors.agents}
          particleColor={theme.three.particleColor}
          maxParticles={maxParticles}
          reducedMotion={reducedMotion}
          emailFocused={emailFocused}
          showGridFloor={theme.three.gridFloor}
          gridColor={theme.colors.agents.profile}
        />
        <SkillNodesInstanced
          layout={layout}
          goalId={goalId}
          skillLevels={skillLevels}
          adaptationActive={adaptationActive}
          demoHighlight={demoHighlight}
          emailFocused={emailFocused}
          hoveredIndex={hoveredIdx}
          selectedSkillId={selectedSkillId}
          colors={{
            learned: theme.three.nodeLearnedColor,
            gap: theme.three.nodeGapColor,
            required: theme.three.nodeRequiredColor,
            revision: theme.three.nodeRevisionColor,
            link: theme.three.linkColor,
          }}
          onHoverNode={handleHover}
          onSelectNode={onSelectNode}
        />
      </group>

      {mode === 'analysis' && (
        <OrbitControls
          enableDamping={!reducedMotion}
          dampingFactor={0.07}
          minDistance={5}
          maxDistance={20}
        />
      )}

      {enableBloom && (
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={theme.three.bloomIntensity}
            luminanceThreshold={0.45}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </>
  );
}

/**
 * Lazy-loaded Three.js Skill Galaxy canvas with FPS auto-downgrade, offscreen pause, and WebGL context recovery.
 */
export default function SkillGalaxyCanvas({
  mode,
  emailFocused = false,
  passwordFocused = false,
  invalidTrigger = 0,
  warpSuccess = false,
  demoHighlight = false,
  goalId = 'fullstack',
  skillLevels = {},
  adaptationActive = false,
  selectedSkillId = null,
  onSelectSkill,
  onQualityDowngrade,
  onContextLost,
}: SkillGalaxyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const [isVisible, setIsVisible] = useState(true);
  const [tabVisible, setTabVisible] = useState(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true,
  );
  const [hoveredInfo, setHoveredInfo] = useState<{
    name: string;
    category: string;
    level: number;
    whyMatters: string;
    x: number;
    y: number;
  } | null>(null);

  const softwareGl = useMemo(() => isSoftwareWebGL(), []);
  const { effectiveTier, maxDpr, maxParticles, recordFrameDelta } =
    useQualityTier(onQualityDowngrade);

  useEffect(() => {
    const onVisibility = () => {
      setTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleHoverNode = useCallback(
    (node: GalaxyNodeLayout | null, x: number, y: number) => {
      if (!node) {
        setHoveredInfo(null);
        return;
      }
      setHoveredInfo({
        name: sanitizeLabel(node.skill.name),
        category: sanitizeLabel(node.skill.category),
        level: skillLevels[node.skill.id] ?? 0,
        whyMatters: sanitizeLabel(node.skill.whyMatters),
        x,
        y,
      });
    },
    [skillLevels],
  );

  const handleSelectNode = useCallback(
    (node: GalaxyNodeLayout) => {
      onSelectSkill?.(node.skill.id);
    },
    [onSelectSkill],
  );

  const handleCreated = useCallback(
    ({ gl }: { gl: THREE.WebGLRenderer }) => {
      gl.outputColorSpace = THREE.SRGBColorSpace;
      const canvas = gl.domElement;
      canvas.setAttribute('tabindex', '-1');
      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        onContextLost?.(true);
      });
      canvas.addEventListener('webglcontextrestored', () => {
        onContextLost?.(false);
      });
    },
    [onContextLost],
  );

  const activeRendering = isVisible && tabVisible;
  const frameloop = reducedMotion || !activeRendering ? 'demand' : 'always';
  const enableBloom = effectiveTier === 'full' && !softwareGl && !reducedMotion;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full"
      role="img"
      aria-label="Animated galaxy of skills and AI agents"
    >
      <Canvas
        dpr={maxDpr}
        frameloop={frameloop}
        camera={{ position: [0, 1.4, mode === 'login' ? 12.2 : 11.4], fov: 48 }}
        gl={{ antialias: !softwareGl && effectiveTier === 'full', powerPreference: 'high-performance' }}
        onCreated={handleCreated}
      >
        <GalaxySceneRig
          mode={mode}
          emailFocused={emailFocused}
          passwordFocused={passwordFocused}
          invalidTrigger={invalidTrigger}
          warpSuccess={warpSuccess}
          demoHighlight={demoHighlight}
          goalId={goalId}
          skillLevels={skillLevels}
          adaptationActive={adaptationActive}
          selectedSkillId={selectedSkillId}
          reducedMotion={reducedMotion}
          maxParticles={maxParticles}
          enableBloom={enableBloom}
          recordFrameDelta={recordFrameDelta}
          onHoverNode={handleHoverNode}
          onSelectNode={handleSelectNode}
        />
      </Canvas>

      {hoveredInfo && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-40 max-w-xs rounded-xl border px-3.5 py-2.5 text-xs shadow-xl"
          style={{
            left: Math.min(hoveredInfo.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 240),
            top: Math.max(12, hoveredInfo.y - 14),
            backgroundColor: 'var(--sp-surface)',
            borderColor: 'var(--sp-border)',
            color: 'var(--sp-text)',
          }}
        >
          <p className="font-semibold">{hoveredInfo.name}</p>
          <p className="mt-0.5 sp-tabular" style={{ color: 'var(--sp-text-muted)' }}>
            {hoveredInfo.category} · Level {hoveredInfo.level}/4
          </p>
          <p className="mt-1 leading-snug" style={{ color: 'var(--sp-text-muted)' }}>
            {hoveredInfo.whyMatters}
          </p>
        </div>
      )}
    </div>
  );
}
