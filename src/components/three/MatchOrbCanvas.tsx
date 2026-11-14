import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isSoftwareWebGL, useQualityTier } from '../../hooks/useQualityTier';
import { THEMES } from '../../theme/themes';
import { useThemeStore } from '../../theme/useThemeStore';

interface MatchOrbCanvasProps {
  percent: number;
}

const VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform float uFill;
  uniform float uTime;
  uniform vec3 uFillColor;
  uniform vec3 uEmptyColor;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    float wave = sin(vUv.x * 10.0 + uTime * 2.2) * 0.025;
    float fillMask = smoothstep(uFill + wave + 0.02, uFill + wave - 0.02, vUv.y);
    float rim = pow(1.0 - clamp(abs(vNormal.z), 0.0, 1.0), 2.2);
    vec3 col = mix(uEmptyColor, uFillColor, fillMask) + uFillColor * rim * 0.45;
    gl_FragColor = vec4(col, 0.94);
  }
`;

function OrbMesh({ percent, reducedMotion }: { percent: number; reducedMotion: boolean }) {
  const themeId = useThemeStore((s) => s.themeId);
  const theme = THEMES[themeId];
  const meshRef = useRef<THREE.Mesh>(null);

  const shaderMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uFill: { value: percent / 100 },
          uTime: { value: 0 },
          uFillColor: { value: new THREE.Color(theme.three.nodeLearnedColor) },
          uEmptyColor: { value: new THREE.Color(theme.three.coreColor) },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
      }),
    [],
  );

  useEffect(() => {
    shaderMat.uniforms.uFillColor.value.set(theme.three.nodeLearnedColor);
    shaderMat.uniforms.uEmptyColor.value.set(theme.three.coreColor);
  }, [theme, shaderMat]);

  useEffect(() => {
    return () => shaderMat.dispose();
  }, [shaderMat]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const target = Math.max(0, Math.min(1, percent / 100));
    shaderMat.uniforms.uFill.value = reducedMotion
      ? target
      : THREE.MathUtils.damp(shaderMat.uniforms.uFill.value, target, 4, dt);
    if (!reducedMotion) {
      shaderMat.uniforms.uTime.value = state.clock.elapsedTime;
      if (meshRef.current) {
        meshRef.current.rotation.y += dt * 0.35;
      }
    }
  });

  return (
    <mesh ref={meshRef} material={shaderMat}>
      <sphereGeometry args={[1.35, 32, 32]} />
    </mesh>
  );
}

/**
 * 3D MatchOrb filling to the learner's target career match percentage.
 */
export default function MatchOrbCanvas({ percent }: MatchOrbCanvasProps) {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const { maxDpr } = useQualityTier();
  const softwareGl = useMemo(() => isSoftwareWebGL(), []);

  return (
    <Canvas
      dpr={maxDpr}
      frameloop={reducedMotion ? 'demand' : 'always'}
      camera={{ position: [0, 0, 3.8], fov: 42 }}
      gl={{ alpha: true, antialias: !softwareGl }}
    >
      <ambientLight intensity={0.8} />
      <OrbMesh percent={percent} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
