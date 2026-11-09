import type { WireColorDef, WireGaugeDef, WireRole, WireStandard } from './types';

// Philippine Electrical Code (PEC) Palette
export const PEC_COLORS: Record<WireRole, WireColorDef> = {
  line1: {
    name: 'Phase A / Line 1',
    role: 'line1',
    hex: '#111827', // Black
    description: 'PEC Phase A / Hot conductor (Black)'
  },
  line2: {
    name: 'Phase B / Line 2',
    role: 'line2',
    hex: '#dc2626', // Red
    description: 'PEC Phase B / 230V 2-wire Delta Line 2 (Red)'
  },
  line3: {
    name: 'Phase C / Line 3',
    role: 'line3',
    hex: '#2563eb', // Blue
    description: 'PEC Phase C / 3-Phase Hot conductor (Blue)'
  },
  neutral: {
    name: 'Neutral (PEC)',
    role: 'neutral',
    hex: '#e2e8f0', // White/Light Gray
    description: 'PEC Neutral conductor (White / Light Gray)'
  },
  earth: {
    name: 'Ground / PE (PEC)',
    role: 'earth',
    hex: '#16a34a', // Green
    stripeHex: '#eab308',
    description: 'PEC Ground / Protective Earth (Green or Green/Yellow)'
  },
  dc_pos: {
    name: 'DC Positive (+)',
    role: 'dc_pos',
    hex: '#ea580c', // Orange/Red
    description: 'DC Positive (+)'
  },
  dc_neg: {
    name: 'DC Negative (-)',
    role: 'dc_neg',
    hex: '#1e293b', // Dark Slate
    description: 'DC Negative (-)'
  },
  signal: {
    name: 'Control / Signal',
    role: 'signal',
    hex: '#9333ea', // Purple
    description: 'Auxiliary Control / Signal line'
  }
};

// IEC 60446 / European Palette
export const IEC_COLORS: Record<WireRole, WireColorDef> = {
  line1: {
    name: 'Line 1 (L1 / L)',
    role: 'line1',
    hex: '#78350f', // Brown / Burgundy
    description: 'IEC Line 1 (Brown)'
  },
  line2: {
    name: 'Line 2 (L2)',
    role: 'line2',
    hex: '#18181b', // Black
    description: 'IEC Line 2 (Black)'
  },
  line3: {
    name: 'Line 3 (L3)',
    role: 'line3',
    hex: '#64748b', // Grey
    description: 'IEC Line 3 (Grey)'
  },
  neutral: {
    name: 'Neutral (N)',
    role: 'neutral',
    hex: '#38bdf8', // Blue
    description: 'IEC Neutral (Blue)'
  },
  earth: {
    name: 'Earth (PE)',
    role: 'earth',
    hex: '#22c55e', // Green
    stripeHex: '#facc15', // Yellow stripe
    description: 'IEC Protective Earth (Green / Yellow)'
  },
  dc_pos: {
    name: 'DC Positive (+)',
    role: 'dc_pos',
    hex: '#dc2626', // Red
    description: 'DC Positive (+)'
  },
  dc_neg: {
    name: 'DC Negative (-)',
    role: 'dc_neg',
    hex: '#020617', // Black
    description: 'DC Negative (-)'
  },
  signal: {
    name: 'Control / Signal',
    role: 'signal',
    hex: '#a855f7', // Purple
    description: 'Auxiliary Control / Signal'
  }
};

export const WIRE_GAUGES: WireGaugeDef[] = [
  { metric: 1.5, awg: '14 AWG', maxAmps: 15, renderWidth: 2.5 },
  { metric: 2.5, awg: '12 AWG', maxAmps: 20, renderWidth: 3.5 },
  { metric: 4.0, awg: '10 AWG', maxAmps: 30, renderWidth: 4.5 },
  { metric: 6.0, awg: '8 AWG', maxAmps: 45, renderWidth: 5.5 },
  { metric: 10.0, awg: '6 AWG', maxAmps: 65, renderWidth: 7.0 },
  { metric: 16.0, awg: '4 AWG', maxAmps: 85, renderWidth: 8.5 },
  { metric: 25.0, awg: '2 AWG', maxAmps: 115, renderWidth: 10.0 }
];

export function getWireColor(role: WireRole, standard: WireStandard = 'PEC'): WireColorDef {
  const palette = standard === 'PEC' ? PEC_COLORS : IEC_COLORS;
  return palette[role] || palette.line1;
}

export function getGaugeDef(metricMm2: number): WireGaugeDef {
  return WIRE_GAUGES.find((g) => g.metric === metricMm2) || WIRE_GAUGES[1]; // default 2.5mm^2
}

/**
 * Returns true if the given wire color hex is black or very dark (e.g., PEC L1 Hot Black,
 * IEC L2 Black, or DC Negative), requiring a high-contrast outer casing and specular
 * highlight to remain clearly visible on dark canvas backgrounds.
 */
export function isDarkWireColor(hex: string): boolean {
  if (!hex) return false;
  const clean = hex.trim().replace('#', '');
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return Math.max(r, g, b) < 60 && (0.299 * r + 0.587 * g + 0.114 * b) < 45;
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) {
      return Math.max(r, g, b) < 60 && (0.299 * r + 0.587 * g + 0.114 * b) < 45;
    }
  }
  return ['#111827', '#0f172a', '#18181b', '#1e293b', '#020617', '#000000', 'black'].includes(
    hex.toLowerCase()
  );
}


