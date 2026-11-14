import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Compass, Bot } from 'lucide-react';
import { useThemeStore } from '../../theme/useThemeStore';

interface LoginHeroProps {
  passwordFocused: boolean;
  demoHighlight: boolean;
}

const FEATURE_CHIPS = [
  { id: 'analysis', label: 'Skill Analysis', Icon: Sparkles },
  { id: 'matching', label: 'Career Matching', Icon: Compass },
  { id: 'mentor', label: 'AI Mentor', Icon: Bot },
];

/**
 * Left-hand hero tagline, animated feature chips, and live 3D interaction indicators on /login.
 */
export function LoginHero({ passwordFocused, demoHighlight }: LoginHeroProps) {
  const reducedMotion = useThemeStore((s) => s.reducedMotion);

  return (
    <section aria-label="SkillPilot AI overview" className="flex flex-col justify-center space-y-6">
      <div
        className="rounded-2xl border p-6 shadow-lg"
        style={{
          backgroundColor: 'var(--sp-surface-glass)',
          borderColor: 'var(--sp-border)',
        }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--sp-text-muted)' }}
        >
          SkillPilot AI · Personalized Learning Platform
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl text-balance">
          Welcome back to SkillPilot AI
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'var(--sp-text-muted)' }}>
          Know your skills. Close your gaps. Reach your career.
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5" aria-label="Platform capabilities">
          {FEATURE_CHIPS.map(({ id, label, Icon }, idx) => (
            <motion.div
              key={id}
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.35, delay: idx * 0.08 }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold"
              style={{
                backgroundColor: 'var(--sp-bg-secondary)',
                borderColor: 'var(--sp-border)',
                color: 'var(--sp-text)',
              }}
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color: 'var(--sp-focus)' }} aria-hidden="true" />
              <span>{label}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--sp-text-muted)' }}>
          <span>Press <kbd className="rounded border px-1.5 py-0.5 font-mono" style={{ borderColor: 'var(--sp-border)' }}>D</kbd> outside inputs to highlight demo skills.</span>
          {passwordFocused && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-semibold"
              style={{
                backgroundColor: 'var(--sp-surface)',
                borderColor: 'var(--sp-warning)',
                color: 'var(--sp-warning)',
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Core security shield locked</span>
            </span>
          )}
          {demoHighlight && (
            <span
              role="status"
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-semibold"
              style={{
                backgroundColor: 'var(--sp-surface)',
                borderColor: 'var(--sp-warning)',
                color: 'var(--sp-warning)',
              }}
            >
              <span>Demo student skills: Python · SQL · HTML</span>
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
