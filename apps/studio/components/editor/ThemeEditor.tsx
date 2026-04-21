"use client";

import { useState } from "react";
import {
  COLOR_TOKENS,
  THEME_PRESETS,
  presetColors,
  resolveThemeColors,
  type ColorToken,
  type ThemePreset,
} from "@moxie/tokens";
import { useEditor } from "@/lib/store";
import { api } from "@/lib/api-client";

const COLOR_LABELS: Record<ColorToken, string> = {
  primary: "Primary",
  secondary: "Secondary",
  accent: "Accent",
  muted: "Muted",
  background: "Background",
  foreground: "Foreground",
};

const FONT_SUGGESTIONS = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Merriweather",
  "DM Sans",
  "Space Grotesk",
];

export function ThemeEditor() {
  const site = useEditor((s) => s.site);
  const theme = useEditor((s) => s.theme);
  const themeDirty = useEditor((s) => s.themeDirty);
  const themeSaveStatus = useEditor((s) => s.themeSaveStatus);
  const updateTheme = useEditor((s) => s.updateTheme);
  const setTheme = useEditor((s) => s.setTheme);
  const markThemeSaved = useEditor((s) => s.markThemeSaved);
  const setThemeSaveStatus = useEditor((s) => s.setThemeSaveStatus);
  const setSite = useEditor((s) => s.setSite);
  const [saving, setSaving] = useState(false);

  const resolved = resolveThemeColors(theme);

  const setPreset = (preset: ThemePreset) => {
    if (preset === "custom") {
      updateTheme({ preset });
    } else {
      setTheme({
        preset,
        colors: undefined,
        fonts: theme.fonts,
      });
    }
  };

  const setColor = (key: ColorToken, value: string) => {
    const baseline = presetColors(
      theme.preset === "custom" ? "light" : theme.preset,
    );
    const nextColors = { ...(theme.colors ?? {}), [key]: value };
    for (const k of COLOR_TOKENS) {
      if (nextColors[k] && nextColors[k] === baseline[k] && theme.preset !== "custom") {
        delete nextColors[k];
      }
    }
    updateTheme({
      preset: "custom",
      colors: Object.keys(nextColors).length ? nextColors : undefined,
    });
  };

  const setFont = (slot: "sans" | "heading", value: string) => {
    const trimmed = value.trim();
    const next = { ...(theme.fonts ?? {}) };
    if (trimmed) next[slot] = trimmed;
    else delete next[slot];
    updateTheme({ fonts: Object.keys(next).length ? next : undefined });
  };

  const onSave = async () => {
    if (!site) return;
    setSaving(true);
    setThemeSaveStatus("saving");
    try {
      const doc = await api.updateSite(site.id, { theme });
      setSite(doc);
      markThemeSaved();
    } catch (e) {
      setThemeSaveStatus("error", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 overflow-y-auto">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-sm font-semibold text-slate-900">Design System</h2>
        <p className="text-xs text-slate-500 mt-1">
          Global styles for this site. Blocks inherit from these tokens.
        </p>
      </div>

      <section className="p-4 border-b border-slate-200 space-y-2">
        <label className="text-xs font-medium text-slate-700">Preset</label>
        <div className="flex gap-1">
          {THEME_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPreset(p)}
              className={`flex-1 text-xs px-2 py-1.5 rounded border capitalize ${
                theme.preset === p
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section className="p-4 border-b border-slate-200 space-y-3">
        <h3 className="text-xs font-semibold text-slate-700">Colors</h3>
        {COLOR_TOKENS.map((key) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <label className="text-xs text-slate-600 flex-1">
              {COLOR_LABELS[key]}
            </label>
            <input
              type="color"
              value={resolved[key]}
              onChange={(e) => setColor(key, e.target.value)}
              className="w-9 h-7 rounded border border-slate-300 cursor-pointer"
              aria-label={`${COLOR_LABELS[key]} color`}
            />
            <input
              type="text"
              value={resolved[key]}
              onChange={(e) => setColor(key, e.target.value)}
              className="w-20 text-xs font-mono border border-slate-300 rounded px-1.5 py-1"
            />
          </div>
        ))}
      </section>

      <section className="p-4 border-b border-slate-200 space-y-3">
        <h3 className="text-xs font-semibold text-slate-700">Fonts</h3>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Body (sans)</label>
          <input
            list="moxie-font-list"
            type="text"
            placeholder="system-ui"
            value={theme.fonts?.sans ?? ""}
            onChange={(e) => setFont("sans", e.target.value)}
            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-600">Headings</label>
          <input
            list="moxie-font-list"
            type="text"
            placeholder="inherits body"
            value={theme.fonts?.heading ?? ""}
            onChange={(e) => setFont("heading", e.target.value)}
            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5"
          />
        </div>
        <datalist id="moxie-font-list">
          {FONT_SUGGESTIONS.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
        <p className="text-[10px] text-slate-400">
          Any Google Font family name. Leave blank for system default.
        </p>
      </section>

      <div className="p-4 sticky bottom-0 bg-white border-t border-slate-200">
        <button
          type="button"
          onClick={onSave}
          disabled={!themeDirty || saving || !site}
          className="w-full bg-blue-600 text-white text-sm px-3 py-2 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          {saving ? "Saving…" : themeDirty ? "Save theme" : "Saved"}
        </button>
        {themeSaveStatus === "error" ? (
          <p className="text-[10px] text-red-600 mt-1">Save failed.</p>
        ) : null}
      </div>
    </aside>
  );
}
