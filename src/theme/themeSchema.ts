import { z } from 'zod';

export const ThemeIdSchema = z.enum([
  'cosmos',
  'neon-cyber',
  'enchanted-forest',
  'deep-ocean',
  'clean-light',
]);

export const QualityTierSchema = z.enum(['full', 'lite', 'off']);

export const PersistedVisualSettingsSchema = z.object({
  themeId: ThemeIdSchema,
  qualityTier: QualityTierSchema,
  reducedMotion: z.boolean(),
  highContrast: z.boolean(),
  viewAsTable: z.boolean(),
});

export type QualityTier = z.infer<typeof QualityTierSchema>;
export type PersistedVisualSettings = z.infer<typeof PersistedVisualSettingsSchema>;

/**
 * Parses stored visual settings JSON safely, returning null when missing or corrupted.
 */
export function parseStoredVisualSettings(raw: string | null): PersistedVisualSettings | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = PersistedVisualSettingsSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

/**
 * Validates a standalone theme ID string, returning fallback if invalid.
 */
export function parseThemeId(value: unknown, fallback: z.infer<typeof ThemeIdSchema> = 'cosmos'): z.infer<typeof ThemeIdSchema> {
  const result = ThemeIdSchema.safeParse(value);
  return result.success ? result.data : fallback;
}
