import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/login/LoginForm';
import { LoginHero } from '../components/login/LoginHero';
import { ThemeSwitcher } from '../components/theme/ThemeSwitcher';
import { LoginGalaxyBackdrop } from '../components/three/LazyViews';
import { useAppStore } from '../store/useAppStore';
import type { QualityTier } from '../theme/themeSchema';
import { useThemeStore } from '../theme/useThemeStore';

/**
 * Full-screen 3D Skill Galaxy login page with accessible glass card, theme switcher, and warp transition.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addToast = useAppStore((s) => s.addToast);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const qualityTier = useThemeStore((s) => s.qualityTier);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [invalidTrigger, setInvalidTrigger] = useState(0);
  const [warpSuccess, setWarpSuccess] = useState(false);
  const [demoHighlight, setDemoHighlight] = useState(false);

  const destination =
    (location.state as { from?: string } | null)?.from || '/dashboard';

  useEffect(() => {
    document.title = 'Sign in — SkillPilot AI';
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target?.isContentEditable) {
        return;
      }
      if (e.key === 'd' || e.key === 'D') {
        setDemoHighlight((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    if (reducedMotion || qualityTier === 'off') {
      navigate(destination, { replace: true });
      return;
    }
    setWarpSuccess(true);
    window.setTimeout(() => {
      navigate(destination, { replace: true });
    }, 1150);
  }, [destination, navigate, qualityTier, reducedMotion]);

  const handleQualityDowngrade = useCallback(
    (nextTier: QualityTier, avgFps: number) => {
      addToast(
        `Switched 3D effects to ${nextTier === 'lite' ? 'Lite' : 'Off'} (${avgFps} fps detected).`,
        'info',
      );
    },
    [addToast],
  );

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-opacity duration-500 ${
        warpSuccess && !reducedMotion ? 'opacity-90' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'var(--sp-bg)', color: 'var(--sp-text)' }}
    >
      <a
        href="#login-form-card"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-sm focus:font-semibold"
        style={{ backgroundColor: 'var(--sp-accent)', color: 'var(--sp-accent-text)' }}
      >
        Skip to login form
      </a>

      <div className="fixed inset-0 z-0">
        <LoginGalaxyBackdrop
          emailFocused={emailFocused}
          passwordFocused={passwordFocused}
          invalidTrigger={invalidTrigger}
          warpSuccess={warpSuccess}
          demoHighlight={demoHighlight}
          onQualityDowngrade={handleQualityDowngrade}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
            SkillPilot AI
          </div>
          <ThemeSwitcher compact />
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-6 sm:px-8">
          <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-12">
            <div className="md:col-span-6 lg:col-span-7">
              <LoginHero
                passwordFocused={passwordFocused}
                demoHighlight={demoHighlight}
              />
            </div>
            <div className="flex justify-center md:col-span-6 md:justify-end lg:col-span-5">
              <LoginForm
                onEmailFocusChange={setEmailFocused}
                onPasswordFocusChange={setPasswordFocused}
                onInvalidAttempt={() => setInvalidTrigger((n) => n + 1)}
                onAuthSuccess={handleAuthSuccess}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
