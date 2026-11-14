import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isSoftwareWebGL, useQualityTier } from '../../hooks/useQualityTier';
import { THEMES } from '../../theme/themes';
import { useThemeStore } from '../../theme/useThemeStore';

function BackdropParticles({
  color,
  count,
  driftUp,
  reducedMotion,
}: {
  color: string;
  count: number;
  driftUp: boolean;
  reducedMotion: boolean;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const safeCount = Math.min(600, Math.max(0, count));
    const arr = new Float32Array(safeCount * 3);
    for (let i = 0; i < safeCount; i += 1) {
      const s1 = Math.sin(i * 19.13) * 43758.5453;
      const s2 = Math.sin(i * 47.71) * 24634.6345;
      const s3 = Math.sin(i * 91.37) * 19283.4712;
      arr[i * 3] = ((s1 - Math.floor(s1)) - 0.5) * 24;
      arr[i * 3 + 1] = ((s2 - Math.floor(s2)) - 0.5) * 16;
      arr[i * 3 + 2] = ((s3 - Math.floor(s3)) - 0.5) * 18;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame((_, delta) => {
    if (reducedMotion || !pointsRef.current) return;
    const dt = Math.min(delta, 0.1);
    pointsRef.current.rotation.y += dt * 0.018;
    if (driftUp) {
      pointsRef.current.position.y = (pointsRef.current.position.y + dt * 0.12) % 2;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial color={color} size={0.055} transparent opacity={0.55} sizeAttenuation />
    </points>
  );
}

/**
 * Lightweight fixed 3D ThemeBackdrop particle and fog layer behind dashboard views.
 */
export default function ThemeBackdropCanvas() {
  const themeId = useThemeStore((s) => s.themeId);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const { maxDpr, maxParticles } = useQualityTier();
  const softwareGl = useMemo(() => isSoftwareWebGL(), []);
  const theme = THEMES[themeId];

  if (!theme.supports3D || maxParticles === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-65"
    >
      <Canvas
        dpr={maxDpr}
        frameloop={reducedMotion ? 'demand' : 'always'}
        camera={{ position: [0, 0, 10], fov: 50 }}
        gl={{ alpha: true, antialias: !softwareGl }}
      >
        {theme.three.fogDensity > 0 && (
          <fogExp2 attach="fog" args={[theme.three.fogColor, theme.three.fogDensity]} />
        )}
        <BackdropParticles
          color={theme.three.particleColor}
          count={Math.min(maxParticles, 320)}
          driftUp={theme.three.particleType === 'bubbles'}
          reducedMotion={reducedMotion}
        />
      </Canvas>
    </div>
  );
}
