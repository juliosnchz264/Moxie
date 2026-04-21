"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Page } from "@moxie/core";
import { useEditor, type EditorMode } from "@/lib/store";
import { useAutosave } from "@/lib/use-autosave";
import { useEditorShortcuts } from "@/lib/use-shortcuts";
import { findTemplate } from "@/lib/templates";
import { BlockPalette } from "./BlockPalette";
import { Canvas } from "./Canvas";
import { PropsPanel } from "./PropsPanel";
import { Toolbar } from "./Toolbar";
import { PreviewFrame } from "./PreviewFrame";
import { ThemeEditor } from "./ThemeEditor";
import { GoogleFontsLoader } from "./GoogleFontsLoader";
import { PagesSidebar } from "./PagesSidebar";
import { Toasts } from "./Toasts";
import { PageTemplatePicker } from "./PageTemplatePicker";
import { ShortcutsModal } from "./ShortcutsModal";
import { WelcomeModal } from "./WelcomeModal";
import { MultiSelectBar } from "./MultiSelectBar";
import { CommandPalette } from "./CommandPalette";
import { publishCurrentPage } from "@/lib/publish-page";

interface ActiveDrag {
  kind: "template" | "block";
  label: string;
}

export function Editor({
  initialPage,
  initialMode = "page",
}: {
  initialPage: Page;
  initialMode?: EditorMode;
}) {
  const setPage = useEditor((s) => s.setPage);
  const site = useEditor((s) => s.site);
  const insertBlock = useEditor((s) => s.insertBlock);
  const moveBlock = useEditor((s) => s.moveBlock);
  const [previewing, setPreviewing] = useState(false);
  const [designMode, setDesignMode] = useState(false);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);
  const [templatePicker, setTemplatePicker] = useState<{
    open: boolean;
    requireConfirm: boolean;
  }>({ open: false, requireConfirm: false });
  const [helpOpen, setHelpOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    setPage(initialPage, initialMode);
  }, [initialPage, initialMode, setPage]);

  useAutosave();
  useEditorShortcuts(
    () => setHelpOpen(true),
    () => setPaletteOpen(true),
  );

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as
      | { kind?: "template" | "block"; templateType?: string }
      | undefined;
    if (data?.kind === "template") {
      const tpl = data.templateType ? findTemplate(data.templateType) : null;
      setActiveDrag({ kind: "template", label: tpl?.label ?? "Block" });
    } else if (data?.kind === "block") {
      setActiveDrag({ kind: "block", label: "Moving block" });
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = e;
    if (!over) return;
    const overData = over.data.current as
      | { kind?: string; index?: number }
      | undefined;
    if (overData?.kind !== "slot" || overData.index === undefined) return;
    const activeData = active.data.current as
      | { kind?: string; templateType?: string }
      | undefined;
    if (activeData?.kind === "template") {
      const tpl = activeData.templateType
        ? findTemplate(activeData.templateType)
        : null;
      if (tpl) insertBlock(tpl.build(), overData.index);
    } else if (activeData?.kind === "block") {
      moveBlock(String(active.id), overData.index);
    }
  };

  const onDragCancel = () => setActiveDrag(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <GoogleFontsLoader />
      <div className="flex h-screen flex-col bg-slate-100">
        <Toolbar
          previewing={previewing}
          onTogglePreview={() => setPreviewing((p) => !p)}
          designMode={designMode}
          onToggleDesignMode={() => setDesignMode((d) => !d)}
          onOpenTemplates={() =>
            setTemplatePicker({ open: true, requireConfirm: true })
          }
          onOpenHelp={() => setHelpOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          {previewing ? null : (
            <PagesSidebar
              siteId={site?.id ?? null}
              currentPageId={initialMode === "page" ? initialPage.id : null}
              editing={initialMode}
            />
          )}
          {previewing ? null : designMode ? <ThemeEditor /> : <BlockPalette />}
          <main className="flex-1 overflow-hidden">
            {previewing ? (
              <PreviewFrame pageId={initialPage.id} />
            ) : (
              <Canvas
                dragActive={!!activeDrag}
                onBrowseTemplates={() =>
                  setTemplatePicker({ open: true, requireConfirm: false })
                }
              />
            )}
          </main>
          {designMode ? null : <PropsPanel />}
        </div>
      </div>
      <DragOverlay dropAnimation={null}>
        {activeDrag ? (
          <div className="bg-white border-2 border-blue-500 shadow-xl rounded px-3 py-2 text-sm text-slate-800 pointer-events-none">
            {activeDrag.label}
          </div>
        ) : null}
      </DragOverlay>
      <Toasts />
      <PageTemplatePicker
        open={templatePicker.open}
        requireConfirm={templatePicker.requireConfirm}
        onClose={() =>
          setTemplatePicker({ open: false, requireConfirm: false })
        }
      />
      <ShortcutsModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        previewing={previewing}
        designMode={designMode}
        onTogglePreview={() => setPreviewing((p) => !p)}
        onToggleDesign={() => setDesignMode((d) => !d)}
        onOpenTemplates={() =>
          setTemplatePicker({ open: true, requireConfirm: true })
        }
        onOpenHelp={() => setHelpOpen(true)}
        onPublish={async () => {
          await publishCurrentPage();
        }}
      />
      <WelcomeModal />
      {previewing ? null : <MultiSelectBar />}
    </DndContext>
  );
}
