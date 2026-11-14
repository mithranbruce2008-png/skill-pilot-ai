import { create } from 'zustand';
import {
  DEFAULT_USER_SKILL_LEVELS,
  DEMO_STUDENT_SKILL_LEVELS,
  INITIAL_AGENT_LOGS,
  INITIAL_EVALUATION_CRITERIA,
  INITIAL_ROADMAP_MODULES,
  type AgentLogEntry,
  type EvaluationCriterion,
  type GoalId,
  type RoadmapModule,
} from '../data/skillPilotData';
import type { UserSession } from '../schemas/authSchemas';

export interface AppToast {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}

export interface AppState {
  session: UserSession | null;
  goalId: GoalId;
  skillLevels: Record<string, number>;
  modules: RoadmapModule[];
  evaluationCriteria: EvaluationCriterion[];
  agentLogs: AgentLogEntry[];
  adaptationActive: boolean;
  adaptationReason: string | null;
  isDemoLoaded: boolean;
  toasts: AppToast[];

  setSession: (session: UserSession | null) => void;
  clearSession: () => void;
  setGoalId: (goalId: GoalId) => void;
  loadDemoStudent: () => void;
  submitEvaluation: (scores: Record<string, number>) => void;
  resetRoadmap: () => void;
  addToast: (message: string, tone?: AppToast['tone']) => void;
  dismissToast: (id: string) => void;
}

function nowTimeString(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

/**
 * Central SkillPilot AI application store holding minimal user session, skills, roadmap, scores, and agent logs.
 */
export const useAppStore = create<AppState>((set, get) => ({
  session: null,
  goalId: 'fullstack',
  skillLevels: { ...DEFAULT_USER_SKILL_LEVELS },
  modules: INITIAL_ROADMAP_MODULES.map((m) => ({ ...m })),
  evaluationCriteria: INITIAL_EVALUATION_CRITERIA.map((c) => ({ ...c })),
  agentLogs: INITIAL_AGENT_LOGS.map((l) => ({ ...l })),
  adaptationActive: false,
  adaptationReason: null,
  isDemoLoaded: false,
  toasts: [],

  setSession: (session) => set({ session }),

  clearSession: () =>
    set({
      session: null,
      isDemoLoaded: false,
    }),

  setGoalId: (goalId) => {
    const label = goalId === 'fullstack' ? 'Full-Stack Engineer' : 'Data Scientist';
    set((state) => ({
      goalId,
      agentLogs: [
        {
          id: `log-${Date.now()}`,
          from: 'profile',
          to: 'diagnosis',
          action: `Switched target career goal to ${label}`,
          detail: 'Recalculated required skill rings and career match score.',
          timestamp: nowTimeString(),
        },
        ...state.agentLogs,
      ],
    }));
  },

  loadDemoStudent: () => {
    set({
      goalId: 'fullstack',
      skillLevels: { ...DEMO_STUDENT_SKILL_LEVELS },
      modules: INITIAL_ROADMAP_MODULES.map((m) => ({ ...m })),
      evaluationCriteria: INITIAL_EVALUATION_CRITERIA.map((c) => ({ ...c })),
      agentLogs: [
        {
          id: `log-demo-${Date.now()}`,
          from: 'profile',
          to: 'diagnosis',
          action: 'Loaded Demo Student (Alex Rivera)',
          detail: 'Python & SQL verified (Lvl 3); JavaScript, React, Node.js identified as target gaps.',
          timestamp: nowTimeString(),
        },
        ...INITIAL_AGENT_LOGS,
      ],
      adaptationActive: false,
      adaptationReason: null,
      isDemoLoaded: true,
    });
  },

  submitEvaluation: (scores) => {
    const state = get();
    const updatedCriteria = state.evaluationCriteria.map((criterion) => {
      const nextScore = scores[criterion.id] ?? criterion.score;
      return {
        ...criterion,
        score: Math.max(0, Math.min(criterion.maxScore, nextScore)),
      };
    });

    const testingScore = scores['testing'] ?? 18;
    const needsAdaptation = testingScore <= 15;
    const timestamp = nowTimeString();

    if (needsAdaptation) {
      const reason = `Inserted because Testing score (${testingScore}/25) fell below mastery threshold (16/25).`;
      const baseModules = INITIAL_ROADMAP_MODULES.map((m) => {
        if (m.id === 'mod-node-api' || m.id === 'mod-cloud') {
          return {
            ...m,
            status: 'paused' as const,
            reason: 'Paused while Unit Testing remediation is completed.',
          };
        }
        return { ...m };
      });

      const revisionModule: RoadmapModule = {
        id: 'mod-unit-testing-revision',
        title: 'Unit Testing',
        durationWeeks: 1,
        status: 'revision',
        skillsCovered: ['Unit Testing', 'JavaScript'],
        reason,
      };

      const adaptedModules = [
        ...baseModules.slice(0, 3),
        revisionModule,
        ...baseModules.slice(3),
      ];

      const newLogs: AgentLogEntry[] = [
        {
          id: `log-eval-${Date.now()}-3`,
          from: 'tutor',
          to: 'planning',
          action: 'Inserted "Unit Testing" module & paused advanced gates',
          detail: reason,
          timestamp,
        },
        {
          id: `log-eval-${Date.now()}-2`,
          from: 'evaluator',
          to: 'tutor',
          action: `Flagged Testing score (${testingScore}/25)`,
          detail: 'Requested targeted unit-testing remediation drills from Tutor.',
          timestamp,
        },
        ...state.agentLogs,
      ];

      set({
        evaluationCriteria: updatedCriteria,
        modules: adaptedModules,
        adaptationActive: true,
        adaptationReason: reason,
        agentLogs: newLogs,
        skillLevels: {
          ...state.skillLevels,
          'unit-testing': 0,
        },
      });
      get().addToast('Roadmap adapted: "Unit Testing" inserted and advanced modules paused.', 'warning');
    } else {
      set({
        evaluationCriteria: updatedCriteria,
        modules: INITIAL_ROADMAP_MODULES.map((m) => ({ ...m })),
        adaptationActive: false,
        adaptationReason: null,
        agentLogs: [
          {
            id: `log-eval-ok-${Date.now()}`,
            from: 'evaluator',
            to: 'planning',
            action: `Evaluation passed (Testing ${testingScore}/25)`,
            detail: 'All 7 rubric criteria meet progression threshold.',
            timestamp,
          },
          ...state.agentLogs,
        ],
      });
      get().addToast('Evaluation recorded. All criteria meet progression threshold.', 'success');
    }
  },

  resetRoadmap: () =>
    set({
      modules: INITIAL_ROADMAP_MODULES.map((m) => ({ ...m })),
      evaluationCriteria: INITIAL_EVALUATION_CRITERIA.map((c) => ({ ...c })),
      adaptationActive: false,
      adaptationReason: null,
    }),

  addToast: (message, tone = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    set((state) => ({
      toasts: [...state.toasts.slice(-3), { id, message, tone }],
    }));
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        get().dismissToast(id);
      }, 6000);
    }
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
