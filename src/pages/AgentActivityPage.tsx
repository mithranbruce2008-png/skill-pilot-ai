import { useEffect } from 'react';
import { Table2 } from 'lucide-react';
import { AgentConstellationTableFallback } from '../components/three/Fallback2DViews';
import { AgentConstellationView } from '../components/three/LazyViews';
import { AGENT_METADATA, type AgentId } from '../data/skillPilotData';
import { useAppStore } from '../store/useAppStore';
import { THEMES } from '../theme/themes';
import { useThemeStore } from '../theme/useThemeStore';

const AGENT_IDS: AgentId[] = ['profile', 'diagnosis', 'planning', 'evaluator', 'tutor'];

/**
 * Multi-Agent Activity page rendering the 5 agent orbs, live log pulses, and accessible activity table.
 */
export default function AgentActivityPage() {
  const agentLogs = useAppStore((s) => s.agentLogs);
  const themeId = useThemeStore((s) => s.themeId);
  const viewAsTable = useThemeStore((s) => s.viewAsTable);
  const setViewAsTable = useThemeStore((s) => s.setViewAsTable);
  const theme = THEMES[themeId];

  useEffect(() => {
    document.title = 'Agent Activity — SkillPilot AI';
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Multi-Agent Constellation</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-muted)' }}>
            Live pulses track handoffs between Profile, Diagnosis, Planning, Evaluator, and Tutor agents.
          </p>
        </div>

        <button
          type="button"
          aria-pressed={viewAsTable}
          onClick={() => setViewAsTable(!viewAsTable)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold cursor-pointer"
          style={{
            backgroundColor: viewAsTable ? 'var(--sp-accent)' : 'var(--sp-surface)',
            borderColor: 'var(--sp-border)',
            color: viewAsTable ? 'var(--sp-accent-text)' : 'var(--sp-text)',
          }}
        >
          <Table2 className="h-4 w-4" aria-hidden="true" />
          <span>{viewAsTable ? 'Show 3D Constellation' : 'View as table/list'}</span>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {AGENT_IDS.map((id) => (
          <div
            key={id}
            className="rounded-xl border p-3.5"
            style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: theme.colors.agents[id] }}
              />
              <span className="font-semibold text-sm">{AGENT_METADATA[id].label}</span>
            </div>
            <p className="mt-1 text-xs leading-snug" style={{ color: 'var(--sp-text-muted)' }}>
              {AGENT_METADATA[id].role}
            </p>
          </div>
        ))}
      </div>

      {!viewAsTable && (
        <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
          <AgentConstellationView logs={agentLogs} forceTable={false} />
        </div>
      )}

      <div className="rounded-2xl border" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
        <AgentConstellationTableFallback logs={agentLogs} />
      </div>
    </div>
  );
}
