import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { GoalId } from '../../../data/skillPilotData';
import type { GalaxyLayoutResult, GalaxyNodeLayout } from '../layoutMath';

interface SkillNodesInstancedProps {
  layout: GalaxyLayoutResult;
  goalId: GoalId;
  skillLevels: Record<string, number>;
  adaptationActive: boolean;
  demoHighlight: boolean;
  emailFocused: boolean;
  hoveredIndex: number | null;
  selectedSkillId: string | null;
  colors: {
    learned: string;
    gap: string;
    required: string;
    revision: string;
    link: string;
  };
  onHoverNode: (node: GalaxyNodeLayout | null, clientX: number, clientY: number) => void;
  onSelectNode: (node: GalaxyNodeLayout) => void;
}

const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const DEMO_GOLD_IDS = new Set(['python', 'sql', 'html']);

/**
 * Renders 60 skill nodes with a single InstancedMesh, target-role rings, and prerequisite LineSegments.
 */
export function SkillNodesInstanced({
  layout,
  goalId,
  skillLevels,
  adaptationActive,
  demoHighlight,
  emailFocused,
  hoveredIndex,
  selectedSkillId,
  colors,
  onHoverNode,
  onSelectNode,
}: SkillNodesInstancedProps) {
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const ringsRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const count = layout.nodes.length;

  const lineGeometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(layout.links.length * 6);
    const lineColors = new Float32Array(layout.links.length * 6);

    layout.links.forEach(([a, b], idx) => {
      const posA = layout.nodes[a].position;
      const posB = layout.nodes[b].position;
      positions[idx * 6] = posA[0];
      positions[idx * 6 + 1] = posA[1];
      positions[idx * 6 + 2] = posA[2];
      positions[idx * 6 + 3] = posB[0];
      positions[idx * 6 + 4] = posB[1];
      positions[idx * 6 + 5] = posB[2];
    });

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
    return geom;
  }, [layout]);

  useEffect(() => {
    return () => {
      lineGeometry.dispose();
    };
  }, [lineGeometry]);

  // Update node transforms, colors, and gold rings whenever state or hover changes
  useEffect(() => {
    const mesh = nodesRef.current;
    const rings = ringsRef.current;
    if (!mesh || !rings) return;

    layout.nodes.forEach((node, i) => {
      const level = skillLevels[node.skill.id] ?? 0;
      const isRequired = node.skill.requiredFor.includes(goalId);
      const isDemoGold = demoHighlight && DEMO_GOLD_IDS.has(node.skill.id);
      const isRevision = adaptationActive && node.skill.id === 'unit-testing';
      const isHovered = hoveredIndex === i;
      const isSelected = selectedSkillId === node.skill.id;

      const baseScale = 0.65 + level * 0.16;
      const finalScale = baseScale * (isHovered || isSelected ? 1.55 : isDemoGold ? 1.45 : 1);

      _dummy.position.set(node.position[0], node.position[1], node.position[2]);
      _dummy.rotation.set(0, 0, 0);
      _dummy.scale.setScalar(finalScale);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);

      if (isDemoGold) {
        _color.set('#fbbf24');
      } else if (isRevision) {
        _color.set(colors.revision);
      } else if (level >= 2) {
        _color.set(colors.learned);
      } else {
        _color.set(colors.gap);
      }
      if (emailFocused || isHovered || isSelected) {
        _color.offsetHSL(0, 0.05, 0.12);
      }
      mesh.setColorAt(i, _color);

      // Gold target-role rings
      const showRing = isRequired || isDemoGold || isSelected;
      _dummy.scale.setScalar(showRing ? finalScale * 1.45 : 0.0001);
      _dummy.rotation.set(Math.PI / 3, i * 0.4, 0);
      _dummy.updateMatrix();
      rings.setMatrixAt(i, _dummy.matrix);
      _color.set(isSelected ? '#ffffff' : colors.required);
      rings.setColorAt(i, _color);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();

    rings.instanceMatrix.needsUpdate = true;
    if (rings.instanceColor) rings.instanceColor.needsUpdate = true;
    rings.computeBoundingSphere();
  }, [
    layout,
    goalId,
    skillLevels,
    adaptationActive,
    demoHighlight,
    emailFocused,
    hoveredIndex,
    selectedSkillId,
    colors,
  ]);

  // Update prerequisite link vertex colors (brighten links connected to hovered/selected node)
  useEffect(() => {
    const attr = lineGeometry.getAttribute('color') as THREE.BufferAttribute;
    const base = new THREE.Color(colors.link);
    const active = new THREE.Color('#ffffff');
    const selectedIdx =
      hoveredIndex !== null
        ? hoveredIndex
        : selectedSkillId
          ? layout.nodes.findIndex((n) => n.skill.id === selectedSkillId)
          : -1;

    layout.links.forEach(([a, b], idx) => {
      const connected = selectedIdx !== -1 && (a === selectedIdx || b === selectedIdx);
      const c = connected ? active : base;
      const mult = connected ? 1.25 : emailFocused ? 0.95 : 0.45;
      attr.setXYZ(idx * 2, c.r * mult, c.g * mult, c.b * mult);
      attr.setXYZ(idx * 2 + 1, c.r * mult, c.g * mult, c.b * mult);
    });
    attr.needsUpdate = true;
  }, [layout, lineGeometry, hoveredIndex, selectedSkillId, emailFocused, colors.link]);

  useFrame((state) => {
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      const targetOpacity = hoveredIndex !== null ? 0.85 : emailFocused ? 0.65 : 0.35;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, 0.12);
    }
    void state;
  });

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (typeof e.instanceId === 'number' && layout.nodes[e.instanceId]) {
      onHoverNode(layout.nodes[e.instanceId], e.nativeEvent.clientX, e.nativeEvent.clientY);
    }
  };

  const handlePointerOut = () => {
    onHoverNode(null, 0, 0);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (typeof e.instanceId === 'number' && layout.nodes[e.instanceId]) {
      onSelectNode(layout.nodes[e.instanceId]);
    }
  };

  return (
    <group>
      <instancedMesh
        ref={nodesRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshStandardMaterial roughness={0.28} metalness={0.35} />
      </instancedMesh>

      <instancedMesh ref={ringsRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <torusGeometry args={[0.2, 0.022, 8, 24]} />
        <meshBasicMaterial />
      </instancedMesh>

      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial vertexColors transparent opacity={0.38} />
      </lineSegments>
    </group>
  );
}
