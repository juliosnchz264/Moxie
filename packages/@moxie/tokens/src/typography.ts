export const FONT_SIZE_TOKENS = [
  "xs",
  "sm",
  "base",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
] as const;

export type FontSizeToken = (typeof FONT_SIZE_TOKENS)[number];

export const fontSizeClass: Record<FontSizeToken, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

export const ALIGN_TOKENS = ["left", "center", "right"] as const;

export type AlignToken = (typeof ALIGN_TOKENS)[number];

export const alignClass: Record<AlignToken, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};
