export const RADIUS_TOKENS = ["none", "sm", "md", "lg", "full"] as const;

export type RadiusToken = (typeof RADIUS_TOKENS)[number];

export const radiusClass: Record<RadiusToken, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};
