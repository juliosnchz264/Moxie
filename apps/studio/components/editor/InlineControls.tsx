"use client";

import type { Block } from "@moxie/core";
import {
  SPACING_TOKENS,
  ALIGN_TOKENS,
  MAX_WIDTH_TOKENS,
  type SpacingToken,
  type AlignToken,
  type MaxWidthToken,
  type Breakpoint,
} from "@moxie/tokens";
import { useEditor } from "@/lib/store";
import { allowedTokens, tokenOptions } from "@/lib/block-constraints";
import { readBp, writeBp } from "@/lib/responsive-props";

export function InlineControls({ block }: { block: Block }) {
  const activeBp = useEditor((s) => s.activeBreakpoint);
  const updateProps = useEditor((s) => s.updateBlockProps);
  const ungroupBlock = useEditor((s) => s.ungroupBlock);

  const allowed = new Set<string>(allowedTokens(block.type));
  const props = (block.props ?? {}) as Record<string, unknown>;
  const isGroupContainer = block.type === "section" || block.type === "columns";

  const setKey = (key: string, nextValue: string) => {
    const next = { ...props };
    const updated = writeBp(next[key], activeBp, nextValue);
    if (updated === undefined || updated === "") delete next[key];
    else next[key] = updated;
    updateProps(block.id, next);
  };

  const showAlign = allowed.has("align");
  const showPaddingY = allowed.has("paddingY") || allowed.has("padding");
  const showMaxWidth = allowed.has("maxWidth");

  return (
    <>
      {showAlign ? (
        <AlignToolbar
          value={readBp(props.align, activeBp) as AlignToken | ""}
          options={tokenOptions(block.type, "align", ALIGN_TOKENS) as readonly AlignToken[]}
          onChange={(v) => setKey("align", v)}
        />
      ) : null}
      {showPaddingY ? (
        <PaddingHandles
          topValue={
            readBp(
              props.paddingY ?? props.padding,
              activeBp,
            ) as SpacingToken | ""
          }
          options={
            tokenOptions(
              block.type,
              allowed.has("paddingY") ? "paddingY" : "padding",
              SPACING_TOKENS,
            ) as readonly SpacingToken[]
          }
          activeBp={activeBp}
          onChange={(v) =>
            setKey(allowed.has("paddingY") ? "paddingY" : "padding", v)
          }
        />
      ) : null}
      {showMaxWidth ? (
        <WidthHandle
          value={readBp(props.maxWidth, activeBp) as MaxWidthToken | ""}
          options={
            tokenOptions(block.type, "maxWidth", MAX_WIDTH_TOKENS) as readonly MaxWidthToken[]
          }
          onChange={(v) => setKey("maxWidth", v)}
        />
      ) : null}
      {isGroupContainer ? (
        <div
          className="absolute -top-9 right-2 z-20"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            title="Ungroup (Cmd/Ctrl+Shift+G)"
            className="px-2 py-1 rounded bg-white border border-slate-200 text-[10px] text-slate-600 shadow-sm hover:bg-slate-50"
            onClick={() => ungroupBlock(block.id)}
          >
            ⤺ Ungroup
          </button>
        </div>
      ) : null}
    </>
  );
}

function AlignToolbar({
  value,
  options,
  onChange,
}: {
  value: AlignToken | "";
  options: readonly AlignToken[];
  onChange: (v: string) => void;
}) {
  const all: { key: AlignToken; glyph: string; label: string }[] = [
    { key: "left", glyph: "⇤", label: "Align left" },
    { key: "center", glyph: "↔", label: "Align center" },
    { key: "right", glyph: "⇥", label: "Align right" },
  ];
  const items = all.filter((a) => options.includes(a.key));
  if (items.length === 0) return null;
  return (
    <div
      className="absolute -top-9 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-white border border-slate-200 rounded-md shadow-sm px-0.5 py-0.5"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((it) => {
        const active = value === it.key;
        return (
          <button
            key={it.key}
            type="button"
            title={it.label}
            className={`h-6 w-6 rounded text-xs leading-none ${
              active
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
            onClick={() => onChange(active ? "" : it.key)}
          >
            {it.glyph}
          </button>
        );
      })}
    </div>
  );
}

function PaddingHandles({
  topValue,
  options,
  activeBp,
  onChange,
}: {
  topValue: SpacingToken | "";
  options: readonly SpacingToken[];
  activeBp: Breakpoint;
  onChange: (v: string) => void;
}) {
  const cycle = (dir: 1 | -1) => {
    const list = ["", ...options];
    const idx = list.indexOf(topValue);
    const nextIdx = (idx + dir + list.length) % list.length;
    onChange(list[nextIdx] ?? "");
  };
  const label = topValue === "" ? "—" : topValue;
  const hint = activeBp === "base" ? "mobile" : activeBp === "md" ? "tablet" : "desktop";

  return (
    <>
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-2 z-10 flex items-center gap-0.5"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 shadow-sm hover:bg-slate-50"
          onClick={() => cycle(1)}
          title={`Padding Y · ${hint} · click to cycle`}
        >
          ↕ {label}
        </button>
      </div>
    </>
  );
}

function WidthHandle({
  value,
  options,
  onChange,
}: {
  value: MaxWidthToken | "";
  options: readonly MaxWidthToken[];
  onChange: (v: string) => void;
}) {
  const cycle = () => {
    const list = ["", ...options];
    const idx = list.indexOf(value);
    const nextIdx = (idx + 1) % list.length;
    onChange(list[nextIdx] ?? "");
  };
  const label = value === "" ? "full" : value;
  return (
    <div
      className="absolute top-1/2 -right-2 -translate-y-1/2 z-10"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] text-slate-600 shadow-sm hover:bg-slate-50"
        onClick={cycle}
        title="Max width · click to cycle"
      >
        ↔ {label}
      </button>
    </div>
  );
}
