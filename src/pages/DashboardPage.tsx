import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { MatchOrbView } from '../components/three/LazyViews';
import {
  AGENT_METADATA,
  CAREER_GOALS,
  SKILLS_CATALOG,
  computeGoalMatchPercent,
} from '../data/skillPilotData';
import { useAppStore } from '../store/useAppStore';

/**
 * SkillPilot AI Dashboard summarizing target role match, priority gaps, roadmap status, and recent agent pulses.
 */
export default function DashboardPage() {
  const goalId = useAppStore((s) => s.goalId);
  const skillLevels = useAppStore((s) => s.skillLevels);
  const modules = useAppStore((s) => s.modules);
  const evaluationCriteria = useAppStore((s) => s.evaluationCriteria);
  const agentLogs = useAppStore((s) => s.agentLogs);
  const adaptationReason = useAppStore((s) => s.adaptationReason);

  useEffect(() => {
    document.title = 'Dashboard — SkillPilot AI';
  }, []);

  const matchPercent = computeGoalMatchPercent(goalId, skillLevels);
  const requiredSkills = SKILLS_CATALOG.filter((s) => s.requiredFor.includes(goalId));
  const masteredCount = requiredSkills.filter((s) => (skillLevels[s.id] ?? 0) >= 2).length;
  const gapSkills = requiredSkills.filter((s) => (skillLevels[s.id] ?? 0) < 2);
  const avgScore = Math.round(
    (evaluationCriteria.reduce((acc, c) => acc + c.score / c.maxScore, 0) /
      evaluationCriteria.length) *
      100,
  );
  const goal = CAREER_GOALS[goalId];

  return (
    <div className="space-y-6">
      <section
        className="grid items-center gap-6 rounded-2xl border p-6 md:grid-cols-12"
        style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
      >
        <div className="space-y-2 md:col-span-8">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sp-text-muted)' }}>
            Active Career Track · {goal.title}
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">Your Personalized Learning Cockpit</h1>
          <p className="max-w-2xl text-sm leading-relaxed" style={{ color: 'var(--sp-text-muted)' }}>
            {goal.subtitle}. {masteredCount} of {requiredSkills.length} required skills mastered, with{' '}
            {gapSkills.length} priority gaps mapped into your adaptive roadmap.
          </p>
          {adaptationReason && (
            <div
              role="status"
              className="mt-3 rounded-xl border px-3.5 py-2.5 text-xs font-medium"
              style={{
                backgroundColor: 'var(--sp-bg-secondary)',
                borderColor: 'var(--sp-warning)',
                color: 'var(--sp-warning)',
              }}
            >
              Roadmap Adapted: {adaptationReason}
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/skills"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: 'var(--sp-accent)', color: 'var(--sp-accent-text)' }}
            >
              <span>Open Skill Galaxy</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/evaluation"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold"
              style={{ borderColor: 'var(--sp-border)', color: 'var(--sp-text)' }}
            >
              <span>Submit Evaluation</span>
            </Link>
          </div>
        </div>
        <div className="flex justify-center md:col-span-4">
          <MatchOrbView percent={matchPercent} />
        </div>
      </section>

      <section aria-label="Learning metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--sp-text-muted)' }}>Target Role Match</p>
          <p className="mt-2 text-3xl font-bold sp-tabular">{matchPercent}%</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--sp-text-muted)' }}>Required Skills Mastered</p>
          <p className="mt-2 text-3xl font-bold sp-tabular">{masteredCount}/{requiredSkills.length}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--sp-text-muted)' }}>Roadmap Gates</p>
          <p className="mt-2 text-3xl font-bold sp-tabular">{modules.length}</p>
        </div>
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--sp-text-muted)' }}>Rubric Average</p>
          <p className="mt-2 text-3xl font-bold sp-tabular">{avgScore}%</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Priority Skill Gaps</h2>
            <Link to="/skills" className="text-xs font-semibold underline" style={{ color: 'var(--sp-focus)' }}>
              Explore all 60
            </Link>
          </div>
          <ul className="mt-4 divide-y" style={{ borderColor: 'var(--sp-border)' }}>
            {gapSkills.slice(0, 6).map((skill) => (
              <li key={skill.id} className="flex items-center justify-between py-2.5 text-sm">
                <div>
                  <span className="font-semibold">{skill.name}</span>
                  <span className="ml-2 text-xs" style={{ color: 'var(--sp-text-muted)' }}>
                    · {skill.category}
                  </span>
                </div>
                <span className="font-mono text-xs sp-tabular" style={{ color: 'var(--sp-warning)' }}>
                  Level {skillLevels[skill.id] ?? 0}/4
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border p-5" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Agent Coordination</h2>
            <Link to="/agents" className="text-xs font-semibold underline" style={{ color: 'var(--sp-focus)' }}>
              View Constellation
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {agentLogs.slice(0, 4).map((log) => (
              <li
                key={log.id}
                className="rounded-xl border p-3 text-xs"
                style={{ borderColor: 'var(--sp-border)', backgroundColor: 'var(--sp-bg-secondary)' }}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>
                    {AGENT_METADATA[log.from].label} → {AGENT_METADATA[log.to].label}
                  </span>
                  <span className="font-mono sp-tabular" style={{ color: 'var(--sp-text-muted)' }}>
                    {log.timestamp}
                  </span>
                </div>
                <p className="mt-1">{log.action}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
