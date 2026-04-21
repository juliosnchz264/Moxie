export const MAX_WIDTH_TOKENS = [
  "none",
  "sm",
  "md",
  "lg",
  "xl",
  "2xl",
  "prose",
  "full",
] as const;

export type MaxWidthToken = (typeof MAX_WIDTH_TOKENS)[number];

export const maxWidthClass: Record<MaxWidthToken, string> = {
  none: "max-w-none",
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  prose: "max-w-prose",
  full: "max-w-full",
};
