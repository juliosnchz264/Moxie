import { isResponsiveObject, type Breakpoint } from "@moxie/tokens";

export function readBp(value: unknown, bp: Breakpoint): string {
  if (value === undefined || value === null) return "";
  if (isResponsiveObject<string>(value)) {
    const obj = value as Partial<Record<Breakpoint, string>>;
    return obj[bp] ?? "";
  }
  return bp === "base" ? String(value) : "";
}

export function writeBp(
  current: unknown,
  bp: Breakpoint,
  nextValue: string,
): unknown {
  const base: Partial<Record<Breakpoint, string>> = isResponsiveObject<string>(
    current,
  )
    ? { ...(current as Partial<Record<Breakpoint, string>>) }
    : current === undefined || current === null || current === ""
      ? {}
      : { base: String(current) };

  if (nextValue === "") delete base[bp];
  else base[bp] = nextValue;

  const keys = (Object.keys(base) as Breakpoint[]).filter(
    (k) => base[k] !== undefined && base[k] !== "",
  );
  if (keys.length === 0) return undefined;
  if (keys.length === 1 && keys[0] === "base") return base.base;
  return base;
}

export function hasValueAt(value: unknown, bp: Breakpoint): boolean {
  if (value === undefined || value === null) return false;
  if (isResponsiveObject<string>(value)) {
    const obj = value as Partial<Record<Breakpoint, string>>;
    return obj[bp] !== undefined && obj[bp] !== "";
  }
  return bp === "base";
}

/**
 * Resolve a responsive value at a breakpoint with fall-down: lg → md → base.
 * Returns "" when nothing is set at or below the target breakpoint.
 */
export function resolveBp(value: unknown, bp: Breakpoint): string {
  if (value === undefined || value === null) return "";
  if (!isResponsiveObject<string>(value)) {
    return typeof value === "string" ? value : "";
  }
  const obj = value as Partial<Record<Breakpoint, string>>;
  if (bp === "lg" && obj.lg) return obj.lg;
  if ((bp === "lg" || bp === "md") && obj.md) return obj.md;
  return obj.base ?? "";
}
