export const COLOR_TOKENS = [
  "primary",
  "secondary",
  "accent",
  "muted",
  "background",
  "foreground",
] as const;

export type ColorToken = (typeof COLOR_TOKENS)[number];

// These classes map to CSS-var-backed Tailwind v4 colors registered via
// `@theme` in each app's global stylesheet (e.g. --color-primary).
// Per-site theming overrides those vars at render time with inline
// <style> declarations — see apps/web/src/pages/[...slug].astro and
// apps/studio/components/editor/Canvas.tsx.
export const bgClass: Record<ColorToken, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  accent: "bg-accent",
  muted: "bg-muted",
  background: "bg-background",
  foreground: "bg-foreground",
};

export const textClass: Record<ColorToken, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  muted: "text-muted",
  background: "text-background",
  foreground: "text-foreground",
};
