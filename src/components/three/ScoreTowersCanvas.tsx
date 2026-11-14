import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { EvaluationCriterion } from '../../data/skillPilotData';
import { isSoftwareWebGL, useQualityTier } from '../../hooks/useQualityTier';
import { sanitizeLabel } from '../../schemas/authSchemas';
import { THEMES } from '../../theme/themes';
import { useThemeStore } from '../../theme/useThemeStore';
import { getCriterionVisual } from './layoutMath';

interface ScoreTowersCanvasProps {
  criteria: EvaluationCriterion[];
}

function TowersScene({
  criteria,
  reducedMotion,
}: ScoreTowersCanvasProps & { reducedMotion: boolean }) {
  const themeId = useThemeStore((s) => s.themeId);
  const theme = THEMES[themeId];
  const barRefs = useRef<Array<THREE.Mesh | null>>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    criteria.forEach((c, idx) => {
      const mesh = barRefs.current[idx];
      if (!mesh) return;
      const targetHeight = Math.max(0.25, (c.score / c.maxScore) * 3.4);
      const nextY = reducedMotion
        ? targetHeight
        : THREE.MathUtils.damp(mesh.scale.y, targetHeight, 6, dt);
      mesh.scale.y = nextY;
      mesh.position.y = nextY * 0.5;
    });
  });

  return (
    <>
      <color attach="background" args={[theme.colors.bg]} />
      <ambientLight intensity={0.75} color={theme.three.ambientColor} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color={theme.three.keyLightColor} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[14, 6]} />
        <meshStandardMaterial color={theme.colors.bgSecondary} roughness={0.85} />
      </mesh>

      {criteria.map((criterion, idx) => {
        const x = (idx - (criteria.length - 1) / 2) * 1.65;
        const visual = getCriterionVisual(criterion.score, criterion.maxScore);
        const barColor =
          visual.colorKey === 'success'
            ? theme.colors.success
            : visual.colorKey === 'warning'
              ? theme.colors.warning
              : theme.colors.danger;
        const targetHeight = Math.max(0.25, (criterion.score / criterion.maxScore) * 3.4);

        return (
          <group key={criterion.id} position={[x, 0, 0]}>
            <mesh
              ref={(el) => {
                barRefs.current[idx] = el;
              }}
              position={[0, reducedMotion ? targetHeight * 0.5 : 0.15, 0]}
              scale={[1, reducedMotion ? targetHeight : 0.3, 1]}
            >
              <boxGeometry args={[0.82, 1, 0.82]} />
              <meshStandardMaterial
                color={barColor}
                emissive={barColor}
                emissiveIntensity={0.35}
                roughness={0.3}
                metalness={0.25}
              />
            </mesh>
            <Html position={[0, targetHeight + 0.55, 0]} center distanceFactor={11}>
              <div
                className="pointer-events-none rounded-lg border px-2 py-1 text-center text-xs whitespace-nowrap shadow"
                style={{
                  backgroundColor: 'var(--sp-surface)',
                  borderColor: 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              >
                <div className="font-semibold sp-tabular">
                  {sanitizeLabel(criterion.name)}: {criterion.score}/{criterion.maxScore}
                </div>
                <div style={{ color: 'var(--sp-text-muted)' }}>{visual.status}</div>
              </div>
            </Html>
          </group>
        );
      })}

      <OrbitControls enableDamping={!reducedMotion} minDistance={5} maxDistance={16} />
    </>
  );
}

/**
 * 3D ScoreTowers canvas rendering the 7 evaluation rubric criteria as animated columns.
 */
export default function ScoreTowersCanvas({ criteria }: ScoreTowersCanvasProps) {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const { maxDpr } = useQualityTier();
  const softwareGl = useMemo(() => isSoftwareWebGL(), []);

  return (
    <Canvas
      dpr={maxDpr}
      frameloop={reducedMotion ? 'demand' : 'always'}
      camera={{ position: [0, 3.5, 9.5], fov: 44 }}
      gl={{ antialias: !softwareGl }}
    >
      <TowersScene criteria={criteria} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
