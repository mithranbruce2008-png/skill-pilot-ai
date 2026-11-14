import React, { useRef } from 'react';
import { Monitor, Eye, Sparkles } from 'lucide-react';
import type { QualityTier } from '../../theme/themeSchema';
import { THEME_LIST, type ThemeId } from '../../theme/themes';
import { useThemeStore } from '../../theme/useThemeStore';

interface ThemeSwitcherProps {
  compact?: boolean;
  showTableToggle?: boolean;
}

const QUALITY_OPTIONS: Array<{ value: QualityTier; label: string }> = [
  { value: 'full', label: 'Full' },
  { value: 'lite', label: 'Lite' },
  { value: 'off', label: 'Off' },
];

/**
 * Keyboard-accessible theme radiogroup and 3D / motion / contrast accessibility controls.
 */
export function ThemeSwitcher({ compact = false, showTableToggle = false }: ThemeSwitcherProps) {
  const themeId = useThemeStore((s) => s.themeId);
  const qualityTier = useThemeStore((s) => s.qualityTier);
  const reducedMotion = useThemeStore((s) => s.reducedMotion);
  const highContrast = useThemeStore((s) => s.highContrast);
  const viewAsTable = useThemeStore((s) => s.viewAsTable);
  const hasWebGL = useThemeStore((s) => s.hasWebGL);

  const setThemeId = useThemeStore((s) => s.setThemeId);
  const setQualityTier = useThemeStore((s) => s.setQualityTier);
  const setReducedMotion = useThemeStore((s) => s.setReducedMotion);
  const setHighContrast = useThemeStore((s) => s.setHighContrast);
  const setViewAsTable = useThemeStore((s) => s.setViewAsTable);

  const radioRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleRadioKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % THEME_LIST.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + THEME_LIST.length) % THEME_LIST.length;
    } else {
      return;
    }
    const nextTheme = THEME_LIST[nextIndex];
    setThemeId(nextTheme.id as ThemeId);
    radioRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div
        role="radiogroup"
        aria-label="Color and 3D environment theme"
        className="flex flex-wrap items-center gap-1.5 rounded-xl border p-1"
        style={{
          backgroundColor: 'var(--sp-surface-glass)',
          borderColor: 'var(--sp-border)',
        }}
      >
        {THEME_LIST.map((theme, idx) => {
          const selected = theme.id === themeId;
          return (
            <button
              key={theme.id}
              ref={(el) => {
                radioRefs.current[idx] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setThemeId(theme.id)}
              onKeyDown={(e) => handleRadioKeyDown(e, idx)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              style={{
                backgroundColor: selected ? 'var(--sp-accent)' : 'transparent',
                color: selected ? 'var(--sp-accent-text)' : 'var(--sp-text)',
              }}
            >
              <span
                aria-hidden="true"
                className="inline-block h-3.5 w-3.5 rounded-full border"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.bg} 45%, ${theme.colors.agents.profile} 100%)`,
                  borderColor: selected ? 'var(--sp-accent-text)' : 'var(--sp-border)',
                }}
              />
              <span>{compact ? theme.name.split(' ')[0] : theme.name}</span>
            </button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label="3D effects quality"
        className="inline-flex items-center gap-1 rounded-xl border p-1"
        style={{
          backgroundColor: 'var(--sp-surface-glass)',
          borderColor: 'var(--sp-border)',
        }}
      >
        <span
          className="inline-flex items-center gap-1.5 px-2.5 text-xs font-medium whitespace-nowrap"
          style={{ color: 'var(--sp-text-muted)' }}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          3D effects:
        </span>
        {QUALITY_OPTIONS.map((opt) => {
          const active = qualityTier === opt.value;
          const disabled = !hasWebGL && opt.value !== 'off';
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => setQualityTier(opt.value)}
              className="min-h-[44px] rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: active ? 'var(--sp-accent)' : 'transparent',
                color: active ? 'var(--sp-accent-text)' : 'var(--sp-text)',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-pressed={reducedMotion}
        onClick={() => setReducedMotion(!reducedMotion)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        style={{
          backgroundColor: reducedMotion ? 'var(--sp-accent)' : 'var(--sp-surface-glass)',
          borderColor: 'var(--sp-border)',
          color: reducedMotion ? 'var(--sp-accent-text)' : 'var(--sp-text)',
        }}
      >
        <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Reduce motion</span>
      </button>

      <button
        type="button"
        aria-pressed={highContrast}
        onClick={() => setHighContrast(!highContrast)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        style={{
          backgroundColor: highContrast ? 'var(--sp-accent)' : 'var(--sp-surface-glass)',
          borderColor: 'var(--sp-border)',
          color: highContrast ? 'var(--sp-accent-text)' : 'var(--sp-text)',
        }}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
        <span>High contrast</span>
      </button>

      {showTableToggle && (
        <button
          type="button"
          aria-pressed={viewAsTable}
          onClick={() => setViewAsTable(!viewAsTable)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
          style={{
            backgroundColor: viewAsTable ? 'var(--sp-accent)' : 'var(--sp-surface-glass)',
            borderColor: 'var(--sp-border)',
            color: viewAsTable ? 'var(--sp-accent-text)' : 'var(--sp-text)',
          }}
        >
          <span>View as table/list</span>
        </button>
      )}
    </div>
  );
}
