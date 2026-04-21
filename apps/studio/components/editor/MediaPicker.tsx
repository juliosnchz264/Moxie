"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  api,
  pickThumb,
  resolveMediaUrl,
  type PayloadMediaDoc,
} from "@/lib/api-client";

interface Props {
  siteId: string;
  onSelect: (doc: PayloadMediaDoc) => void;
  onClose: () => void;
}

export function MediaPicker({ siteId, onSelect, onClose }: Props) {
  const [docs, setDocs] = useState<PayloadMediaDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .listMedia(siteId)
      .then((res) => {
        if (!cancelled) setDocs(res.docs);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) return;
      setUploading(true);
      setError(null);
      try {
        const uploaded: PayloadMediaDoc[] = [];
        for (const file of list) {
          const doc = await api.uploadMedia(file, siteId);
          uploaded.push(doc);
        }
        setDocs((prev) => [...uploaded, ...(prev ?? [])]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [siteId],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
        }}
      >
        {dragOver ? (
          <div className="absolute inset-0 z-10 bg-blue-50/90 border-4 border-dashed border-blue-400 flex items-center justify-center text-blue-700 font-medium pointer-events-none">
            Drop images to upload
          </div>
        ) : null}

        <header className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold">Media library</h2>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-700 text-xl leading-none"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="px-4 py-3 border-b flex items-center gap-3">
          <button
            type="button"
            className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <span className="text-xs text-slate-500">or drag images anywhere in this window</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {error ? (
            <span className="text-xs text-red-600 ml-auto truncate" title={error}>
              {error}
            </span>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {docs === null ? (
            <div
              aria-hidden
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
            >
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded border border-slate-200 bg-slate-100 animate-pulse"
                />
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="text-sm text-slate-500 text-center py-12">
              No images yet. Upload your first one.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  className="group relative aspect-square rounded border border-slate-200 overflow-hidden hover:ring-2 hover:ring-blue-500 transition"
                  onClick={() => onSelect(doc)}
                  title={doc.filename ?? doc.alt ?? ""}
                >
                  <img
                    src={pickThumb(doc)}
                    alt={doc.alt ?? ""}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 text-[10px] text-white bg-gradient-to-t from-black/70 to-transparent truncate">
                    {doc.filename}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { resolveMediaUrl };
