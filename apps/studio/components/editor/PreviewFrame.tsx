"use client";

export function PreviewFrame({ pageId }: { pageId: string }) {
  return (
    <iframe
      key={pageId}
      src={`/preview/${pageId}`}
      className="h-full w-full border-0 bg-white"
      title="Preview"
    />
  );
}
