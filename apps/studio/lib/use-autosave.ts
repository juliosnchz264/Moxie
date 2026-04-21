"use client";

import { useEffect, useRef } from "react";
import { useEditor } from "./store";
import { api } from "./api-client";

const AUTOSAVE_DEBOUNCE_MS = 1500;

export function useAutosave() {
  const page = useEditor((s) => s.page);
  const mode = useEditor((s) => s.mode);
  const dirty = useEditor((s) => s.dirty);
  const site = useEditor((s) => s.site);
  const setSaveStatus = useEditor((s) => s.setSaveStatus);
  const markSaved = useEditor((s) => s.markSaved);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!page || !dirty) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      setSaveStatus("saving");
      try {
        if (mode === "page") {
          if (!page.id) {
            throw new Error("Page id missing — cannot autosave");
          }
          await api.updatePage(page.id, {
            title: page.title,
            layout: page.blocks,
            ...(page.description !== undefined
              ? { description: page.description }
              : {}),
            ...(page.metaImage !== undefined
              ? { metaImage: page.metaImage }
              : {}),
          });
        } else if (site) {
          if (!site.id) {
            throw new Error("Site id missing — cannot autosave slot");
          }
          await api.updateSite(site.id, {
            [mode]: page.blocks,
          });
        }
        markSaved();
      } catch (e) {
        setSaveStatus("error", (e as Error).message);
      } finally {
        savingRef.current = false;
      }
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [page, dirty, mode, site, setSaveStatus, markSaved]);
}
