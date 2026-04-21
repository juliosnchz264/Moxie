"use client";

import { useState } from "react";
import { useEditor } from "@/lib/store";
import {
  SPACING_TOKENS,
  COLOR_TOKENS,
  RADIUS_TOKENS,
  FONT_SIZE_TOKENS,
  ALIGN_TOKENS,
  SHADOW_TOKENS,
  BORDER_TOKENS,
  MAX_WIDTH_TOKENS,
  BREAKPOINTS,
  type Breakpoint,
} from "@moxie/tokens";
import { MediaPicker } from "@/components/editor/MediaPicker";
import { resolveMediaUrl, type PayloadMediaDoc } from "@/lib/api-client";
import {
  allowedTokens,
  tokenOptions,
  warningFor,
} from "@/lib/block-constraints";
import { readBp, writeBp, hasValueAt } from "@/lib/responsive-props";

interface TokenField {
  key: string;
  label: string;
  options: readonly string[];
}

const layoutFields: readonly TokenField[] = [
  { key: "padding", label: "Padding", options: SPACING_TOKENS },
  { key: "paddingX", label: "Padding X", options: SPACING_TOKENS },
  { key: "paddingY", label: "Padding Y", options: SPACING_TOKENS },
  { key: "gap", label: "Gap", options: SPACING_TOKENS },
  { key: "align", label: "Align", options: ALIGN_TOKENS },
  { key: "maxWidth", label: "Max width", options: MAX_WIDTH_TOKENS },
];

const appearanceFields: readonly TokenField[] = [
  { key: "bg", label: "Background", options: COLOR_TOKENS },
  { key: "color", label: "Color", options: COLOR_TOKENS },
  { key: "fontSize", label: "Font size", options: FONT_SIZE_TOKENS },
  { key: "radius", label: "Radius", options: RADIUS_TOKENS },
  { key: "shadow", label: "Shadow", options: SHADOW_TOKENS },
  { key: "border", label: "Border", options: BORDER_TOKENS },
  { key: "borderColor", label: "Border color", options: COLOR_TOKENS },
];

const bpLabel: Record<Breakpoint, string> = {
  base: "Mobile",
  md: "Tablet",
  lg: "Desktop",
};

export function PropsPanel() {
  const page = useEditor((s) => s.page);
  const mode = useEditor((s) => s.mode);
  const selectedId = useEditor((s) => s.selectedId);
  const updateProps = useEditor((s) => s.updateBlockProps);
  const updatePageMeta = useEditor((s) => s.updatePageMeta);
  const activeBp = useEditor((s) => s.activeBreakpoint);

  if (!page) {
    return (
      <aside className="w-72 border-l bg-white p-4 text-sm text-slate-500">
        Loading…
      </aside>
    );
  }

  if (!selectedId) {
    if (mode !== "page") {
      return (
        <aside className="w-72 border-l bg-white p-4 text-sm text-slate-500">
          Select a block to edit its props
        </aside>
      );
    }
    return (
      <aside className="w-72 border-l bg-white p-4 flex flex-col gap-3 text-sm overflow-y-auto">
        <header>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Page Settings
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Used for SEO and social sharing.
          </div>
        </header>
        <TextField
          label="Title"
          value={page.title}
          onChange={(v) => updatePageMeta({ title: v })}
        />
        <TextField
          label="Description"
          value={page.description ?? ""}
          onChange={(v) => updatePageMeta({ description: v })}
          multiline
        />
        <TextField
          label="Social image URL"
          value={page.metaImage ?? ""}
          onChange={(v) => updatePageMeta({ metaImage: v })}
        />
        <div className="text-[11px] text-slate-400">
          Tip: select a block to edit its content and tokens.
        </div>
      </aside>
    );
  }

  const block = page.blocks.find((b) => b.id === selectedId);
  if (!block) {
    return (
      <aside className="w-72 border-l bg-white p-4 text-sm">
        Block not found
      </aside>
    );
  }

  const props = (block.props ?? {}) as Record<string, unknown>;

  const set = (key: string, value: unknown) => {
    const next = { ...props };
    if (value === "" || value === undefined || value === null) delete next[key];
    else next[key] = value;
    updateProps(block.id, next);
  };

  const setResponsive = (key: string, nextValue: string) => {
    const updated = writeBp(props[key], activeBp, nextValue);
    set(key, updated);
  };

  return (
    <aside className="w-72 border-l bg-white p-4 flex flex-col gap-3 text-sm overflow-y-auto">
      <header className="flex items-baseline justify-between">
        <div className="font-semibold capitalize">{block.type}</div>
        <div className="text-[10px] text-slate-400 tracking-wider">
          v{block.version}
        </div>
      </header>

      {block.type === "hero" ? (
        <>
          <TextField
            label="Title"
            value={(props.title as string) ?? ""}
            onChange={(v) => set("title", v)}
          />
          <TextField
            label="Subtitle"
            value={(props.subtitle as string) ?? ""}
            onChange={(v) => set("subtitle", v)}
          />
        </>
      ) : null}

      {block.type === "text" ? (
        <TextField
          label="Body"
          value={(props.body as string) ?? ""}
          onChange={(v) => set("body", v)}
          multiline
        />
      ) : null}

      {block.type === "section" ? (
        <TextField
          label="Label"
          value={(props.label as string) ?? ""}
          onChange={(v) => set("label", v)}
        />
      ) : null}

      {block.type === "columns" ? (
        <NonResponsiveSelect
          label="Columns"
          value={String(props.count ?? 2)}
          options={["2", "3", "4"]}
          onChange={(v) => set("count", v ? Number(v) : "")}
        />
      ) : null}

      {block.type === "image" ? (
        <>
          <MediaField
            label="Image"
            src={(props.src as string) ?? ""}
            onPick={(doc) => {
              const next = { ...props };
              next.src = resolveMediaUrl(doc.url);
              next.alt = doc.alt ?? next.alt ?? "";
              updateProps(block.id, next);
            }}
            onClear={() => set("src", "")}
          />
          <TextField
            label="Image URL"
            value={(props.src as string) ?? ""}
            onChange={(v) => set("src", v)}
          />
          <TextField
            label="Alt text"
            value={(props.alt as string) ?? ""}
            onChange={(v) => set("alt", v)}
          />
          <TextField
            label="Caption"
            value={(props.caption as string) ?? ""}
            onChange={(v) => set("caption", v)}
          />
          <NonResponsiveSelect
            label="Fit"
            value={(props.fit as string) ?? "cover"}
            options={["cover", "contain", "fill"]}
            onChange={(v) => set("fit", v)}
          />
        </>
      ) : null}

      {block.type === "button" ? (
        <>
          <TextField
            label="Label"
            value={(props.label as string) ?? ""}
            onChange={(v) => set("label", v)}
          />
          <TextField
            label="Link"
            value={(props.href as string) ?? ""}
            onChange={(v) => set("href", v)}
          />
          <NonResponsiveSelect
            label="Variant"
            value={(props.variant as string) ?? "primary"}
            options={["primary", "secondary", "ghost"]}
            onChange={(v) => set("variant", v)}
          />
          <NonResponsiveSelect
            label="Target"
            value={(props.target as string) ?? "_self"}
            options={["_self", "_blank"]}
            onChange={(v) => set("target", v)}
          />
        </>
      ) : null}

      {block.type === "spacer" ? (
        <NonResponsiveSelect
          label="Size"
          value={(props.size as string) ?? "md"}
          options={["xs", "sm", "md", "lg", "xl", "2xl"]}
          onChange={(v) => set("size", v)}
        />
      ) : null}

      {block.type === "divider" ? (
        <>
          <NonResponsiveSelect
            label="Style"
            value={(props.style as string) ?? "solid"}
            options={["solid", "dashed", "dotted"]}
            onChange={(v) => set("style", v)}
          />
          <NonResponsiveSelect
            label="Thickness"
            value={(props.thickness as string) ?? "thin"}
            options={["thin", "medium", "thick"]}
            onChange={(v) => set("thickness", v)}
          />
        </>
      ) : null}

      {block.type === "card" ? (
        <TextField
          label="Title"
          value={(props.title as string) ?? ""}
          onChange={(v) => set("title", v)}
        />
      ) : null}

      {block.type === "cta" ? (
        <>
          <TextField
            label="Title"
            value={(props.title as string) ?? ""}
            onChange={(v) => set("title", v)}
          />
          <TextField
            label="Subtitle"
            value={(props.subtitle as string) ?? ""}
            onChange={(v) => set("subtitle", v)}
          />
          <TextField
            label="CTA label"
            value={(props.ctaLabel as string) ?? ""}
            onChange={(v) => set("ctaLabel", v)}
          />
          <TextField
            label="CTA link"
            value={(props.ctaHref as string) ?? ""}
            onChange={(v) => set("ctaHref", v)}
          />
        </>
      ) : null}

      {block.type === "gallery" ? (
        <>
          <NonResponsiveSelect
            label="Columns"
            value={String(props.columns ?? 3)}
            options={["2", "3", "4"]}
            onChange={(v) => set("columns", v ? Number(v) : "")}
          />
          <GalleryItemsEditor
            items={(props.items as { src: string; alt?: string }[]) ?? []}
            onChange={(items) => set("items", items)}
          />
        </>
      ) : null}

      <TokenGroups
        block={block}
        props={props}
        activeBp={activeBp}
        setResponsive={setResponsive}
        warning={warningFor(block, page.blocks)}
      />
    </aside>
  );
}

function TokenGroups({
  block,
  props,
  activeBp,
  setResponsive,
  warning,
}: {
  block: { type: string; id: string };
  props: Record<string, unknown>;
  activeBp: Breakpoint;
  setResponsive: (key: string, v: string) => void;
  warning: { level: "warn"; message: string } | null;
}) {
  const allowed = allowedTokens(block.type);
  const allowedSet = new Set<string>(allowed);
  const layout = layoutFields.filter((f) => allowedSet.has(f.key));
  const appearance = appearanceFields.filter((f) => allowedSet.has(f.key));
  const hasAppearanceValue = appearance.some((f) => props[f.key] !== undefined);
  const [showAppearance, setShowAppearance] = useState<boolean>(hasAppearanceValue);

  if (layout.length === 0 && appearance.length === 0) {
    return warning ? <WarningBox message={warning.message} /> : null;
  }

  return (
    <>
      <hr className="border-slate-200" />
      {warning ? <WarningBox message={warning.message} /> : null}
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Design
        </div>
        <div
          className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
          title="Editing values for the current device breakpoint"
        >
          {bpLabel[activeBp]}
        </div>
      </div>

      {layout.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">
            Layout
          </div>
          {layout.map((f) => (
            <ResponsiveSelect
              key={f.key}
              label={f.label}
              raw={props[f.key]}
              activeBp={activeBp}
              options={tokenOptions(block.type, f.key as never, f.options)}
              onChange={(v) => setResponsive(f.key, v)}
            />
          ))}
        </div>
      ) : null}

      {appearance.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setShowAppearance((v) => !v)}
            className="flex items-center justify-between text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-600"
          >
            <span>Appearance</span>
            <span className="text-[10px]">{showAppearance ? "−" : "+"}</span>
          </button>
          {showAppearance
            ? appearance.map((f) => (
                <ResponsiveSelect
                  key={f.key}
                  label={f.label}
                  raw={props[f.key]}
                  activeBp={activeBp}
                  options={tokenOptions(block.type, f.key as never, f.options)}
                  onChange={(v) => setResponsive(f.key, v)}
                />
              ))
            : null}
        </div>
      ) : null}
    </>
  );
}

function WarningBox({ message }: { message: string }) {
  return (
    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 flex gap-1.5">
      <span aria-hidden>⚠</span>
      <span>{message}</span>
    </div>
  );
}

function ResponsiveSelect({
  label,
  raw,
  activeBp,
  options,
  onChange,
}: {
  label: string;
  raw: unknown;
  activeBp: Breakpoint;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const value = readBp(raw, activeBp);
  return (
    <label className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="flex items-center gap-0.5">
          {BREAKPOINTS.map((bp) => (
            <span
              key={bp}
              title={`${bpLabel[bp]}${hasValueAt(raw, bp) ? " · set" : ""}`}
              className={`h-1.5 w-1.5 rounded-full ${
                hasValueAt(raw, bp)
                  ? bp === activeBp
                    ? "bg-blue-500 ring-1 ring-blue-300"
                    : "bg-slate-400"
                  : bp === activeBp
                    ? "ring-1 ring-blue-400 bg-transparent"
                    : "bg-slate-200"
              }`}
            />
          ))}
        </span>
      </div>
      <select
        className="border rounded px-2 py-1 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— inherit</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-600">{label}</span>
      {multiline ? (
        <textarea
          className="border rounded px-2 py-1 min-h-[80px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="border rounded px-2 py-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function MediaField({
  label,
  src,
  onPick,
  onClear,
}: {
  label: string;
  src: string;
  onPick: (doc: PayloadMediaDoc) => void;
  onClear: () => void;
}) {
  const siteId = useEditor((s) => s.page?.siteId ?? null);
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-600">{label}</span>
      {src ? (
        <div className="relative rounded border border-slate-200 overflow-hidden">
          <img src={src} alt="" className="w-full aspect-video object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-black/40">
            <button
              type="button"
              className="text-[11px] px-2 py-0.5 rounded bg-white text-slate-900 hover:bg-slate-100"
              onClick={() => setOpen(true)}
              disabled={!siteId}
            >
              Replace
            </button>
            <button
              type="button"
              className="text-[11px] px-2 py-0.5 rounded bg-white/80 text-red-600 hover:bg-white"
              onClick={onClear}
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="text-xs border border-dashed rounded px-2 py-3 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setOpen(true)}
          disabled={!siteId}
        >
          Browse library…
        </button>
      )}
      {open && siteId ? (
        <MediaPicker
          siteId={siteId}
          onSelect={(doc) => {
            onPick(doc);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function GalleryItemsEditor({
  items,
  onChange,
}: {
  items: { src: string; alt?: string }[];
  onChange: (next: { src: string; alt?: string }[]) => void;
}) {
  const siteId = useEditor((s) => s.page?.siteId ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const update = (i: number, patch: Partial<{ src: string; alt: string }>) => {
    const next = items.map((it, idx) => (idx === i ? { ...it, ...patch } : it));
    onChange(next);
  };
  const addBlank = () => onChange([...items, { src: "", alt: "" }]);
  const addFromMedia = (doc: PayloadMediaDoc) => {
    onChange([
      ...items,
      { src: resolveMediaUrl(doc.url), alt: doc.alt ?? "" },
    ]);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j]!, next[i]!];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs text-slate-600">Images</div>
      {items.length === 0 ? (
        <div className="text-xs text-slate-400 italic">No images yet</div>
      ) : null}
      {items.map((it, i) => (
        <div key={i} className="border rounded p-2 flex flex-col gap-1">
          {it.src ? (
            <img
              src={it.src}
              alt=""
              className="w-full aspect-video object-cover rounded"
            />
          ) : null}
          <input
            className="border rounded px-2 py-1 text-xs"
            placeholder="Image URL"
            value={it.src}
            onChange={(e) => update(i, { src: e.target.value })}
          />
          <input
            className="border rounded px-2 py-1 text-xs"
            placeholder="Alt text"
            value={it.alt ?? ""}
            onChange={(e) => update(i, { alt: e.target.value })}
          />
          <div className="flex gap-1 text-xs">
            <button
              type="button"
              className="px-1.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
              onClick={() => move(i, -1)}
              disabled={i === 0}
            >
              ↑
            </button>
            <button
              type="button"
              className="px-1.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40"
              onClick={() => move(i, 1)}
              disabled={i === items.length - 1}
            >
              ↓
            </button>
            <button
              type="button"
              className="ml-auto px-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100"
              onClick={() => remove(i)}
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="flex gap-1">
        <button
          type="button"
          className="flex-1 text-xs border rounded px-2 py-1 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => setPickerOpen(true)}
          disabled={!siteId}
        >
          + From library
        </button>
        <button
          type="button"
          className="text-xs border rounded px-2 py-1 hover:bg-slate-50"
          onClick={addBlank}
          title="Add blank item for manual URL entry"
        >
          + URL
        </button>
      </div>
      {pickerOpen && siteId ? (
        <MediaPicker
          siteId={siteId}
          onSelect={(doc) => {
            addFromMedia(doc);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}

function NonResponsiveSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-slate-600">{label}</span>
      <select
        className="border rounded px-2 py-1 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
