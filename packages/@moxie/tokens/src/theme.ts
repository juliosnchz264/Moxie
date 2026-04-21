import type { ColorToken } from "./color";

export const THEME_PRESETS = ["light", "dark", "custom"] as const;
export type ThemePreset = (typeof THEME_PRESETS)[number];

export type ThemeColors = Partial<Record<ColorToken, string>>;

export interface ThemeFonts {
  sans?: string;
  heading?: string;
}

export interface Theme {
  preset: ThemePreset;
  colors?: ThemeColors;
  fonts?: ThemeFonts;
}

const lightColors: Required<ThemeColors> = {
  primary: "#2563eb",
  secondary: "#475569",
  accent: "#d946ef",
  muted: "#f1f5f9",
  background: "#ffffff",
  foreground: "#0f172a",
};

const darkColors: Required<ThemeColors> = {
  primary: "#60a5fa",
  secondary: "#94a3b8",
  accent: "#e879f9",
  muted: "#1e293b",
  background: "#0f172a",
  foreground: "#f8fafc",
};

export function presetColors(preset: ThemePreset): Required<ThemeColors> {
  if (preset === "dark") return darkColors;
  return lightColors;
}

export const defaultTheme: Theme = {
  preset: "light",
};

// Resolve a theme into a flat color map: preset defaults + user overrides.
export function resolveThemeColors(theme: Theme): Required<ThemeColors> {
  return { ...presetColors(theme.preset), ...(theme.colors ?? {}) };
}

// Produce the CSS declarations (without selector wrapper) that bind
// --color-* vars + font vars for a site's theme. Renderers wrap this
// in a <style> tag scoped to the page root (public site) or the canvas
// root (studio).
export function themeCssDeclarations(theme: Theme): string {
  const colors = resolveThemeColors(theme);
  const parts: string[] = [];
  for (const [key, value] of Object.entries(colors)) {
    parts.push(`--color-${key}: ${value};`);
  }
  if (theme.fonts?.sans) {
    parts.push(`--font-sans: ${cssFontStack(theme.fonts.sans)};`);
  }
  if (theme.fonts?.heading) {
    parts.push(`--font-heading: ${cssFontStack(theme.fonts.heading)};`);
  }
  return parts.join(" ");
}

function cssFontStack(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "";
  const quoted = /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
  return `${quoted}, system-ui, sans-serif`;
}

// Google Fonts URL for a list of family names; returns null when empty.
export function googleFontsHref(fonts: string[]): string | null {
  const families = Array.from(
    new Set(fonts.map((f) => f.trim()).filter(Boolean)),
  );
  if (families.length === 0) return null;
  const params = families
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
