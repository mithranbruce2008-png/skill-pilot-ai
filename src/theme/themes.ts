export type ThemeId =
  | 'cosmos'
  | 'neon-cyber'
  | 'enchanted-forest'
  | 'deep-ocean'
  | 'clean-light';

export type ParticleType = 'stars' | 'grid-sparks' | 'fireflies' | 'bubbles' | 'none';

export interface AgentPalette {
  profile: string;
  diagnosis: string;
  planning: string;
  evaluator: string;
  tutor: string;
}

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceGlass: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  accentText: string;
  success: string;
  warning: string;
  danger: string;
  focus: string;
  agents: AgentPalette;
}

export interface ThemeThreeSettings {
  fogColor: string;
  fogDensity: number;
  ambientColor: string;
  keyLightColor: string;
  rimLightColor: string;
  coreColor: string;
  fresnelColor: string;
  nodeLearnedColor: string;
  nodeGapColor: string;
  nodeRequiredColor: string;
  nodeRevisionColor: string;
  linkColor: string;
  particleType: ParticleType;
  particleColor: string;
  bloomIntensity: number;
  gridFloor: boolean;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  supports3D: boolean;
  colors: ThemeColors;
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  three: ThemeThreeSettings;
  soundEnabled: boolean;
}

/**
 * Curated SkillPilot AI theme registry with WCAG 2.1 AA >= 4.5:1 contrast pairs.
 */
export const THEMES: Record<ThemeId, Theme> = {
  cosmos: {
    id: 'cosmos',
    name: 'Cosmos',
    description: 'Deep space gradient with starlight dust and indigo-violet core.',
    isDark: true,
    supports3D: true,
    colors: {
      bg: '#070B19',
      bgSecondary: '#0E152E',
      surface: '#111936',
      surfaceGlass: 'rgba(17, 25, 54, 0.88)',
      border: '#2B3A67',
      text: '#F1F5F9',
      textMuted: '#CBD5E1',
      accent: '#4F46E5',
      accentHover: '#4338CA',
      accentText: '#FFFFFF',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#F87171',
      focus: '#93C5FD',
      agents: {
        profile: '#38BDF8',
        diagnosis: '#A78BFA',
        planning: '#34D399',
        evaluator: '#FBBF24',
        tutor: '#F472B6',
      },
    },
    fonts: {
      display: "'Outfit', system-ui, sans-serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    three: {
      fogColor: '#070B19',
      fogDensity: 0.028,
      ambientColor: '#4338CA',
      keyLightColor: '#E0E7FF',
      rimLightColor: '#818CF8',
      coreColor: '#312E81',
      fresnelColor: '#818CF8',
      nodeLearnedColor: '#38BDF8',
      nodeGapColor: '#475569',
      nodeRequiredColor: '#FBBF24',
      nodeRevisionColor: '#F87171',
      linkColor: '#6366F1',
      particleType: 'stars',
      particleColor: '#C7D2FE',
      bloomIntensity: 0.85,
      gridFloor: false,
    },
    soundEnabled: false,
  },
  'neon-cyber': {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Obsidian grid floor with electric cyan and magenta bloom.',
    isDark: true,
    supports3D: true,
    colors: {
      bg: '#080912',
      bgSecondary: '#111326',
      surface: '#14172E',
      surfaceGlass: 'rgba(20, 23, 46, 0.90)',
      border: '#313663',
      text: '#F8FAFC',
      textMuted: '#CBD5E1',
      accent: '#0E7490',
      accentHover: '#155E75',
      accentText: '#FFFFFF',
      success: '#2DD4BF',
      warning: '#FACC15',
      danger: '#FB7185',
      focus: '#22D3EE',
      agents: {
        profile: '#22D3EE',
        diagnosis: '#E879F9',
        planning: '#4ADE80',
        evaluator: '#FACC15',
        tutor: '#FB7185',
      },
    },
    fonts: {
      display: "'Outfit', system-ui, sans-serif",
      body: "'DM Sans', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    three: {
      fogColor: '#080912',
      fogDensity: 0.03,
      ambientColor: '#164E63',
      keyLightColor: '#67E8F9',
      rimLightColor: '#F472B6',
      coreColor: '#164E63',
      fresnelColor: '#22D3EE',
      nodeLearnedColor: '#22D3EE',
      nodeGapColor: '#52525B',
      nodeRequiredColor: '#FACC15',
      nodeRevisionColor: '#FB7185',
      linkColor: '#E879F9',
      particleType: 'grid-sparks',
      particleColor: '#67E8F9',
      bloomIntensity: 1.25,
      gridFloor: true,
    },
    soundEnabled: false,
  },
  'enchanted-forest': {
    id: 'enchanted-forest',
    name: 'Enchanted Forest',
    description: 'Deep emerald canopy with warm gold fireflies and soft mist.',
    isDark: true,
    supports3D: true,
    colors: {
      bg: '#06150F',
      bgSecondary: '#0C2118',
      surface: '#10291F',
      surfaceGlass: 'rgba(16, 41, 31, 0.89)',
      border: '#255441',
      text: '#ECFDF5',
      textMuted: '#A7F3D0',
      accent: '#047857',
      accentHover: '#065F46',
      accentText: '#FFFFFF',
      success: '#34D399',
      warning: '#FBBF24',
      danger: '#FCA5A5',
      focus: '#FDE68A',
      agents: {
        profile: '#6EE7B7',
        diagnosis: '#FCD34D',
        planning: '#34D399',
        evaluator: '#FBBF24',
        tutor: '#FDA4AF',
      },
    },
    fonts: {
      display: "'Outfit', system-ui, sans-serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    three: {
      fogColor: '#06150F',
      fogDensity: 0.032,
      ambientColor: '#065F46',
      keyLightColor: '#FEF3C7',
      rimLightColor: '#34D399',
      coreColor: '#064E3B',
      fresnelColor: '#6EE7B7',
      nodeLearnedColor: '#34D399',
      nodeGapColor: '#3F5E52',
      nodeRequiredColor: '#FBBF24',
      nodeRevisionColor: '#FCA5A5',
      linkColor: '#10B981',
      particleType: 'fireflies',
      particleColor: '#FDE68A',
      bloomIntensity: 0.75,
      gridFloor: false,
    },
    soundEnabled: false,
  },
  'deep-ocean': {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    description: 'Abyssal blue-teal waters with rising bubbles and caustic light.',
    isDark: true,
    supports3D: true,
    colors: {
      bg: '#051320',
      bgSecondary: '#091E33',
      surface: '#0D2640',
      surfaceGlass: 'rgba(13, 38, 64, 0.89)',
      border: '#1E4B75',
      text: '#F0F9FF',
      textMuted: '#BAE6FD',
      accent: '#0369A1',
      accentHover: '#075985',
      accentText: '#FFFFFF',
      success: '#2DD4BF',
      warning: '#FBBF24',
      danger: '#FDA4AF',
      focus: '#7DD3FC',
      agents: {
        profile: '#38BDF8',
        diagnosis: '#93C5FD',
        planning: '#2DD4BF',
        evaluator: '#FBBF24',
        tutor: '#F9A8D4',
      },
    },
    fonts: {
      display: "'Outfit', system-ui, sans-serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    three: {
      fogColor: '#051320',
      fogDensity: 0.034,
      ambientColor: '#075985',
      keyLightColor: '#E0F2FE',
      rimLightColor: '#2DD4BF',
      coreColor: '#0C4A6E',
      fresnelColor: '#38BDF8',
      nodeLearnedColor: '#2DD4BF',
      nodeGapColor: '#3B5C7A',
      nodeRequiredColor: '#FBBF24',
      nodeRevisionColor: '#FDA4AF',
      linkColor: '#0EA5E9',
      particleType: 'bubbles',
      particleColor: '#BAE6FD',
      bloomIntensity: 0.7,
      gridFloor: false,
    },
    soundEnabled: false,
  },
  'clean-light': {
    id: 'clean-light',
    name: 'Clean Light',
    description: 'Minimal high-contrast light surface with static 2D visualizations.',
    isDark: false,
    supports3D: false,
    colors: {
      bg: '#F8FAFC',
      bgSecondary: '#F1F5F9',
      surface: '#FFFFFF',
      surfaceGlass: 'rgba(255, 255, 255, 0.96)',
      border: '#CBD5E1',
      text: '#0F172A',
      textMuted: '#475569',
      accent: '#4338CA',
      accentHover: '#3730A3',
      accentText: '#FFFFFF',
      success: '#047857',
      warning: '#B45309',
      danger: '#B91C1C',
      focus: '#1D4ED8',
      agents: {
        profile: '#0369A1',
        diagnosis: '#6D28D9',
        planning: '#047857',
        evaluator: '#B45309',
        tutor: '#BE185D',
      },
    },
    fonts: {
      display: "'Outfit', system-ui, sans-serif",
      body: "'Plus Jakarta Sans', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    three: {
      fogColor: '#F8FAFC',
      fogDensity: 0,
      ambientColor: '#E2E8F0',
      keyLightColor: '#FFFFFF',
      rimLightColor: '#4338CA',
      coreColor: '#4338CA',
      fresnelColor: '#6366F1',
      nodeLearnedColor: '#047857',
      nodeGapColor: '#94A3B8',
      nodeRequiredColor: '#B45309',
      nodeRevisionColor: '#B91C1C',
      linkColor: '#64748B',
      particleType: 'none',
      particleColor: '#94A3B8',
      bloomIntensity: 0,
      gridFloor: false,
    },
    soundEnabled: false,
  },
};

export const THEME_LIST: Theme[] = Object.values(THEMES);
