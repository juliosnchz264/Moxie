export const SPACING_TOKENS = [
  "none",
  "xs",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
] as const;

export type SpacingToken = (typeof SPACING_TOKENS)[number];

export const paddingClass: Record<SpacingToken, string> = {
  none: "p-0",
  xs: "p-1",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
  "2xl": "p-12",
};

export const paddingXClass: Record<SpacingToken, string> = {
  none: "px-0",
  xs: "px-1",
  sm: "px-2",
  md: "px-4",
  lg: "px-6",
  xl: "px-8",
  "2xl": "px-12",
};

export const paddingYClass: Record<SpacingToken, string> = {
  none: "py-0",
  xs: "py-1",
  sm: "py-2",
  md: "py-4",
  lg: "py-6",
  xl: "py-8",
  "2xl": "py-12",
};

export const gapClass: Record<SpacingToken, string> = {
  none: "gap-0",
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
};
