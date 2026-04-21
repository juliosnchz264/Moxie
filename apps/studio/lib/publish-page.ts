"use client";

import { api, adaptPayloadPage } from "./api-client";
import { useEditor } from "./store";
import { showToast } from "./use-toast";

export async function publishCurrentPage(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const state = useEditor.getState();
  const { page, mode, dirty } = state;
  if (!page || mode !== "page") return { ok: false, error: "Not a page" };

  const prevStatus = page.status;
  const prevPublishedAt = page.publishedAt;
  const now = new Date().toISOString();

  state.applyPagePatch({ status: "published", publishedAt: now });
  showToast("success", "Live 🚀");

  try {
    if (dirty) {
      state.setSaveStatus("saving");
      await api.updatePage(page.id, {
        title: page.title,
        layout: page.blocks,
      });
      state.markSaved();
    }
    const doc = await api.publishPage(page.id);
    state.setPage(adaptPayloadPage(doc));
    return { ok: true };
  } catch (e) {
    const msg = (e as Error).message;
    state.applyPagePatch({ status: prevStatus, publishedAt: prevPublishedAt });
    state.setSaveStatus("error", msg);
    showToast("error", `Publish failed: ${msg}`);
    return { ok: false, error: msg };
  }
}
