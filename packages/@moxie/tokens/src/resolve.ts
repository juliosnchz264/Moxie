import type { TokenProps } from "./props";
import { paddingClass, paddingXClass, paddingYClass, gapClass } from "./spacing";
import { bgClass, textClass } from "./color";
import { radiusClass } from "./radius";
import { fontSizeClass, alignClass } from "./typography";
import { shadowClass } from "./shadow";
import { borderClass, borderColorClass } from "./border";
import { maxWidthClass } from "./width";
import {
  BREAKPOINTS,
  normalizeResponsive,
  pickAtBreakpoint,
  type Breakpoint,
  type ResponsiveValue,
} from "./responsive";

export interface ResolveOptions {
  activeBp?: Breakpoint;
}

function expandField<T extends string>(
  value: ResponsiveValue<T> | undefined,
  map: Record<T, string>,
  opts: ResolveOptions,
): string[] {
  if (value === undefined) return [];
  if (opts.activeBp !== undefined) {
    const picked = pickAtBreakpoint(value, opts.activeBp);
    if (picked === undefined) return [];
    const cls = map[picked];
    return cls ? [cls] : [];
  }
  const obj = normalizeResponsive(value);
  const out: string[] = [];
  for (const bp of BREAKPOINTS) {
    const tok = obj[bp];
    if (tok === undefined) continue;
    const cls = map[tok];
    if (!cls) continue;
    out.push(bp === "base" ? cls : `${bp}:${cls}`);
  }
  return out;
}

export function resolveTokens(
  props: TokenProps,
  opts: ResolveOptions = {},
): string {
  const out: string[] = [];
  out.push(...expandField(props.padding, paddingClass, opts));
  out.push(...expandField(props.paddingX, paddingXClass, opts));
  out.push(...expandField(props.paddingY, paddingYClass, opts));
  out.push(...expandField(props.gap, gapClass, opts));
  out.push(...expandField(props.bg, bgClass, opts));
  out.push(...expandField(props.color, textClass, opts));
  out.push(...expandField(props.radius, radiusClass, opts));
  out.push(...expandField(props.fontSize, fontSizeClass, opts));
  out.push(...expandField(props.align, alignClass, opts));
  out.push(...expandField(props.shadow, shadowClass, opts));
  out.push(...expandField(props.border, borderClass, opts));
  out.push(...expandField(props.borderColor, borderColorClass, opts));
  out.push(...expandField(props.maxWidth, maxWidthClass, opts));
  return out.join(" ");
}
