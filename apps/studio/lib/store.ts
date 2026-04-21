"use client";

import { create } from "zustand";
import type { Block, Page } from "@moxie/core";
import type { Theme } from "@moxie/tokens";
import { defaultTheme } from "@moxie/tokens";
import type { PayloadSiteDoc } from "./api-client";
import { applyAutoLayout, reconcileUserEdit } from "./layout-context";
import { uid } from "./templates";

const HISTORY_LIMIT = 100;

type SaveStatus = "idle" | "saving" | "saved" | "error";

export type Device = "desktop" | "tablet" | "mobile";

export type EditorMode = "page" | "header" | "footer";

export type GroupContainer = "section" | "columns";

interface EditorState {
  mode: EditorMode;
  page: Page | null;
  selectedId: string | null;
  selectedIds: string[];
  editingId: string | null;
  dirty: boolean;
  past: Page[];
  future: Page[];
  saveStatus: SaveStatus;
  saveError: string | null;
  lastSavedAt: number | null;
  device: Device;
  activeBreakpoint: "base" | "md" | "lg";
  site: PayloadSiteDoc | null;
  theme: Theme;
  themeDirty: boolean;
  themeSaveStatus: SaveStatus;
  themeSaveError: string | null;
  setDevice: (device: Device) => void;
  setSite: (site: PayloadSiteDoc) => void;
  updateTheme: (patch: Partial<Theme>) => void;
  setTheme: (theme: Theme) => void;
  markThemeSaved: () => void;
  setThemeSaveStatus: (status: SaveStatus, error?: string | null) => void;
  setPage: (page: Page, mode?: EditorMode) => void;
  updatePageMeta: (patch: Partial<Pick<Page, "title" | "description" | "metaImage">>) => void;
  applyPagePatch: (patch: Partial<Page>) => void;
  selectBlock: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  groupSelectedAs: (type: GroupContainer) => void;
  ungroupBlock: (id: string) => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
  updateBlockProps: (id: string, props: unknown) => void;
  addBlock: (block: Block) => void;
  insertBlock: (block: Block, index: number) => void;
  applyPageTemplate: (blocks: Block[]) => void;
  moveBlock: (id: string, toIndex: number) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setSaveStatus: (status: SaveStatus, error?: string | null) => void;
  markSaved: () => void;
}

function pushHistory(past: Page[], current: Page | null): Page[] {
  if (!current) return past;
  const next = [...past, current];
  if (next.length > HISTORY_LIMIT) next.splice(0, next.length - HISTORY_LIMIT);
  return next;
}

const deviceToBp: Record<Device, "base" | "md" | "lg"> = {
  mobile: "base",
  tablet: "md",
  desktop: "lg",
};

export const useEditor = create<EditorState>((set, get) => ({
  mode: "page",
  page: null,
  selectedId: null,
  selectedIds: [],
  editingId: null,
  dirty: false,
  past: [],
  future: [],
  saveStatus: "idle",
  saveError: null,
  lastSavedAt: null,
  device: "desktop",
  activeBreakpoint: "lg",
  site: null,
  theme: defaultTheme,
  themeDirty: false,
  themeSaveStatus: "idle",
  themeSaveError: null,
  setDevice: (device) =>
    set({ device, activeBreakpoint: deviceToBp[device] }),
  setSite: (site) =>
    set({
      site,
      theme: (site.theme as Theme | null | undefined) ?? defaultTheme,
      themeDirty: false,
      themeSaveStatus: "idle",
      themeSaveError: null,
    }),
  updateTheme: (patch) =>
    set((state) => ({
      theme: { ...state.theme, ...patch },
      themeDirty: true,
    })),
  setTheme: (theme) => set({ theme, themeDirty: true }),
  markThemeSaved: () =>
    set({ themeDirty: false, themeSaveStatus: "saved", themeSaveError: null }),
  setThemeSaveStatus: (status, error = null) =>
    set({ themeSaveStatus: status, themeSaveError: error }),
  setPage: (page, mode = "page") =>
    set({
      mode,
      page,
      dirty: false,
      selectedId: null,
      selectedIds: [],
      editingId: null,
      past: [],
      future: [],
      saveStatus: "idle",
      saveError: null,
    }),
  updatePageMeta: (patch) =>
    set((state) => {
      if (!state.page) return state;
      return {
        page: { ...state.page, ...patch },
        dirty: true,
      };
    }),
  applyPagePatch: (patch) =>
    set((state) => {
      if (!state.page) return state;
      return { page: { ...state.page, ...patch } };
    }),
  selectBlock: (id) =>
    set((state) => ({
      selectedId: id,
      selectedIds: id ? [id] : [],
      editingId:
        state.editingId && state.editingId !== id ? null : state.editingId,
    })),
  toggleSelect: (id) =>
    set((state) => {
      const has = state.selectedIds.includes(id);
      const nextIds = has
        ? state.selectedIds.filter((x) => x !== id)
        : [...state.selectedIds, id];
      const nextPrimary = nextIds.includes(id)
        ? id
        : (nextIds[nextIds.length - 1] ?? null);
      return {
        selectedIds: nextIds,
        selectedId: nextPrimary,
        editingId: null,
      };
    }),
  clearSelection: () =>
    set({ selectedId: null, selectedIds: [], editingId: null }),
  groupSelectedAs: (type) =>
    set((state) => {
      if (!state.page) return state;
      const ids = state.selectedIds;
      if (ids.length < 2) return state;
      const blocks = state.page.blocks;
      const indices = ids
        .map((id) => blocks.findIndex((b) => b.id === id))
        .filter((i) => i >= 0)
        .sort((a, b) => a - b);
      if (indices.length < 2) return state;
      const picked = indices.map((i) => blocks[i]!);
      const firstIdx = indices[0]!;
      const container: Block = {
        id: uid(),
        type,
        version: 1,
        props: type === "columns" ? { count: Math.min(4, Math.max(2, picked.length)) } : {},
        children: picked,
      };
      const pickedSet = new Set(ids);
      const remaining = blocks.filter((b) => !pickedSet.has(b.id));
      const rebuilt = [
        ...remaining.slice(0, firstIdx),
        container,
        ...remaining.slice(firstIdx),
      ];
      const nextBlocks = applyAutoLayout(rebuilt);
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks: nextBlocks },
        dirty: true,
        selectedId: container.id,
        selectedIds: [container.id],
        editingId: null,
      };
    }),
  ungroupBlock: (id) =>
    set((state) => {
      if (!state.page) return state;
      const idx = state.page.blocks.findIndex((b) => b.id === id);
      if (idx === -1) return state;
      const target = state.page.blocks[idx]!;
      const kids = target.children ?? [];
      if (kids.length === 0) {
        const next = [...state.page.blocks];
        next.splice(idx, 1);
        const blocks = applyAutoLayout(next);
        return {
          past: pushHistory(state.past, state.page),
          future: [],
          page: { ...state.page, blocks },
          dirty: true,
          selectedId: null,
          selectedIds: [],
          editingId: null,
        };
      }
      const next = [...state.page.blocks];
      next.splice(idx, 1, ...kids);
      const blocks = applyAutoLayout(next);
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks },
        dirty: true,
        selectedId: kids[0]?.id ?? null,
        selectedIds: kids.map((k) => k.id),
        editingId: null,
      };
    }),
  startEditing: (id) =>
    set({ selectedId: id, selectedIds: [id], editingId: id }),
  stopEditing: () => set({ editingId: null }),
  updateBlockProps: (id, props) =>
    set((state) => {
      if (!state.page) return state;
      const current = state.page.blocks.find((b) => b.id === id);
      if (!current) return state;
      const reconciled = reconcileUserEdit(
        (current.props ?? {}) as Record<string, unknown>,
        (props ?? {}) as Record<string, unknown>,
      );
      const next = state.page.blocks.map((b) =>
        b.id === id ? { ...b, props: reconciled } : b,
      );
      const blocks = applyAutoLayout(next);
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks },
        dirty: true,
      };
    }),
  addBlock: (block) =>
    set((state) => {
      if (!state.page) return state;
      const blocks = applyAutoLayout([...state.page.blocks, block]);
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks },
        dirty: true,
        selectedId: block.id,
        editingId: block.id,
      };
    }),
  insertBlock: (block, index) =>
    set((state) => {
      if (!state.page) return state;
      const existing = state.page.blocks;
      const i = Math.max(0, Math.min(existing.length, index));
      const next = [...existing];
      next.splice(i, 0, block);
      const blocks = applyAutoLayout(next);
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks },
        dirty: true,
        selectedId: block.id,
        editingId: block.id,
      };
    }),
  applyPageTemplate: (blocks) =>
    set((state) => {
      if (!state.page) return state;
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks },
        dirty: true,
        selectedId: null,
        editingId: null,
      };
    }),
  moveBlock: (id, toIndex) =>
    set((state) => {
      if (!state.page) return state;
      const arr = [...state.page.blocks];
      const from = arr.findIndex((b) => b.id === id);
      if (from === -1) return state;
      const [moved] = arr.splice(from, 1);
      if (!moved) return state;
      const to = Math.max(0, Math.min(arr.length, toIndex));
      if (from === to) return state;
      arr.splice(to, 0, moved);
      const blocks = applyAutoLayout(arr);
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks },
        dirty: true,
      };
    }),
  removeBlock: (id) =>
    set((state) => {
      if (!state.page) return state;
      const filtered = state.page.blocks.filter((b) => b.id !== id);
      const blocks = applyAutoLayout(filtered);
      const nextIds = state.selectedIds.filter((x) => x !== id);
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks },
        dirty: true,
        selectedId: state.selectedId === id ? null : state.selectedId,
        selectedIds: nextIds,
        editingId: state.editingId === id ? null : state.editingId,
      };
    }),
  reorderBlocks: (from, to) =>
    set((state) => {
      if (!state.page) return state;
      const arr = [...state.page.blocks];
      const [moved] = arr.splice(from, 1);
      if (!moved) return state;
      arr.splice(to, 0, moved);
      const blocks = applyAutoLayout(arr);
      return {
        past: pushHistory(state.past, state.page),
        future: [],
        page: { ...state.page, blocks },
        dirty: true,
      };
    }),
  undo: () =>
    set((state) => {
      if (!state.page || state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1]!;
      return {
        page: previous,
        past: state.past.slice(0, -1),
        future: [state.page, ...state.future],
        dirty: true,
        editingId: null,
        selectedIds: state.selectedId ? [state.selectedId] : [],
      };
    }),
  redo: () =>
    set((state) => {
      if (!state.page || state.future.length === 0) return state;
      const next = state.future[0]!;
      return {
        page: next,
        past: [...state.past, state.page],
        future: state.future.slice(1),
        dirty: true,
        editingId: null,
        selectedIds: state.selectedId ? [state.selectedId] : [],
      };
    }),
  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,
  setSaveStatus: (status, error = null) =>
    set({ saveStatus: status, saveError: error }),
  markSaved: () =>
    set({
      dirty: false,
      saveStatus: "saved",
      saveError: null,
      lastSavedAt: Date.now(),
    }),
}));
