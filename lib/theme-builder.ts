// ==============================================
// Theme Builder - Custom Color Schemes
// Phase J: Supernova v1.16.0
// ==============================================

export interface CustomTheme {
  id: string;
  name: string;
  createdBy: string;
  isPublic: boolean;
  colors: ThemeColors;
  fonts: ThemeFonts;
  borderRadius: BorderRadiusConfig;
  animations: AnimationConfig;
  createdAt: Date;
  usageCount: number;
}

export interface ThemeColors {
  // Primary brand colors
  primary: string;
  primaryForeground: string;
  
  // Secondary accent
  secondary: string;
  secondaryForeground: string;
  
  // Background layers
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  
  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Muted/subtle
  muted: string;
  mutedForeground: string;
  
  // Borders & accents
  border: string;
  ring: string;
  accent: string;
  accentForeground: string;
}

export interface ThemeFonts {
  heading: FontConfig;
  body: FontConfig;
  mono: FontConfig;
}

export interface FontConfig {
  family: string;
  weight: number;
  letterSpacing: string;
}

export interface BorderRadiusConfig {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface AnimationConfig {
  speed: 'slow' | 'normal' | 'fast';
  reducedMotion: boolean;
  enableParticles: boolean;
}

// Pre-built theme presets
export const THEME_PRESETS: Record<string, Partial<CustomTheme>> = {
  fernhill: {
    name: 'Fernhill Forest',
    colors: {
      primary: '#2d5a27',
      primaryForeground: '#ffffff',
      secondary: '#8b7355',
      secondaryForeground: '#ffffff',
      background: '#faf9f6',
      foreground: '#1a1a1a',
      card: '#ffffff',
      cardForeground: '#1a1a1a',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      muted: '#f5f5f4',
      mutedForeground: '#737373',
      border: '#e5e5e5',
      ring: '#2d5a27',
      accent: '#d4a574',
      accentForeground: '#1a1a1a',
    },
  },
  midnight: {
    name: 'Midnight Dance',
    colors: {
      primary: '#8b5cf6',
      primaryForeground: '#ffffff',
      secondary: '#ec4899',
      secondaryForeground: '#ffffff',
      background: '#0f0f23',
      foreground: '#e5e5e5',
      card: '#1a1a2e',
      cardForeground: '#e5e5e5',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#06b6d4',
      muted: '#27273d',
      mutedForeground: '#a1a1aa',
      border: '#3f3f5c',
      ring: '#8b5cf6',
      accent: '#f472b6',
      accentForeground: '#ffffff',
    },
  },
  sunrise: {
    name: 'Sunrise Flow',
    colors: {
      primary: '#f97316',
      primaryForeground: '#ffffff',
      secondary: '#fbbf24',
      secondaryForeground: '#1a1a1a',
      background: '#fffbeb',
      foreground: '#1a1a1a',
      card: '#ffffff',
      cardForeground: '#1a1a1a',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      muted: '#fef3c7',
      mutedForeground: '#92400e',
      border: '#fcd34d',
      ring: '#f97316',
      accent: '#fb923c',
      accentForeground: '#ffffff',
    },
  },
  ocean: {
    name: 'Ocean Waves',
    colors: {
      primary: '#0ea5e9',
      primaryForeground: '#ffffff',
      secondary: '#06b6d4',
      secondaryForeground: '#ffffff',
      background: '#f0f9ff',
      foreground: '#0c4a6e',
      card: '#ffffff',
      cardForeground: '#0c4a6e',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#0ea5e9',
      muted: '#e0f2fe',
      mutedForeground: '#0369a1',
      border: '#7dd3fc',
      ring: '#0ea5e9',
      accent: '#38bdf8',
      accentForeground: '#0c4a6e',
    },
  },
  rose: {
    name: 'Rose Garden',
    colors: {
      primary: '#e11d48',
      primaryForeground: '#ffffff',
      secondary: '#be185d',
      secondaryForeground: '#ffffff',
      background: '#fff1f2',
      foreground: '#1a1a1a',
      card: '#ffffff',
      cardForeground: '#1a1a1a',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      muted: '#ffe4e6',
      mutedForeground: '#9f1239',
      border: '#fda4af',
      ring: '#e11d48',
      accent: '#fb7185',
      accentForeground: '#ffffff',
    },
  },
  amoled: {
    name: 'Pure Dark',
    colors: {
      primary: '#ffffff',
      primaryForeground: '#000000',
      secondary: '#a1a1aa',
      secondaryForeground: '#000000',
      background: '#000000',
      foreground: '#ffffff',
      card: '#0a0a0a',
      cardForeground: '#ffffff',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      muted: '#171717',
      mutedForeground: '#a1a1aa',
      border: '#262626',
      ring: '#ffffff',
      accent: '#525252',
      accentForeground: '#ffffff',
    },
  },
};

/**
 * Convert theme to CSS custom properties
 */
export function themeToCssVariables(theme: CustomTheme): Record<string, string> {
  const vars: Record<string, string> = {};
  
  // Color variables
  for (const [key, value] of Object.entries(theme.colors)) {
    const cssKey = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    vars[cssKey] = value;
    
    // Also add HSL versions for Tailwind
    const hsl = hexToHsl(value);
    vars[`${cssKey}-hsl`] = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
  }
  
  // Border radius
  for (const [key, value] of Object.entries(theme.borderRadius)) {
    vars[`--radius-${key}`] = value;
  }
  
  // Animation speed
  const speedMultipliers = { slow: 1.5, normal: 1, fast: 0.7 };
  vars['--animation-speed'] = `${speedMultipliers[theme.animations.speed]}`;
  
  return vars;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: CustomTheme): void {
  if (typeof document === 'undefined') return;
  
  const root = document.documentElement;
  const vars = themeToCssVariables(theme);
  
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  
  // Handle reduced motion
  if (theme.animations.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
}

/**
 * Generate a theme from a single color
 */
export function generateThemeFromColor(
  baseColor: string,
  mode: 'light' | 'dark' = 'light'
): ThemeColors {
  const hsl = hexToHsl(baseColor);
  
  if (mode === 'dark') {
    return {
      primary: baseColor,
      primaryForeground: '#ffffff',
      secondary: hslToHex({ h: (hsl.h + 30) % 360, s: hsl.s * 0.8, l: hsl.l }),
      secondaryForeground: '#ffffff',
      background: hslToHex({ h: hsl.h, s: 10, l: 8 }),
      foreground: '#e5e5e5',
      card: hslToHex({ h: hsl.h, s: 10, l: 12 }),
      cardForeground: '#e5e5e5',
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
      muted: hslToHex({ h: hsl.h, s: 10, l: 18 }),
      mutedForeground: '#a1a1aa',
      border: hslToHex({ h: hsl.h, s: 10, l: 25 }),
      ring: baseColor,
      accent: hslToHex({ h: (hsl.h + 180) % 360, s: hsl.s * 0.6, l: 50 }),
      accentForeground: '#ffffff',
    };
  }
  
  return {
    primary: baseColor,
    primaryForeground: '#ffffff',
    secondary: hslToHex({ h: (hsl.h + 30) % 360, s: hsl.s * 0.8, l: Math.min(hsl.l + 10, 90) }),
    secondaryForeground: '#1a1a1a',
    background: hslToHex({ h: hsl.h, s: 10, l: 98 }),
    foreground: '#1a1a1a',
    card: '#ffffff',
    cardForeground: '#1a1a1a',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    muted: hslToHex({ h: hsl.h, s: 10, l: 95 }),
    mutedForeground: '#737373',
    border: hslToHex({ h: hsl.h, s: 10, l: 90 }),
    ring: baseColor,
    accent: hslToHex({ h: (hsl.h + 180) % 360, s: hsl.s * 0.6, l: 60 }),
    accentForeground: '#1a1a1a',
  };
}

// Color utility functions
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex({ h, s, l }: { h: number; s: number; l: number }): string {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Check if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
  const { l } = hexToHsl(hex);
  return l > 50;
}

/**
 * Get contrasting text color
 */
export function getContrastColor(hex: string): string {
  return isLightColor(hex) ? '#1a1a1a' : '#ffffff';
}

/**
 * Default theme configuration
 */
export const DEFAULT_THEME: CustomTheme = {
  id: 'default',
  name: 'Fernhill Forest',
  createdBy: 'system',
  isPublic: true,
  colors: THEME_PRESETS.fernhill.colors!,
  fonts: {
    heading: { family: 'Inter', weight: 700, letterSpacing: '-0.02em' },
    body: { family: 'Inter', weight: 400, letterSpacing: '0' },
    mono: { family: 'JetBrains Mono', weight: 500, letterSpacing: '0' },
  },
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  animations: {
    speed: 'normal',
    reducedMotion: false,
    enableParticles: true,
  },
  createdAt: new Date(),
  usageCount: 0,
};
