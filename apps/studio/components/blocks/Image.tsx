"use client";

import { useState } from "react";
import type { Block } from "@moxie/core";
import { useEditor } from "@/lib/store";
import {
  api,
  resolveMediaUrl,
  type PayloadMediaDoc,
} from "@/lib/api-client";
import { MediaPicker } from "@/components/editor/MediaPicker";

interface ImageProps {
  src?: string;
  alt?: string;
  caption?: string;
  fit?: "cover" | "contain" | "fill";
  [key: string]: unknown;
}

const fitClass: Record<"cover" | "contain" | "fill", string> = {
  cover: "object-cover",
  contain: "object-contain",
  fill: "object-fill",
};

export function Image({
  block,
  className,
}: {
  block: Block;
  className: string;
}) {
  const siteId = useEditor((s) => s.page?.siteId ?? null);
  const update = useEditor((s) => s.updateBlockProps);
  const props = (block.props ?? {}) as ImageProps;
  const fit = props.fit ?? "cover";
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyMedia = (doc: PayloadMediaDoc) => {
    update(block.id, {
      ...props,
      src: resolveMediaUrl(doc.url),
      alt: doc.alt ?? props.alt ?? "",
    });
  };

  const handleFiles = async (files: FileList) => {
    const file = Array.from(files).find((f) => f.type.startsWith("image/"));
    if (!file || !siteId) return;
    setUploading(true);
    setError(null);
    try {
      const doc = await api.uploadMedia(file, siteId);
      applyMedia(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <figure className={`${className}`.trim()}>
        {props.src ? (
          <div className="relative group">
            <img
              src={props.src}
              alt={props.alt ?? ""}
              className={`w-full ${fitClass[fit]} rounded`}
              loading="lazy"
            />
            <button
              type="button"
              className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-white/90 border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-white transition"
              onClick={(e) => {
                e.stopPropagation();
                setPickerOpen(true);
              }}
            >
              Replace
            </button>
          </div>
        ) : (
          <div
            className={`w-full aspect-video flex flex-col items-center justify-center gap-2 rounded border-2 border-dashed transition ${
              dragOver
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:bg-slate-100"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
          >
            {uploading ? (
              <span className="text-sm text-slate-500">Uploading…</span>
            ) : (
              <>
                <span className="text-sm text-slate-500">
                  Drag an image here
                </span>
                <button
                  type="button"
                  className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPickerOpen(true);
                  }}
                  disabled={!siteId}
                >
                  Browse library
                </button>
                {error ? (
                  <span className="text-[11px] text-red-600">{error}</span>
                ) : null}
              </>
            )}
          </div>
        )}
        {props.caption ? (
          <figcaption className="mt-1 text-xs text-slate-500 text-center">
            {props.caption}
          </figcaption>
        ) : null}
      </figure>

      {pickerOpen && siteId ? (
        <MediaPicker
          siteId={siteId}
          onSelect={(doc) => {
            applyMedia(doc);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </>
  );
}
