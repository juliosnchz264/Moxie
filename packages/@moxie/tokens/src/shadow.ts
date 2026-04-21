export const SHADOW_TOKENS = ["none", "sm", "md", "lg", "xl"] as const;

export type ShadowToken = (typeof SHADOW_TOKENS)[number];

export const shadowClass: Record<ShadowToken, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};
