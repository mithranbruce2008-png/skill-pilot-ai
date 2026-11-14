import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AGENT_METADATA, type AgentId, type AgentLogEntry } from '../../data/skillPilotData';
import { isSoftwareWebGL, useQualityTier } from '../../hooks/useQualityTier';
import { THEMES } from '../../theme/themes';
import { useThemeStore } from '../../theme/useThemeStore';
import { computeAgentOrbitPositions } from './layoutMath';

interface AgentConstellationCanvasProps {
  logs: AgentLogEntry[];
}

function ConstellationScene({
  logs,
  reducedMotion,
}: AgentConstellationCanvasProps & { reducedMotion: boolean }) {
  const themeId = useThemeStore((s) => s.themeId);
  const theme = THEMES[themeId];
  const nodes = useMemo(() => computeAgentOrbitPositions(3.0), []);
  const orbRefs = useRef<Record<string, THREE.Mesh | null>>({});
  const pulseRefs = useRef<Array<THREE.Mesh | null>>([]);

  const nodePosMap = useMemo(() => {
    const map = new Map<AgentId, THREE.Vector3>();
    nodes.forEach((n) => map.set(n.id, new THREE.Vector3(...n.position)));
    return map;
  }, [nodes]);

  const recentLogs = logs.slice(0, 4);
  const activeAgent = recentLogs[0]?.to ?? 'planning';

  const curves = useMemo(() => {
    return recentLogs.map((log) => {
      const start = nodePosMap.get(log.from) ?? new THREE.Vector3();
      const end = nodePosMap.get(log.to) ?? new THREE.Vector3(1, 0, 0);
      const mid = start.clone().add(end).multiplyScalar(0.5);
      mid.y += 1.05;
      return {
        id: log.id,
        from: log.from,
        curve: new THREE.QuadraticBezierCurve3(start, mid, end),
      };
    });
  }, [recentLogs, nodePosMap]);

  const edgesGeo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        pts.push(new THREE.Vector3(...nodes[i].position), new THREE.Vector3(...nodes[j].position));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [nodes]);

  useEffect(() => {
    return () => edgesGeo.dispose();
  }, [edgesGeo]);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.elapsedTime;
    const activeMesh = orbRefs.current[activeAgent];
    if (activeMesh) {
      const s = 1 + Math.sin(t * 3.4) * 0.14;
      activeMesh.scale.setScalar(s);
    }
    curves.forEach((c, idx) => {
      const pulse = pulseRefs.current[idx];
      if (!pulse) return;
      const u = (t * 0.55 + idx * 0.25) % 1;
      c.curve.getPoint(u, pulse.position);
    });
  });

  return (
    <>
      <color attach="background" args={[theme.colors.bg]} />
      <ambientLight intensity={0.7} color={theme.three.ambientColor} />
      <pointLight position={[0, 4, 4]} intensity={1.3} color={theme.three.keyLightColor} />

      <lineSegments geometry={edgesGeo}>
        <lineBasicMaterial color={theme.three.linkColor} transparent opacity={0.28} />
      </lineSegments>

      {nodes.map((node) => {
        const color = theme.colors.agents[node.id];
        const isActive = node.id === activeAgent;
        return (
          <group key={node.id} position={node.position}>
            <mesh
              ref={(el) => {
                orbRefs.current[node.id] = el;
              }}
            >
              <sphereGeometry args={[isActive ? 0.44 : 0.34, 24, 24]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isActive ? 1.1 : 0.6}
                roughness={0.22}
                metalness={0.45}
              />
            </mesh>
            <Html position={[0, 0.72, 0]} center distanceFactor={10}>
              <div
                className="pointer-events-none rounded-lg border px-2.5 py-1 text-center text-xs whitespace-nowrap shadow"
                style={{
                  backgroundColor: 'var(--sp-surface)',
                  borderColor: isActive ? color : 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              >
                <span className="font-semibold">{AGENT_METADATA[node.id].label}</span>
                {isActive && <span className="ml-1 opacity-80">· Active</span>}
              </div>
            </Html>
          </group>
        );
      })}

      {!reducedMotion &&
        curves.map((item, idx) => (
          <mesh
            key={item.id}
            ref={(el) => {
              pulseRefs.current[idx] = el;
            }}
          >
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshBasicMaterial color={theme.colors.agents[item.from]} />
          </mesh>
        ))}

      <OrbitControls enableDamping={!reducedMotion} minDistance={5} maxDistance={14} />
    </>
  );
}

/**
 * 3D AgentConstellation canvas visualizing the 5 SkillPilot AI agents and live log pulses.
 */
export default function AgentConstellationCanvas({ logs }: AgentConstellationCanvasProps) {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const { maxDpr } = useQualityTier();
  const softwareGl = useMemo(() => isSoftwareWebGL(), []);

  return (
    <Canvas
      dpr={maxDpr}
      frameloop={reducedMotion ? 'demand' : 'always'}
      camera={{ position: [0, 2.5, 8.2], fov: 46 }}
      gl={{ antialias: !softwareGl }}
    >
      <ConstellationScene logs={logs} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
