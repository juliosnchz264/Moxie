"use client";

import { useEffect } from "react";
import { pageTemplates, type PageTemplate } from "@/lib/page-templates";
import { useEditor } from "@/lib/store";
import { showToast } from "@/lib/use-toast";

export function PageTemplatePicker({
  open,
  onClose,
  requireConfirm,
}: {
  open: boolean;
  onClose: () => void;
  requireConfirm: boolean;
}) {
  const applyPageTemplate = useEditor((s) => s.applyPageTemplate);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const apply = (tpl: PageTemplate) => {
    if (requireConfirm) {
      const ok = confirm(
        `Replace the current page with the "${tpl.name}" template? Content will be replaced but can be undone with Cmd/Ctrl+Z.`,
      );
      if (!ok) return;
    }
    applyPageTemplate(tpl.blocks());
    showToast("success", `${tpl.name} template applied`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div>
            <div className="font-semibold text-slate-800">
              Start from a template
            </div>
            <div className="text-xs text-slate-500">
              Pre-built pages you can edit. Your theme stays.
            </div>
          </div>
          <button
            className="text-slate-400 hover:text-slate-700 text-lg"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pageTemplates.map((tpl) => (
            <button
              key={tpl.id}
              className="group text-left border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50/40 transition"
              onClick={() => apply(tpl)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl leading-none">{tpl.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800">{tpl.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {tpl.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="px-5 py-3 border-t text-[11px] text-slate-400">
          Templates replace the current page content but keep your title, slug, theme, and header/footer.
        </div>
      </div>
    </div>
  );
}
