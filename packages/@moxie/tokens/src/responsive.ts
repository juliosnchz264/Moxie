export const BREAKPOINTS = ["base", "md", "lg"] as const;
export type Breakpoint = (typeof BREAKPOINTS)[number];

export type ResponsiveValue<T> = T | Partial<Record<Breakpoint, T>>;

export function isResponsiveObject<T>(
  v: unknown,
): v is Partial<Record<Breakpoint, T>> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function normalizeResponsive<T>(
  v: ResponsiveValue<T> | undefined,
): Partial<Record<Breakpoint, T>> {
  if (v === undefined) return {};
  if (isResponsiveObject<T>(v)) return v;
  return { base: v };
}

export function pickAtBreakpoint<T>(
  v: ResponsiveValue<T> | undefined,
  bp: Breakpoint,
): T | undefined {
  const obj = normalizeResponsive(v);
  if (bp === "lg") return obj.lg ?? obj.md ?? obj.base;
  if (bp === "md") return obj.md ?? obj.base;
  return obj.base;
}
