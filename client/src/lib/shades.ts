// Maps purpleShade (0-7) to CSS class and color values
export const SHADE_COLORS = [
  "oklch(0.95 0.00 0)",
  "oklch(0.80 0.06 295)",
  "oklch(0.68 0.10 295)",
  "oklch(0.56 0.14 295)",
  "oklch(0.45 0.18 295)",
  "oklch(0.36 0.20 295)",
  "oklch(0.28 0.18 295)",
  "oklch(0.20 0.14 295)",
];

export function shadeClass(shade: number): string {
  return `shade-${Math.min(7, Math.max(0, shade))}`;
}

export function shadeColor(shade: number): string {
  return SHADE_COLORS[Math.min(7, Math.max(0, shade))];
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
