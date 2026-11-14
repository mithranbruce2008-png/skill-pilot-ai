import React, { useEffect, useState } from 'react';
import { Send, Table2 } from 'lucide-react';
import { ScoreTowers2DFallback } from '../components/three/Fallback2DViews';
import { ScoreTowersView } from '../components/three/LazyViews';
import { useAppStore } from '../store/useAppStore';
import { useThemeStore } from '../theme/useThemeStore';

/**
 * Code Evaluation page with 3D ScoreTowers, 2D accessible rubric bars, and interactive submission trigger.
 */
export default function EvaluationPage() {
  const evaluationCriteria = useAppStore((s) => s.evaluationCriteria);
  const submitEvaluation = useAppStore((s) => s.submitEvaluation);
  const viewAsTable = useThemeStore((s) => s.viewAsTable);
  const setViewAsTable = useThemeStore((s) => s.setViewAsTable);

  const [testingInput, setTestingInput] = useState<number>(
    evaluationCriteria.find((c) => c.id === 'testing')?.score ?? 18,
  );

  useEffect(() => {
    document.title = 'Evaluation — SkillPilot AI';
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitEvaluation({ testing: testingInput });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">7-Criteria Code Evaluation</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-muted)' }}>
            Submit rubric results to see live 3D ScoreTowers and automatic roadmap adaptation when Testing falls below 16/25.
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
          <span>{viewAsTable ? 'Show 3D Towers' : 'View as table/list'}</span>
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border p-5"
        style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
      >
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="testing-score-slider" className="block text-sm font-semibold">
            Testing Criterion Score: <span className="font-mono sp-tabular">{testingInput} / 25</span>
          </label>
          <input
            id="testing-score-slider"
            type="range"
            min={0}
            max={25}
            value={testingInput}
            onChange={(e) => setTestingInput(Number(e.target.value))}
            className="mt-2 w-full cursor-pointer"
          />
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              setTestingInput(13);
              submitEvaluation({ testing: 13 });
            }}
            className="min-h-[44px] rounded-xl border px-4 py-2 text-xs font-semibold cursor-pointer"
            style={{ borderColor: 'var(--sp-warning)', color: 'var(--sp-warning)' }}
          >
            Submit with Testing = 13
          </button>

          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer"
            style={{ backgroundColor: 'var(--sp-accent)', color: 'var(--sp-accent-text)' }}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>Submit Evaluation</span>
          </button>
        </div>
      </form>

      {!viewAsTable && (
        <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
          <ScoreTowersView criteria={evaluationCriteria} forceTable={false} />
        </div>
      )}

      <div className="rounded-2xl border" style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}>
        <ScoreTowers2DFallback criteria={evaluationCriteria} />
      </div>
    </div>
  );
}
