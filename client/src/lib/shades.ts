// Maps purpleShade (0-12) to CSS class and color values.
// Linear lightness from 0.95 (white) down to 0.20 (deepest); chroma curves up
// to a mid-darkness peak where OKLCH allows the most saturation at hue 295.
export const SHADE_COLORS = [
  "oklch(0.95 0.00 0)",
  "oklch(0.89 0.04 295)",
  "oklch(0.83 0.06 295)",
  "oklch(0.76 0.09 295)",
  "oklch(0.70 0.12 295)",
  "oklch(0.64 0.14 295)",
  "oklch(0.58 0.16 295)",
  "oklch(0.51 0.18 295)",
  "oklch(0.45 0.20 295)",
  "oklch(0.39 0.20 295)",
  "oklch(0.33 0.19 295)",
  "oklch(0.26 0.17 295)",
  "oklch(0.20 0.14 295)",
];

const MAX_SHADE = SHADE_COLORS.length - 1;

export function shadeClass(shade: number): string {
  return `shade-${Math.min(MAX_SHADE, Math.max(0, shade))}`;
}

export function shadeColor(shade: number): string {
  return SHADE_COLORS[Math.min(MAX_SHADE, Math.max(0, shade))];
}

// Generate a session ID and persist in sessionStorage.
export function getSessionId(): string {
  const key = "cc_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(key, id);
  }
  return id;
}
