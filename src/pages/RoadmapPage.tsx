import { useEffect, useState } from 'react';
import { RotateCcw, Table2, Zap } from 'lucide-react';
import { LearningPathView } from '../components/three/LazyViews';
import { getStatusVisual } from '../components/three/layoutMath';
import { useAppStore } from '../store/useAppStore';
import { useThemeStore } from '../theme/useThemeStore';

/**
 * Adaptive Learning Roadmap page featuring LearningPath3D, Unit Testing insertion alert, and table fallback.
 */
export default function RoadmapPage() {
  const modules = useAppStore((s) => s.modules);
  const adaptationReason = useAppStore((s) => s.adaptationReason);
  const submitEvaluation = useAppStore((s) => s.submitEvaluation);
  const resetRoadmap = useAppStore((s) => s.resetRoadmap);
  const viewAsTable = useThemeStore((s) => s.viewAsTable);
  const setViewAsTable = useThemeStore((s) => s.setViewAsTable);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(
    modules.find((m) => m.status === 'revision' || m.status === 'in_progress')?.id ?? null,
  );

  useEffect(() => {
    document.title = 'Learning Roadmap — SkillPilot AI';
  }, []);

  const selectedModule =
    modules.find((m) => m.id === selectedModuleId) ?? modules[0];

  const handleSimulateAdaptation = () => {
    submitEvaluation({ testing: 13 });
    setSelectedModuleId('mod-unit-testing-revision');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Adaptive Learning Roadmap</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-muted)' }}>
            Winding 3D module gates react dynamically to evaluation rubric feedback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSimulateAdaptation}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--sp-accent)', color: 'var(--sp-accent-text)' }}
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            <span>Simulate Testing = 13</span>
          </button>

          <button
            type="button"
            onClick={resetRoadmap}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold cursor-pointer"
            style={{ borderColor: 'var(--sp-border)', backgroundColor: 'var(--sp-surface)' }}
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            aria-pressed={viewAsTable}
            onClick={() => setViewAsTable(!viewAsTable)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold cursor-pointer"
            style={{
              backgroundColor: viewAsTable ? 'var(--sp-accent)' : 'var(--sp-surface)',
              borderColor: 'var(--sp-border)',
              color: viewAsTable ? 'var(--sp-accent-text)' : 'var(--sp-text)',
            }}
          >
            <Table2 className="h-4 w-4" aria-hidden="true" />
            <span>{viewAsTable ? 'Show 3D Path' : 'View as table/list'}</span>
          </button>
        </div>
      </div>

      {adaptationReason && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: 'var(--sp-surface)',
            borderColor: 'var(--sp-danger)',
            color: 'var(--sp-text)',
          }}
        >
          <span className="font-semibold" style={{ color: 'var(--sp-danger)' }}>
            Adaptation Active:
          </span>{' '}
          {adaptationReason}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
        <LearningPathView
          modules={modules}
          selectedModuleId={selectedModuleId}
          onSelectModule={setSelectedModuleId}
          forceTable={viewAsTable}
        />
      </div>

      {selectedModule && (
        <section
          aria-label="Selected module summary"
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{selectedModule.title}</h2>
            <span className="text-xs font-semibold" style={{ color: 'var(--sp-text-muted)' }}>
              Status: {getStatusVisual(selectedModule.status).label} · {selectedModule.durationWeeks} weeks
            </span>
          </div>
          <p className="mt-2 text-sm" style={{ color: 'var(--sp-text-muted)' }}>
            {selectedModule.reason ?? `Covers: ${selectedModule.skillsCovered.join(', ')}`}
          </p>
        </section>
      )}
    </div>
  );
}
