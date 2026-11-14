import React, { Suspense, useState } from 'react';
import { useThemeStore } from '../../theme/useThemeStore';
import { THEMES } from '../../theme/themes';
import type {
  AgentLogEntry,
  EvaluationCriterion,
  GoalId,
  RoadmapModule,
} from '../../data/skillPilotData';
import type { QualityTier } from '../../theme/themeSchema';
import { CanvasErrorBoundary } from './CanvasErrorBoundary';
import {
  AgentConstellationTableFallback,
  LearningPathTableFallback,
  ScoreTowers2DFallback,
  SkillGalaxyTableFallback,
} from './Fallback2DViews';

const LazySkillGalaxyCanvas = React.lazy(() => import('./SkillGalaxyCanvas'));
const LazyLearningPathCanvas = React.lazy(() => import('./LearningPathCanvas'));
const LazyScoreTowersCanvas = React.lazy(() => import('./ScoreTowersCanvas'));
const LazyAgentConstellationCanvas = React.lazy(() => import('./AgentConstellationCanvas'));
const LazyMatchOrbCanvas = React.lazy(() => import('./MatchOrbCanvas'));
const LazyThemeBackdropCanvas = React.lazy(() => import('./ThemeBackdropCanvas'));

export function GradientSkeleton({ label = 'Preparing 3D environment' }: { label?: string }) {
  const themeId = useThemeStore((s) => s.themeId);
  const theme = THEMES[themeId];
  return (
    <div
      aria-label={label}
      className="flex h-full w-full items-center justify-center"
      style={{
        background: `radial-gradient(circle at 30% 35%, ${theme.colors.bgSecondary} 0%, ${theme.colors.bg} 72%)`,
      }}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function useShouldRender3D(): {
  canRender3D: boolean;
  unavailableReason: string | null;
  contextLost: boolean;
  setContextLost: (lost: boolean) => void;
} {
  const themeId = useThemeStore((s) => s.themeId);
  const qualityTier = useThemeStore((s) => s.qualityTier);
  const hasWebGL = useThemeStore((s) => s.hasWebGL);
  const [contextLost, setContextLost] = useState(false);

  const theme = THEMES[themeId];
  if (!hasWebGL) {
    return {
      canRender3D: false,
      unavailableReason: '3D unavailable: WebGL is not supported on this device. Showing 2D view.',
      contextLost,
      setContextLost,
    };
  }
  if (contextLost) {
    return {
      canRender3D: false,
      unavailableReason: '3D unavailable: WebGL graphics context was interrupted. Showing 2D view.',
      contextLost,
      setContextLost,
    };
  }
  if (!theme.supports3D || qualityTier === 'off') {
    return {
      canRender3D: false,
      unavailableReason: null,
      contextLost,
      setContextLost,
    };
  }
  return {
    canRender3D: true,
    unavailableReason: null,
    contextLost,
    setContextLost,
  };
}

export function LoginGalaxyBackdrop(props: {
  emailFocused: boolean;
  passwordFocused: boolean;
  invalidTrigger: number;
  warpSuccess: boolean;
  demoHighlight: boolean;
  onQualityDowngrade?: (tier: QualityTier, avgFps: number) => void;
}) {
  const { canRender3D, unavailableReason, setContextLost } = useShouldRender3D();
  const [errorFallback, setErrorFallback] = useState(false);
  const themeId = useThemeStore((s) => s.themeId);
  const theme = THEMES[themeId];

  const staticGradient = (
    <div
      className="relative h-full w-full"
      style={{
        background: `radial-gradient(circle at 28% 42%, ${theme.colors.accent}33 0%, ${theme.colors.bgSecondary} 45%, ${theme.colors.bg} 100%)`,
      }}
    >
      {(unavailableReason || errorFallback) && (
        <div
          role="status"
          className="absolute bottom-4 left-4 rounded-lg border px-3 py-1.5 text-xs"
          style={{
            backgroundColor: 'var(--sp-surface)',
            borderColor: 'var(--sp-border)',
            color: 'var(--sp-text-muted)',
          }}
        >
          3D unavailable — displaying accessible 2D backdrop.
        </div>
      )}
    </div>
  );

  if (!canRender3D || errorFallback) {
    return staticGradient;
  }

  return (
    <CanvasErrorBoundary fallback={staticGradient} onError={() => setErrorFallback(true)}>
      <Suspense fallback={<GradientSkeleton />}>
        <LazySkillGalaxyCanvas
          mode="login"
          emailFocused={props.emailFocused}
          passwordFocused={props.passwordFocused}
          invalidTrigger={props.invalidTrigger}
          warpSuccess={props.warpSuccess}
          demoHighlight={props.demoHighlight}
          onQualityDowngrade={props.onQualityDowngrade}
          onContextLost={setContextLost}
        />
      </Suspense>
    </CanvasErrorBoundary>
  );
}

export function SkillGalaxyView(props: {
  goalId: GoalId;
  skillLevels: Record<string, number>;
  adaptationActive: boolean;
  selectedSkillId: string | null;
  onSelectSkill: (id: string) => void;
  forceTable: boolean;
  onQualityDowngrade?: (tier: QualityTier, avgFps: number) => void;
}) {
  const { canRender3D, unavailableReason, setContextLost } = useShouldRender3D();
  const [errorFallback, setErrorFallback] = useState(false);

  const fallback = (
    <SkillGalaxyTableFallback
      goalId={props.goalId}
      skillLevels={props.skillLevels}
      adaptationActive={props.adaptationActive}
      selectedSkillId={props.selectedSkillId}
      onSelectSkill={props.onSelectSkill}
      notice={errorFallback ? '3D unavailable due to a graphics error. Showing table view.' : unavailableReason}
    />
  );

  if (props.forceTable || !canRender3D || errorFallback) {
    return fallback;
  }

  return (
    <CanvasErrorBoundary fallback={fallback} onError={() => setErrorFallback(true)}>
      <div className="h-[460px] w-full">
        <Suspense fallback={<GradientSkeleton label="Loading 3D Skill Galaxy" />}>
          <LazySkillGalaxyCanvas
            mode="analysis"
            goalId={props.goalId}
            skillLevels={props.skillLevels}
            adaptationActive={props.adaptationActive}
            selectedSkillId={props.selectedSkillId}
            onSelectSkill={props.onSelectSkill}
            onQualityDowngrade={props.onQualityDowngrade}
            onContextLost={setContextLost}
          />
        </Suspense>
      </div>
    </CanvasErrorBoundary>
  );
}

export function LearningPathView(props: {
  modules: RoadmapModule[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
  forceTable: boolean;
}) {
  const { canRender3D, unavailableReason } = useShouldRender3D();
  const [errorFallback, setErrorFallback] = useState(false);

  const fallback = (
    <LearningPathTableFallback
      modules={props.modules}
      selectedModuleId={props.selectedModuleId}
      onSelectModule={props.onSelectModule}
      notice={errorFallback ? '3D unavailable. Showing roadmap table.' : unavailableReason}
    />
  );

  if (props.forceTable || !canRender3D || errorFallback) {
    return fallback;
  }

  return (
    <CanvasErrorBoundary fallback={fallback} onError={() => setErrorFallback(true)}>
      <div className="h-[420px] w-full" role="img" aria-label="3D learning path roadmap with module gates">
        <Suspense fallback={<GradientSkeleton label="Loading 3D Learning Path" />}>
          <LazyLearningPathCanvas
            modules={props.modules}
            selectedModuleId={props.selectedModuleId}
            onSelectModule={props.onSelectModule}
          />
        </Suspense>
      </div>
    </CanvasErrorBoundary>
  );
}

export function ScoreTowersView(props: {
  criteria: EvaluationCriterion[];
  forceTable: boolean;
}) {
  const { canRender3D, unavailableReason } = useShouldRender3D();
  const [errorFallback, setErrorFallback] = useState(false);

  const fallback = (
    <ScoreTowers2DFallback
      criteria={props.criteria}
      notice={errorFallback ? '3D unavailable. Showing 2D rubric bars.' : unavailableReason}
    />
  );

  if (props.forceTable || !canRender3D || errorFallback) {
    return fallback;
  }

  return (
    <CanvasErrorBoundary fallback={fallback} onError={() => setErrorFallback(true)}>
      <div className="h-[360px] w-full" role="img" aria-label="3D score towers for 7 evaluation criteria">
        <Suspense fallback={<GradientSkeleton label="Loading 3D Score Towers" />}>
          <LazyScoreTowersCanvas criteria={props.criteria} />
        </Suspense>
      </div>
    </CanvasErrorBoundary>
  );
}

export function AgentConstellationView(props: {
  logs: AgentLogEntry[];
  forceTable: boolean;
}) {
  const { canRender3D, unavailableReason } = useShouldRender3D();
  const [errorFallback, setErrorFallback] = useState(false);

  const fallback = (
    <AgentConstellationTableFallback
      logs={props.logs}
      notice={errorFallback ? '3D unavailable. Showing agent activity table.' : unavailableReason}
    />
  );

  if (props.forceTable || !canRender3D || errorFallback) {
    return fallback;
  }

  return (
    <CanvasErrorBoundary fallback={fallback} onError={() => setErrorFallback(true)}>
      <div className="h-[380px] w-full" role="img" aria-label="3D constellation of 5 AI agents and live activity pulses">
        <Suspense fallback={<GradientSkeleton label="Loading 3D Agent Constellation" />}>
          <LazyAgentConstellationCanvas logs={props.logs} />
        </Suspense>
      </div>
    </CanvasErrorBoundary>
  );
}

export function MatchOrbView({ percent }: { percent: number }) {
  const { canRender3D } = useShouldRender3D();
  const [errorFallback, setErrorFallback] = useState(false);

  const fallback = (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--sp-border)" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          stroke="var(--sp-success)"
          strokeWidth="10"
          strokeDasharray={`${(percent / 100) * 314} 314`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xl font-bold sp-tabular">{percent}%</span>
        <span className="text-xs" style={{ color: 'var(--sp-text-muted)' }}>Role Match</span>
      </div>
    </div>
  );

  if (!canRender3D || errorFallback) {
    return fallback;
  }

  return (
    <CanvasErrorBoundary fallback={fallback} onError={() => setErrorFallback(true)}>
      <div className="relative h-40 w-40" role="img" aria-label={`Target career match ${percent} percent`}>
        <Suspense fallback={fallback}>
          <LazyMatchOrbCanvas percent={percent} />
        </Suspense>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="rounded-md px-2 py-0.5 text-2xl font-bold sp-tabular" style={{ backgroundColor: 'var(--sp-surface-glass)' }}>
            {percent}%
          </span>
        </div>
      </div>
    </CanvasErrorBoundary>
  );
}

export function ThemeBackdropView() {
  const { canRender3D } = useShouldRender3D();
  if (!canRender3D) return null;
  return (
    <CanvasErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <LazyThemeBackdropCanvas />
      </Suspense>
    </CanvasErrorBoundary>
  );
}
