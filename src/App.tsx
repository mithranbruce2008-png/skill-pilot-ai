import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth } from './components/auth/RequireAuth';
import { AppShell } from './components/layout/AppShell';
import { ToastStack } from './components/ui/ToastStack';
import { authService } from './services/auth/authService';
import { useThemeStore } from './theme/useThemeStore';
import { THEMES } from './theme/themes';
import { applyThemeToDocument } from './theme/useThemeStore';

const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const SkillAnalysisPage = React.lazy(() => import('./pages/SkillAnalysisPage'));
const RoadmapPage = React.lazy(() => import('./pages/RoadmapPage'));
const EvaluationPage = React.lazy(() => import('./pages/EvaluationPage'));
const AgentActivityPage = React.lazy(() => import('./pages/AgentActivityPage'));

function RouteLoadingFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center p-6 text-sm"
      style={{ backgroundColor: 'var(--sp-bg)', color: 'var(--sp-text-muted)' }}
    >
      Loading SkillPilot AI...
    </div>
  );
}

/**
 * Root SkillPilot AI application router, theme initializer, and auth guard wiring.
 */
export function AppRoutes() {
  const themeId = useThemeStore((s) => s.themeId);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const highContrast = useThemeStore((s) => s.highContrast);

  useEffect(() => {
    authService.getSession();
  }, []);

  useEffect(() => {
    applyThemeToDocument(THEMES[themeId], reducedMotion, highContrast);
  }, [themeId, reducedMotion, highContrast]);

  return (
    <>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <RequireAuth>
                <AppShell />
              </RequireAuth>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/skills" element={<SkillAnalysisPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
            <Route path="/evaluation" element={<EvaluationPage />} />
            <Route path="/agents" element={<AgentActivityPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <ToastStack />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
