import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AgentPalette } from '../../../theme/themes';
import { computeAgentOrbitPositions } from '../layoutMath';

interface AgentOrbitRingsProps {
  agentColors: AgentPalette;
  particleColor: string;
  maxParticles: number;
  reducedMotion: boolean;
  emailFocused: boolean;
  showGridFloor: boolean;
  gridColor: string;
}

const PULSE_PAIRS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 4],
  [3, 4],
  [4, 2],
];

/**
 * Renders the 5 AI agent orbs on tilted orbit rings, traveling curved light pulses, and stardust particles.
 */
export function AgentOrbitRings({
  agentColors,
  particleColor,
  maxParticles,
  reducedMotion,
  emailFocused,
  showGridFloor,
  gridColor,
}: AgentOrbitRingsProps) {
  const orbits = useMemo(() => computeAgentOrbitPositions(3.0), []);
  const pulseMeshRefs = useRef<Array<THREE.Mesh | null>>([]);
  const particlesRef = useRef<THREE.Points>(null);

  const curves = useMemo(() => {
    return PULSE_PAIRS.map(([fromIdx, toIdx]) => {
      const p0 = new THREE.Vector3(...orbits[fromIdx].position);
      const p2 = new THREE.Vector3(...orbits[toIdx].position);
      const mid = p0.clone().add(p2).multiplyScalar(0.5);
      mid.y += 0.9;
      return new THREE.QuadraticBezierCurve3(p0, mid, p2);
    });
  }, [orbits]);

  const edgeLineGeo = useMemo(() => {
    const points: THREE.Vector3[] = [];
    curves.forEach((curve) => {
      const sampled = curve.getPoints(16);
      for (let i = 0; i < sampled.length - 1; i += 1) {
        points.push(sampled[i], sampled[i + 1]);
      }
    });
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [curves]);

  const particleGeo = useMemo(() => {
    const count = Math.max(0, maxParticles);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      // Deterministic pseudo-random distribution
      const s1 = Math.sin(i * 12.9898) * 43758.5453;
      const s2 = Math.sin(i * 78.233) * 24634.6345;
      const s3 = Math.sin(i * 39.425) * 19283.4712;
      const rx = s1 - Math.floor(s1);
      const ry = s2 - Math.floor(s2);
      const rz = s3 - Math.floor(s3);
      positions[i * 3] = (rx - 0.5) * 24;
      positions[i * 3 + 1] = (ry - 0.5) * 16;
      positions[i * 3 + 2] = (rz - 0.5) * 22;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [maxParticles]);

  useEffect(() => {
    return () => {
      edgeLineGeo.dispose();
      particleGeo.dispose();
    };
  }, [edgeLineGeo, particleGeo]);

  useFrame((state, delta) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    curves.forEach((curve, idx) => {
      const mesh = pulseMeshRefs.current[idx];
      if (!mesh) return;
      const cycle = (t * 0.28 + idx * 0.23) % 1;
      curve.getPoint(cycle, mesh.position);
    });
    if (particlesRef.current) {
      particlesRef.current.rotation.y += Math.min(delta, 0.1) * 0.02;
    }
  });

  const colorList = [
    agentColors.profile,
    agentColors.diagnosis,
    agentColors.planning,
    agentColors.evaluator,
    agentColors.tutor,
  ];

  return (
    <group>
      {orbits.map((orbit, idx) => (
        <group key={orbit.id}>
          <mesh rotation={orbit.ringTilt}>
            <torusGeometry args={[3.0 + idx * 0.16, 0.01, 6, 72]} />
            <meshBasicMaterial
              color={colorList[idx]}
              transparent
              opacity={emailFocused ? 0.42 : 0.2}
            />
          </mesh>
          <mesh position={orbit.position}>
            <sphereGeometry args={[0.21, 18, 18]} />
            <meshStandardMaterial
              color={colorList[idx]}
              emissive={colorList[idx]}
              emissiveIntensity={emailFocused ? 1.15 : 0.75}
              roughness={0.22}
              metalness={0.4}
            />
          </mesh>
        </group>
      ))}

      <lineSegments geometry={edgeLineGeo}>
        <lineBasicMaterial color={agentColors.planning} transparent opacity={0.22} />
      </lineSegments>

      {!reducedMotion &&
        curves.map((curve, idx) => {
          void curve;
          return (
            <mesh
              key={`pulse-${idx}`}
              ref={(el) => {
                pulseMeshRefs.current[idx] = el;
              }}
            >
              <sphereGeometry args={[0.075, 10, 10]} />
              <meshBasicMaterial color={colorList[idx % colorList.length]} />
            </mesh>
          );
        })}

      {maxParticles > 0 && (
        <points ref={particlesRef} geometry={particleGeo}>
          <pointsMaterial
            color={particleColor}
            size={0.055}
            sizeAttenuation
            transparent
            opacity={0.72}
          />
        </points>
      )}

      {showGridFloor && (
        <gridHelper args={[32, 32, gridColor, gridColor]} position={[0, -4.5, 0]} />
      )}
    </group>
  );
}
