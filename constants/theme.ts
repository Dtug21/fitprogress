// ─── Sistema de diseño FitProgress ──────────────────────────────────────────
// Estética: negro neutro + acento lima/volt. Atlético, alto contraste, pro.

export const COLORS = {
  // Acento (lima/volt) — solo para acción principal, valores clave y estado activo
  primary: '#C6F24E',
  primaryDim: '#C6F24E1E',
  accent: '#C6F24E',
  accentText: '#0B0B0C', // texto sobre el acento

  // Semánticos — solo para estados, nunca decorativo
  success: '#54D27A',
  successDim: '#54D27A1E',
  warning: '#FBA94C',
  warningDim: '#FBA94C1E',
  danger: '#FF5A4D',
  dangerDim: '#FF5A4D1E',

  // Superficies — jerarquía por elevación neutra, no por color
  bg: '#0B0B0C',
  surface: '#161618',
  card: '#161618',
  cardElevated: '#1F1F22',

  // Bordes hairline — dan profundidad sin gritar
  border: '#FFFFFF12',
  borderStrong: '#FFFFFF24',

  // Texto — 3 niveles claros
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1A6',
  textMuted: '#6B6B70',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pill: 999,
};

export const FONT = {
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 30,
};

// Pesos — solo dos: regular y semibold. (Evita el look "pesado" de 700/800.)
export const WEIGHT = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
};

// Letter-spacing — micro-labels en mayúsculas usan wide/wider
export const TRACKING = {
  tight: -0.4,
  normal: 0,
  wide: 0.8,
  wider: 1.5,
};

// Helpers reutilizables de estilo de texto
export const TEXT = {
  // Micro-label en mayúsculas (encabezados de sección, labels de stats)
  overline: {
    fontSize: 11,
    fontWeight: WEIGHT.semibold,
    letterSpacing: TRACKING.wider,
    textTransform: 'uppercase' as const,
    color: COLORS.textMuted,
  },
  // Números (stats, pesos, reps) — alineación tabular
  numeric: {
    fontVariant: ['tabular-nums'] as const,
    fontWeight: WEIGHT.semibold,
    letterSpacing: TRACKING.tight,
  },
};
