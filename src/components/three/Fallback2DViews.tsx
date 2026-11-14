import { CheckCircle2, Lock, PauseCircle, PlayCircle, TrendingUp, Unlock, AlertTriangle } from 'lucide-react';
import {
  AGENT_METADATA,
  SKILLS_CATALOG,
  type AgentLogEntry,
  type EvaluationCriterion,
  type GoalId,
  type RoadmapModule,
} from '../../data/skillPilotData';
import { getCriterionVisual, getStatusVisual } from './layoutMath';

interface FallbackNoticeProps {
  reason?: string | null;
}

export function FallbackNotice({ reason }: FallbackNoticeProps) {
  if (!reason) return null;
  return (
    <div
      role="status"
      className="mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium"
      style={{
        backgroundColor: 'var(--sp-bg-secondary)',
        borderColor: 'var(--sp-border)',
        color: 'var(--sp-text-muted)',
      }}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: 'var(--sp-warning)' }} aria-hidden="true" />
      <span>{reason}</span>
    </div>
  );
}

/**
 * Accessible 2D table/grid fallback for SkillGalaxy.
 */
export function SkillGalaxyTableFallback({
  goalId,
  skillLevels,
  adaptationActive,
  selectedSkillId,
  onSelectSkill,
  notice,
}: {
  goalId: GoalId;
  skillLevels: Record<string, number>;
  adaptationActive: boolean;
  selectedSkillId: string | null;
  onSelectSkill: (id: string) => void;
  notice?: string | null;
}) {
  return (
    <div className="p-4">
      <FallbackNotice reason={notice} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text-muted)' }}>
              <th className="py-2.5 pr-4 font-semibold">Skill</th>
              <th className="py-2.5 pr-4 font-semibold">Category</th>
              <th className="py-2.5 pr-4 font-semibold">Level</th>
              <th className="py-2.5 pr-4 font-semibold">Status</th>
              <th className="py-2.5 font-semibold">Target Role</th>
            </tr>
          </thead>
          <tbody>
            {SKILLS_CATALOG.slice(0, 24).map((skill) => {
              const level = skillLevels[skill.id] ?? 0;
              const required = skill.requiredFor.includes(goalId);
              const isRevision = adaptationActive && skill.id === 'unit-testing';
              const isLearned = level >= 2;
              const statusText = isRevision
                ? 'Revision Flagged'
                : isLearned
                  ? 'Learned'
                  : required
                    ? 'Priority Gap'
                    : 'Developing';
              const selected = selectedSkillId === skill.id;
              return (
                <tr
                  key={skill.id}
                  onClick={() => onSelectSkill(skill.id)}
                  className="cursor-pointer border-b transition-colors"
                  style={{
                    borderColor: 'var(--sp-border)',
                    backgroundColor: selected ? 'var(--sp-bg-secondary)' : 'transparent',
                  }}
                >
                  <td className="py-2.5 pr-4 font-semibold">{skill.name}</td>
                  <td className="py-2.5 pr-4" style={{ color: 'var(--sp-text-muted)' }}>{skill.category}</td>
                  <td className="py-2.5 pr-4 sp-tabular">{level} / 4</td>
                  <td className="py-2.5 pr-4">{statusText}</td>
                  <td className="py-2.5">{required ? 'Required' : 'Optional'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Accessible 2D list/table fallback for LearningPath3D.
 */
export function LearningPathTableFallback({
  modules,
  selectedModuleId,
  onSelectModule,
  notice,
}: {
  modules: RoadmapModule[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
  notice?: string | null;
}) {
  const renderIcon = (iconName: ReturnType<typeof getStatusVisual>['iconName']) => {
    switch (iconName) {
      case 'check':
        return <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--sp-success)' }} aria-hidden="true" />;
      case 'play':
        return <PlayCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--sp-focus)' }} aria-hidden="true" />;
      case 'unlock':
        return <Unlock className="h-4 w-4 shrink-0" style={{ color: 'var(--sp-text)' }} aria-hidden="true" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: 'var(--sp-danger)' }} aria-hidden="true" />;
      case 'pause':
        return <PauseCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--sp-warning)' }} aria-hidden="true" />;
      default:
        return <Lock className="h-4 w-4 shrink-0" style={{ color: 'var(--sp-text-muted)' }} aria-hidden="true" />;
    }
  };

  return (
    <div className="p-4">
      <FallbackNotice reason={notice} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text-muted)' }}>
              <th className="py-2.5 pr-4 font-semibold">Order</th>
              <th className="py-2.5 pr-4 font-semibold">Module</th>
              <th className="py-2.5 pr-4 font-semibold">Status</th>
              <th className="py-2.5 pr-4 font-semibold">Duration</th>
              <th className="py-2.5 font-semibold">Skills / Notes</th>
            </tr>
          </thead>
          <tbody>
            {modules.map((mod, idx) => {
              const vis = getStatusVisual(mod.status);
              const selected = mod.id === selectedModuleId;
              return (
                <tr
                  key={mod.id}
                  onClick={() => onSelectModule(mod.id)}
                  className="cursor-pointer border-b"
                  style={{
                    borderColor: 'var(--sp-border)',
                    backgroundColor: selected ? 'var(--sp-bg-secondary)' : 'transparent',
                  }}
                >
                  <td className="py-3 pr-4 sp-tabular">{idx + 1}</td>
                  <td className="py-3 pr-4 font-semibold">{mod.title}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1.5">
                      {renderIcon(vis.iconName)}
                      <span>{vis.label}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 sp-tabular">{mod.durationWeeks} wk</td>
                  <td className="py-3" style={{ color: 'var(--sp-text-muted)' }}>
                    {mod.reason ?? mod.skillsCovered.join(' · ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Accessible 2D progress bars view for the 7 evaluation criteria.
 */
export function ScoreTowers2DFallback({
  criteria,
  notice,
}: {
  criteria: EvaluationCriterion[];
  notice?: string | null;
}) {
  return (
    <div className="p-4">
      <FallbackNotice reason={notice} />
      <div className="grid gap-3 sm:grid-cols-2">
        {criteria.map((criterion) => {
          const pct = Math.round((criterion.score / criterion.maxScore) * 100);
          const vis = getCriterionVisual(criterion.score, criterion.maxScore);
          const colorVar =
            vis.colorKey === 'success'
              ? 'var(--sp-success)'
              : vis.colorKey === 'warning'
                ? 'var(--sp-warning)'
                : 'var(--sp-danger)';
          const Icon =
            vis.iconName === 'check'
              ? CheckCircle2
              : vis.iconName === 'trending'
                ? TrendingUp
                : AlertTriangle;

          return (
            <div
              key={criterion.id}
              className="rounded-xl border p-3.5"
              style={{ borderColor: 'var(--sp-border)', backgroundColor: 'var(--sp-bg-secondary)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-sm">{criterion.name}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold sp-tabular" style={{ color: colorVar }}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{vis.status} · {criterion.score}/{criterion.maxScore}</span>
                </span>
              </div>
              <div
                className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: 'var(--sp-surface)' }}
                role="progressbar"
                aria-label={`${criterion.name} score`}
                aria-valuenow={criterion.score}
                aria-valuemin={0}
                aria-valuemax={criterion.maxScore}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: colorVar }}
                />
              </div>
              <p className="mt-1.5 text-xs" style={{ color: 'var(--sp-text-muted)' }}>
                {criterion.feedback}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Accessible 2D table fallback for AgentConstellation.
 */
export function AgentConstellationTableFallback({
  logs,
  notice,
}: {
  logs: AgentLogEntry[];
  notice?: string | null;
}) {
  return (
    <div className="p-4">
      <FallbackNotice reason={notice} />
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text-muted)' }}>
              <th className="py-2.5 pr-4 font-semibold">Time</th>
              <th className="py-2.5 pr-4 font-semibold">From Agent</th>
              <th className="py-2.5 pr-4 font-semibold">To Agent</th>
              <th className="py-2.5 pr-4 font-semibold">Action</th>
              <th className="py-2.5 font-semibold">Detail</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b" style={{ borderColor: 'var(--sp-border)' }}>
                <td className="py-2.5 pr-4 font-mono text-xs sp-tabular">{log.timestamp}</td>
                <td className="py-2.5 pr-4 font-semibold">{AGENT_METADATA[log.from].label}</td>
                <td className="py-2.5 pr-4 font-semibold">{AGENT_METADATA[log.to].label}</td>
                <td className="py-2.5 pr-4">{log.action}</td>
                <td className="py-2.5" style={{ color: 'var(--sp-text-muted)' }}>{log.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
