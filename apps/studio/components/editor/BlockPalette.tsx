"use client";

import { useDraggable } from "@dnd-kit/core";
import { useEditor } from "@/lib/store";
import { blockTemplates, type BlockTemplate, type BlockPreset } from "@/lib/templates";

function PaletteItem({ template }: { template: BlockTemplate }) {
  const addBlock = useEditor((s) => s.addBlock);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${template.type}`,
    data: { kind: "template", templateType: template.type },
  });

  const hasPresets = (template.presets?.length ?? 0) > 1;

  return (
    <div
      className={`group border border-slate-200 rounded-lg transition ${
        isDragging
          ? "opacity-40 border-blue-400"
          : "hover:border-blue-400 hover:bg-blue-50/40"
      }`}
    >
      <button
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="flex items-start gap-3 w-full px-3 py-2.5 text-left text-sm cursor-grab active:cursor-grabbing"
        onClick={() => addBlock(template.build())}
      >
        <span className="text-xl leading-none text-slate-400 group-hover:text-blue-500">
          {template.icon}
        </span>
        <span className="flex flex-col min-w-0">
          <span className="font-medium text-slate-800">{template.label}</span>
          <span className="text-xs text-slate-500 truncate">
            {template.description}
          </span>
        </span>
      </button>
      {hasPresets ? (
        <div className="flex flex-wrap gap-1 px-2 pb-2">
          {template.presets!.map((preset: BlockPreset) => (
            <button
              key={preset.id}
              onClick={(e) => {
                e.stopPropagation();
                addBlock(preset.build());
              }}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700 transition-colors"
              title={`Insert ${template.label} · ${preset.label}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BlockPalette() {
  return (
    <aside className="w-56 shrink-0 border-r bg-white flex flex-col">
      <div className="px-4 py-3 border-b">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Add block
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          Click or drag · presets below
        </div>
      </div>
      <div className="flex flex-col gap-2 p-3 overflow-y-auto">
        {blockTemplates.map((t) => (
          <PaletteItem key={t.type} template={t} />
        ))}
      </div>
    </aside>
  );
}
