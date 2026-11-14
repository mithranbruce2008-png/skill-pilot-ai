import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, SlidersHorizontal, UserCheck } from 'lucide-react';
import { CAREER_GOALS, type GoalId } from '../../data/skillPilotData';
import { authService } from '../../services/auth/authService';
import { useAppStore } from '../../store/useAppStore';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import { ThemeBackdropView } from '../three/LazyViews';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/skills', label: 'Skill Analysis' },
  { to: '/roadmap', label: 'Roadmap' },
  { to: '/evaluation', label: 'Evaluation' },
  { to: '/agents', label: 'Agent Activity' },
];

/**
 * Authenticated application shell with 3-zone top bar, goal selector, theme settings drawer, and logout action.
 */
export function AppShell() {
  const navigate = useNavigate();
  const session = useAppStore((s) => s.session) ?? authService.getSession();
  const goalId = useAppStore((s) => s.goalId);
  const setGoalId = useAppStore((s) => s.setGoalId);
  const loadDemoStudent = useAppStore((s) => s.loadDemoStudent);
  const addToast = useAppStore((s) => s.addToast);

  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login', { replace: true });
  };

  const handleLoadDemo = () => {
    loadDemoStudent();
    addToast('Loaded Demo Student (Alex Rivera): Python & SQL mastered, JS/React/Node.js gaps.', 'success');
  };

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: 'var(--sp-bg)', color: 'var(--sp-text)' }}>
      <ThemeBackdropView />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header
          className="border-b px-4 py-3 sm:px-8"
          style={{
            backgroundColor: 'var(--sp-surface-glass)',
            borderColor: 'var(--sp-border)',
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <NavLink
              to="/dashboard"
              className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
            >
              SkillPilot AI
            </NavLink>

            <nav aria-label="Primary navigation" className="flex flex-wrap items-center gap-5 text-sm font-medium">
              {NAV_LINKS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `py-2 whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                      isActive ? 'font-semibold' : 'border-transparent hover:opacity-90'
                    }`
                  }
                  style={({ isActive }) => ({
                    borderColor: isActive ? 'var(--sp-focus)' : 'transparent',
                    color: isActive ? 'var(--sp-text)' : 'var(--sp-text-muted)',
                  })}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowSettings((v) => !v)}
                aria-expanded={showSettings}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--sp-bg-secondary)',
                  borderColor: 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Themes &amp; 3D</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                style={{
                  backgroundColor: 'var(--sp-accent)',
                  color: 'var(--sp-accent-text)',
                }}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div
              className="mx-auto mt-3 max-w-7xl border-t pt-3"
              style={{ borderColor: 'var(--sp-border)' }}
            >
              <ThemeSwitcher showTableToggle />
            </div>
          )}
        </header>

        <div
          className="border-b px-4 py-2.5 sm:px-8"
          style={{
            backgroundColor: 'var(--sp-bg-secondary)',
            borderColor: 'var(--sp-border)',
          }}
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold">
                {session?.displayName ?? 'Learner'} · {session?.role ?? 'Student'}
              </span>
              <span aria-hidden="true" style={{ color: 'var(--sp-text-muted)' }}>·</span>
              <label htmlFor="career-goal-select" className="font-medium" style={{ color: 'var(--sp-text-muted)' }}>
                Target career:
              </label>
              <select
                id="career-goal-select"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value as GoalId)}
                className="min-h-[36px] rounded-lg border px-2.5 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--sp-surface)',
                  borderColor: 'var(--sp-border)',
                  color: 'var(--sp-text)',
                }}
              >
                {Object.values(CAREER_GOALS).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleLoadDemo}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1 font-semibold whitespace-nowrap cursor-pointer"
              style={{
                backgroundColor: 'var(--sp-surface)',
                borderColor: 'var(--sp-border)',
                color: 'var(--sp-text)',
              }}
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Load Demo Student</span>
            </button>
          </div>
        </div>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
