import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { RoadmapModule } from '../../data/skillPilotData';
import { isSoftwareWebGL, useQualityTier } from '../../hooks/useQualityTier';
import { sanitizeLabel } from '../../schemas/authSchemas';
import { THEMES } from '../../theme/themes';
import { useThemeStore } from '../../theme/useThemeStore';
import { computeRoadmapLayout, getStatusVisual } from './layoutMath';

interface LearningPathCanvasProps {
  modules: RoadmapModule[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
}

function RoadAndGates({
  modules,
  selectedModuleId,
  onSelectModule,
  reducedMotion,
}: LearningPathCanvasProps & { reducedMotion: boolean }) {
  const themeId = useThemeStore((s) => s.themeId);
  const theme = THEMES[themeId];
  const { camera } = useThree();
  const gateRefs = useRef<Array<THREE.Group | null>>([]);
  const gates = useMemo(() => computeRoadmapLayout(modules), [modules]);

  const roadGeometry = useMemo(() => {
    const pts = gates.map((g) => new THREE.Vector3(g.position[0], g.position[1] - 0.55, g.position[2]));
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 64, 0.14, 8, false);
  }, [gates]);

  useEffect(() => {
    return () => roadGeometry.dispose();
  }, [roadGeometry]);

  const focusGate = useMemo(() => {
    return (
      gates.find((g) => g.module.id === selectedModuleId) ??
      gates.find((g) => g.module.status === 'revision') ??
      gates.find((g) => g.module.status === 'in_progress') ??
      gates[0]
    );
  }, [gates, selectedModuleId]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    if (focusGate && !reducedMotion) {
      const targetX = focusGate.position[0] * 0.55;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.5, dt);
    }

    gates.forEach((gate, i) => {
      const grp = gateRefs.current[i];
      if (!grp) return;
      const targetY = gate.position[1];
      if (gate.module.status === 'revision' && !reducedMotion) {
        const dropOffset = Math.max(0, 1.5 - state.clock.elapsedTime * 0.8);
        void dropOffset;
      }
      grp.position.y = THREE.MathUtils.damp(grp.position.y, targetY, 6, dt);
      if (gate.module.status === 'in_progress' && !reducedMotion) {
        const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
        grp.scale.setScalar(pulse);
      } else {
        grp.scale.setScalar(1);
      }
    });
  });

  const getColor = (status: RoadmapModule['status']): string => {
    switch (status) {
      case 'completed':
        return theme.colors.success;
      case 'in_progress':
        return theme.three.fresnelColor;
      case 'revision':
        return theme.colors.danger;
      case 'paused':
        return theme.colors.warning;
      case 'unlocked':
        return theme.colors.agents.profile;
      default:
        return theme.three.nodeGapColor;
    }
  };

  return (
    <>
      <color attach="background" args={[theme.colors.bg]} />
      <ambientLight intensity={0.75} color={theme.three.ambientColor} />
      <directionalLight position={[6, 9, 5]} intensity={1.2} color={theme.three.keyLightColor} />

      <mesh geometry={roadGeometry}>
        <meshStandardMaterial color={theme.three.linkColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {gates.map((gate, idx) => {
        const color = getColor(gate.module.status);
        const visual = getStatusVisual(gate.module.status);
        const isDimmed = gate.module.status === 'locked' || gate.module.status === 'paused';
        const isSelected = gate.module.id === selectedModuleId;

        return (
          <group
            key={gate.module.id}
            ref={(el) => {
              gateRefs.current[idx] = el;
            }}
            position={[
              gate.position[0],
              gate.module.status === 'revision' && !reducedMotion ? gate.position[1] + 2.4 : gate.position[1],
              gate.position[2],
            ]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectModule(gate.module.id);
            }}
          >
            <mesh>
              <torusGeometry args={[0.62, 0.09, 12, 32, Math.PI]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isDimmed ? 0.15 : 0.75}
                transparent={isDimmed}
                opacity={isDimmed ? 0.45 : 1}
                roughness={0.3}
                metalness={0.5}
              />
            </mesh>
            <mesh position={[0, -0.5, 0]}>
              <cylinderGeometry args={[0.7, 0.78, 0.14, 24]} />
              <meshStandardMaterial color={isSelected ? '#ffffff' : color} roughness={0.4} />
            </mesh>
            <Html position={[0, 1.05, 0]} center distanceFactor={11}>
              <div
                className="pointer-events-none rounded-lg border px-2.5 py-1 text-center text-xs shadow-md whitespace-nowrap"
                style={{
                  backgroundColor: 'var(--sp-surface)',
                  borderColor: isSelected ? 'var(--sp-focus)' : 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              >
                <div className="font-semibold">{sanitizeLabel(gate.module.title)}</div>
                <div style={{ color: 'var(--sp-text-muted)' }}>
                  {visual.label}
                  {gate.module.reason ? ' · Adapted' : ''}
                </div>
              </div>
            </Html>
          </group>
        );
      })}

      <OrbitControls
        enableDamping={!reducedMotion}
        enablePan
        minDistance={6}
        maxDistance={18}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

/**
 * 3D winding roadmap canvas showing module gates, paused advanced gates, and inserted Unit Testing revision gate.
 */
export default function LearningPathCanvas(props: LearningPathCanvasProps) {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const { maxDpr } = useQualityTier();
  const softwareGl = useMemo(() => isSoftwareWebGL(), []);

  return (
    <Canvas
      dpr={maxDpr}
      frameloop={reducedMotion ? 'demand' : 'always'}
      camera={{ position: [0, 3.2, 11.5], fov: 46 }}
      gl={{ antialias: !softwareGl }}
    >
      <RoadAndGates {...props} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
