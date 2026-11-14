import type { AgentId, ModuleStatus, RoadmapModule, SkillDefinition } from '../../data/skillPilotData';

export interface GalaxyNodeLayout {
  index: number;
  skill: SkillDefinition;
  position: [number, number, number];
}

export interface GalaxyLayoutResult {
  nodes: GalaxyNodeLayout[];
  links: Array<[number, number]>;
}

const CATEGORY_RADIUS: Record<SkillDefinition['category'], number> = {
  'Core CS': 3.6,
  Frontend: 4.5,
  Backend: 5.3,
  'Data & AI': 6.0,
  DevOps: 6.7,
};

/**
 * Generates deterministic 3D galaxy node coordinates with minimum separation and prerequisite link indices.
 */
export function computeGalaxyLayout(
  skills: SkillDefinition[],
  minDistance = 0.85,
): GalaxyLayoutResult {
  const n = skills.length;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const idToIndex = new Map<string, number>();

  const coords: Array<[number, number, number]> = skills.map((skill, i) => {
    idToIndex.set(skill.id, i);
    const yNorm = n > 1 ? 1 - (i / (n - 1)) * 2 : 0;
    const radial = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const theta = goldenAngle * i;
    const baseRadius = CATEGORY_RADIUS[skill.category] ?? 5.0;
    const x = Math.cos(theta) * radial * baseRadius;
    const y = yNorm * (baseRadius * 0.58);
    const z = Math.sin(theta) * radial * baseRadius;
    return [x, y, z];
  });

  // Deterministic relaxation passes to guarantee minimum pairwise separation
  for (let pass = 0; pass < 8; pass += 1) {
    for (let i = 0; i < n; i += 1) {
      for (let j = i + 1; j < n; j += 1) {
        const dx = coords[j][0] - coords[i][0];
        const dy = coords[j][1] - coords[i][1];
        const dz = coords[j][2] - coords[i][2];
        const distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < minDistance * minDistance) {
          const dist = Math.max(0.001, Math.sqrt(distSq));
          const push = (minDistance - dist) * 0.55;
          const nx = dx / dist;
          const ny = dy / dist;
          const nz = dz / dist;
          coords[i][0] -= nx * push;
          coords[i][1] -= ny * push;
          coords[i][2] -= nz * push;
          coords[j][0] += nx * push;
          coords[j][1] += ny * push;
          coords[j][2] += nz * push;
        }
      }
    }
  }

  const nodes: GalaxyNodeLayout[] = skills.map((skill, index) => ({
    index,
    skill,
    position: coords[index],
  }));

  const links: Array<[number, number]> = [];
  skills.forEach((skill, idx) => {
    skill.prerequisites.forEach((prereqId) => {
      const targetIdx = idToIndex.get(prereqId);
      if (targetIdx !== undefined && targetIdx !== idx) {
        links.push([targetIdx, idx]);
      }
    });
  });

  return { nodes, links };
}

export interface RoadmapGatePosition {
  module: RoadmapModule;
  order: number;
  position: [number, number, number];
}

/**
 * Computes winding S-curve 3D positions for learning roadmap gates in strict sequence.
 */
export function computeRoadmapLayout(modules: RoadmapModule[]): RoadmapGatePosition[] {
  const count = modules.length;
  return modules.map((module, index) => {
    const x = (index - (count - 1) / 2) * 2.5;
    const y = Math.sin(index * 0.85) * 0.35;
    const z = Math.cos(index * 0.9) * 1.4;
    return {
      module,
      order: index,
      position: [x, y, z],
    };
  });
}

export interface AgentOrbitNode {
  id: AgentId;
  position: [number, number, number];
  ringTilt: [number, number, number];
}

const AGENT_ORDER: AgentId[] = ['profile', 'diagnosis', 'planning', 'evaluator', 'tutor'];

/**
 * Computes 3D positions for the 5 SkillPilot AI agent orbs along tilted orbital rings.
 */
export function computeAgentOrbitPositions(radius = 2.6): AgentOrbitNode[] {
  return AGENT_ORDER.map((id, i) => {
    const angle = (i / AGENT_ORDER.length) * Math.PI * 2;
    const tiltX = ((i % 3) - 1) * 0.28;
    const tiltZ = ((i % 2) === 0 ? 1 : -1) * 0.2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle * 2) * 0.55;
    const z = Math.sin(angle) * radius;
    return {
      id,
      position: [x, y, z],
      ringTilt: [tiltX, 0, tiltZ],
    };
  });
}

export interface StatusVisualSpec {
  status: ModuleStatus;
  label: string;
  iconName: 'check' | 'play' | 'unlock' | 'lock' | 'alert' | 'pause';
  colorKey: 'success' | 'accent' | 'text' | 'textMuted' | 'danger' | 'warning';
}

const STATUS_MAP: Record<ModuleStatus, StatusVisualSpec> = {
  completed: { status: 'completed', label: 'Completed', iconName: 'check', colorKey: 'success' },
  in_progress: { status: 'in_progress', label: 'In Progress', iconName: 'play', colorKey: 'accent' },
  unlocked: { status: 'unlocked', label: 'Unlocked', iconName: 'unlock', colorKey: 'text' },
  locked: { status: 'locked', label: 'Locked', iconName: 'lock', colorKey: 'textMuted' },
  revision: { status: 'revision', label: 'Revision Required', iconName: 'alert', colorKey: 'danger' },
  paused: { status: 'paused', label: 'Paused', iconName: 'pause', colorKey: 'warning' },
};

/**
 * Maps every roadmap module status to explicit text + icon + color token (never color alone).
 */
export function getStatusVisual(status: ModuleStatus): StatusVisualSpec {
  return STATUS_MAP[status];
}

export type CriterionStatus = 'Mastered' | 'Developing' | 'Needs Revision';

/**
 * Evaluates a rubric criterion score into a dual-coded status label and icon name.
 */
export function getCriterionVisual(
  score: number,
  maxScore: number,
): { status: CriterionStatus; iconName: 'check' | 'trending' | 'alert'; colorKey: 'success' | 'warning' | 'danger' } {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  if (ratio >= 0.8) {
    return { status: 'Mastered', iconName: 'check', colorKey: 'success' };
  }
  if (ratio >= 0.64) {
    return { status: 'Developing', iconName: 'trending', colorKey: 'warning' };
  }
  return { status: 'Needs Revision', iconName: 'alert', colorKey: 'danger' };
}
