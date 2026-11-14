import React, { useCallback, useEffect, useState } from 'react';
import { Table2 } from 'lucide-react';
import { SkillGalaxyView } from '../components/three/LazyViews';
import { CAREER_GOALS, SKILLS_CATALOG } from '../data/skillPilotData';
import { useAppStore } from '../store/useAppStore';
import type { QualityTier } from '../theme/themeSchema';
import { useThemeStore } from '../theme/useThemeStore';

/**
 * Interactive 3D Skill Analysis page with keyboard arrow-key navigation, live announcements, and table toggle.
 */
export default function SkillAnalysisPage() {
  const goalId = useAppStore((s) => s.goalId);
  const skillLevels = useAppStore((s) => s.skillLevels);
  const adaptationActive = useAppStore((s) => s.adaptationActive);
  const addToast = useAppStore((s) => s.addToast);
  const viewAsTable = useThemeStore((s) => s.viewAsTable);
  const setViewAsTable = useThemeStore((s) => s.setViewAsTable);

  const [selectedSkillId, setSelectedSkillId] = useState<string | null>('javascript');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [liveMessage, setLiveMessage] = useState<string>('');

  useEffect(() => {
    document.title = 'Skill Analysis — SkillPilot AI';
  }, []);

  const selectedSkill =
    SKILLS_CATALOG.find((s) => s.id === selectedSkillId) ?? SKILLS_CATALOG[0];
  const selectedLevel = skillLevels[selectedSkill.id] ?? 0;

  const handleStageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (focusedIndex + 1) % SKILLS_CATALOG.length;
      setFocusedIndex(next);
      const skill = SKILLS_CATALOG[next];
      const lvl = skillLevels[skill.id] ?? 0;
      setLiveMessage(`${skill.name}, ${skill.category}, Level ${lvl} of 4. ${skill.whyMatters}`);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (focusedIndex - 1 + SKILLS_CATALOG.length) % SKILLS_CATALOG.length;
      setFocusedIndex(prev);
      const skill = SKILLS_CATALOG[prev];
      const lvl = skillLevels[skill.id] ?? 0;
      setLiveMessage(`${skill.name}, ${skill.category}, Level ${lvl} of 4. ${skill.whyMatters}`);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const skill = SKILLS_CATALOG[focusedIndex];
      setSelectedSkillId(skill.id);
      setLiveMessage(`Selected ${skill.name}.`);
    } else if (e.key === 'Escape') {
      setSelectedSkillId(null);
      setLiveMessage('Cleared skill selection.');
    }
  };

  const handleDowngrade = useCallback(
    (tier: QualityTier, avgFps: number) => {
      addToast(`Switched 3D quality to ${tier} (${avgFps} fps).`, 'info');
    },
    [addToast],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Skill Analysis Galaxy</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--sp-text-muted)' }}>
            Target Goal: {CAREER_GOALS[goalId].title} · Glowing nodes are mastered (Lvl 2+); gold rings mark target role skills.
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
          <span>{viewAsTable ? 'Show 3D Galaxy' : 'View as table/list'}</span>
        </button>
      </div>

      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div
          tabIndex={0}
          onKeyDown={handleStageKeyDown}
          aria-label="Interactive Skill Galaxy. Use Left and Right arrow keys to inspect skills, Enter to select, Escape to clear."
          className="overflow-hidden rounded-2xl border lg:col-span-8"
          style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
        >
          <SkillGalaxyView
            goalId={goalId}
            skillLevels={skillLevels}
            adaptationActive={adaptationActive}
            selectedSkillId={selectedSkillId}
            onSelectSkill={(id) => {
              setSelectedSkillId(id);
              const idx = SKILLS_CATALOG.findIndex((s) => s.id === id);
              if (idx >= 0) setFocusedIndex(idx);
            }}
            forceTable={viewAsTable}
            onQualityDowngrade={handleDowngrade}
          />
        </div>

        <aside
          aria-label="Skill details panel"
          className="rounded-2xl border p-5 space-y-4 lg:col-span-4"
          style={{ backgroundColor: 'var(--sp-surface)', borderColor: 'var(--sp-border)' }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sp-text-muted)' }}>
              {selectedSkill.category}
            </p>
            <h2 className="mt-1 text-xl font-bold">{selectedSkill.name}</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border p-3" style={{ borderColor: 'var(--sp-border)', backgroundColor: 'var(--sp-bg-secondary)' }}>
              <span style={{ color: 'var(--sp-text-muted)' }}>Current Level</span>
              <p className="mt-1 text-lg font-bold sp-tabular">{selectedLevel} / 4</p>
            </div>
            <div className="rounded-xl border p-3" style={{ borderColor: 'var(--sp-border)', backgroundColor: 'var(--sp-bg-secondary)' }}>
              <span style={{ color: 'var(--sp-text-muted)' }}>Goal Relevance</span>
              <p className="mt-1 text-sm font-bold">
                {selectedSkill.requiredFor.includes(goalId) ? 'Required' : 'Elective'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sp-text-muted)' }}>
              Why It Matters
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed">{selectedSkill.whyMatters}</p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sp-text-muted)' }}>
              Prerequisites
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--sp-text-muted)' }}>
              {selectedSkill.prerequisites.length > 0
                ? selectedSkill.prerequisites
                    .map((pid) => SKILLS_CATALOG.find((s) => s.id === pid)?.name ?? pid)
                    .join(' · ')
                : 'Foundational entry skill (no prerequisites)'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
