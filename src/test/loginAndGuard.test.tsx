import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { CanvasErrorBoundary } from '../components/three/CanvasErrorBoundary';
import AgentActivityPage from '../pages/AgentActivityPage';
import DashboardPage from '../pages/DashboardPage';
import LoginPage from '../pages/LoginPage';
import RoadmapPage from '../pages/RoadmapPage';
import SkillAnalysisPage from '../pages/SkillAnalysisPage';
import { useAppStore } from '../store/useAppStore';
import { THEME_LIST } from '../theme/themes';
import { useThemeStore } from '../theme/useThemeStore';

// Mock the lazy 3D canvases so RTL tests verify DOM behavior, fallbacks, and axe cleanly
vi.mock('../components/three/SkillGalaxyCanvas', () => ({
  default: () => <div data-testid="mock-skill-galaxy-3d">Mock 3D Galaxy</div>,
}));
vi.mock('../components/three/LearningPathCanvas', () => ({
  default: () => <div data-testid="mock-learning-path-3d">Mock 3D Path</div>,
}));
vi.mock('../components/three/ScoreTowersCanvas', () => ({
  default: () => <div data-testid="mock-score-towers-3d">Mock 3D Towers</div>,
}));
vi.mock('../components/three/AgentConstellationCanvas', () => ({
  default: () => <div data-testid="mock-agent-constellation-3d">Mock 3D Agents</div>,
}));
vi.mock('../components/three/MatchOrbCanvas', () => ({
  default: () => <div data-testid="mock-match-orb-3d">Mock 3D MatchOrb</div>,
}));
vi.mock('../components/three/ThemeBackdropCanvas', () => ({
  default: () => <div data-testid="mock-backdrop-3d" />,
}));

function resetStores() {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useAppStore.getState().clearSession();
  useAppStore.getState().resetRoadmap();
  useThemeStore.setState({
    themeId: 'cosmos',
    qualityTier: 'off',
    reducedMotion: false,
    highContrast: false,
    viewAsTable: false,
    hasWebGL: true,
  });
}

describe('LoginPage, Route Guard, ErrorBoundary, and Accessibility', () => {
  beforeEach(() => {
    resetStores();
  });

  it('renders login form and 2D gradient cleanly when 3D is Off', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /Welcome back to SkillPilot AI/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try demo student/i })).toBeInTheDocument();
  });

  it('redirects unauthenticated visits to /login and returns to the intended route after Demo Student login', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/skills']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /Welcome back to SkillPilot AI/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Try demo student/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Skill Analysis Galaxy/i })).toBeInTheDocument();
    });
    expect(useAppStore.getState().isDemoLoaded).toBe(true);
    expect(useAppStore.getState().skillLevels.python).toBe(3);
  });

  it('renders CanvasErrorBoundary 2D fallback when a 3D child throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Broken3D = () => {
      throw new Error('WebGL context failure');
    };

    render(
      <CanvasErrorBoundary fallback={<div>3D unavailable fallback</div>}>
        <Broken3D />
      </CanvasErrorBoundary>,
    );

    expect(screen.getByText(/3D unavailable fallback/i)).toBeInTheDocument();
    spy.mockRestore();
  });

  it('toggles table view and supports keyboard navigation on SkillAnalysisPage', async () => {
    const user = userEvent.setup();
    useAppStore.getState().loadDemoStudent();

    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<SkillAnalysisPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const stage = screen.getByLabelText(/Interactive Skill Galaxy/i);
    stage.focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText(/CSS, Frontend, Level 3 of 4/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /View as table\/list/i }));
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
  });

  it('passes jest-axe with zero violations on LoginPage in 3D Off, mocked Full, and all 5 themes', async () => {
    for (const theme of THEME_LIST) {
      act(() => {
        useThemeStore.getState().setThemeId(theme.id);
        useThemeStore.getState().setQualityTier(theme.supports3D ? 'full' : 'off');
      });

      const { container, unmount } = render(
        <MemoryRouter initialEntries={['/login']}>
          <LoginPage />
        </MemoryRouter>,
      );

      const results = await axe(container);
      expect(results.violations, `LoginPage axe violations in ${theme.id}`).toHaveLength(0);
      unmount();
    }
  });

  it('passes jest-axe on Dashboard, Skill Analysis, Roadmap, and Agent Activity in 3D-Off and 3D-Lite table modes', async () => {
    useAppStore.getState().loadDemoStudent();
    useThemeStore.setState({ qualityTier: 'lite', viewAsTable: true });

    const pages = [
      <DashboardPage key="dash" />,
      <SkillAnalysisPage key="skills" />,
      <RoadmapPage key="road" />,
      <AgentActivityPage key="agents" />,
    ];

    for (const page of pages) {
      const { container, unmount } = render(<MemoryRouter>{page}</MemoryRouter>);
      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
      unmount();
    }
  });

  it('inserts Unit Testing gate, pauses advanced modules, and fires Evaluator -> Tutor -> Planning on Testing = 13', async () => {
    const user = userEvent.setup();
    useAppStore.getState().loadDemoStudent();
    useThemeStore.setState({ qualityTier: 'off', viewAsTable: true });

    render(
      <MemoryRouter>
        <RoadmapPage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /Simulate Testing = 13/i }));

    expect(screen.getAllByText(/Unit Testing/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Paused/i).length).toBeGreaterThan(0);
    const logs = useAppStore.getState().agentLogs;
    expect(logs.some((l) => l.from === 'evaluator' && l.to === 'tutor')).toBe(true);
    expect(logs.some((l) => l.from === 'tutor' && l.to === 'planning')).toBe(true);
  });

  it('keeps Python and SQL mastered when switching target career goal to Data Scientist', () => {
    useAppStore.getState().loadDemoStudent();
    useAppStore.getState().setGoalId('datascientist');
    const state = useAppStore.getState();
    expect(state.goalId).toBe('datascientist');
    expect(state.skillLevels.python).toBe(3);
    expect(state.skillLevels.sql).toBe(3);
  });
});
