"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import { renderTree } from "@moxie/engine";
import type { Block } from "@moxie/core";
import { adaptPayloadPage, api } from "@/lib/api-client";
import { componentRegistry } from "@/components/blocks/registry";

export default function PreviewRoute({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = use(params);
  const [nodes, setNodes] = useState<ReactNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .preview(pageId)
      .then((doc) => {
        const page = adaptPayloadPage(doc);
        try {
          setNodes(
            renderTree<ReactNode>(page.blocks as Block[], {
              components: componentRegistry,
            }),
          );
        } catch (e) {
          setError((e as Error).message);
        }
      })
      .catch((e: Error) => setError(e.message));
  }, [pageId]);

  if (error) {
    return <div className="p-8 text-red-600">{error}</div>;
  }
  if (!nodes) {
    return <div className="p-8 text-slate-500">Loading preview…</div>;
  }
  return (
    <div className="min-h-screen bg-white">
      {nodes.map((node, i) => (
        <div key={i}>{node}</div>
      ))}
    </div>
  );
}
