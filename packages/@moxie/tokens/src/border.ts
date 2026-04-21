import type { ColorToken } from "./color";

export const BORDER_TOKENS = ["none", "thin", "medium", "thick"] as const;

export type BorderToken = (typeof BORDER_TOKENS)[number];

export const borderClass: Record<BorderToken, string> = {
  none: "border-0",
  thin: "border",
  medium: "border-2",
  thick: "border-4",
};

export const borderColorClass: Record<ColorToken, string> = {
  primary: "border-primary",
  secondary: "border-secondary",
  accent: "border-accent",
  muted: "border-muted",
  background: "border-background",
  foreground: "border-foreground",
};
