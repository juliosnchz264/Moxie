"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  api,
  WEB_URL,
  type PayloadPageDoc,
  type PayloadSiteDoc,
} from "@/lib/api-client";
import { AuthGuard } from "@/components/app/AuthGuard";
import { AppShell } from "@/components/app/AppShell";
import {
  pageStatusLabel,
  statusColor,
  formatRelativeTime,
} from "@/lib/page-status";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function SiteDashboardInner({ siteId }: { siteId: string }) {
  const router = useRouter();
  const [site, setSite] = useState<PayloadSiteDoc | null>(null);
  const [pages, setPages] = useState<PayloadPageDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    try {
      const [s, list] = await Promise.all([
        api.getSite(siteId),
        api.listPages(siteId),
      ]);
      setSite(s);
      setPages(list.docs);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getSite(siteId), api.listPages(siteId)])
      .then(([s, list]) => {
        if (cancelled) return;
        setSite(s);
        setPages(list.docs);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [siteId]);

  const createPage = async () => {
    const title = window.prompt("Page title");
    if (!title) return;
    const suggested = slugify(title);
    const slugIn = window.prompt("Slug", suggested);
    if (!slugIn) return;
    const slug = slugify(slugIn);
    setBusy(true);
    try {
      const doc = await api.createPage({ title, slug, site: siteId });
      router.push(`/editor/${doc.id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const duplicate = async (id: string) => {
    setBusy(true);
    try {
      await api.duplicatePage(id);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    setBusy(true);
    try {
      await api.deletePage(id);
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const liveUrl = site ? publicUrlFor(site.domain, "") : null;

  return (
    <AppShell
      breadcrumbs={[
        { label: "Sites", href: "/sites" },
        { label: site?.name ?? "…" },
      ]}
      right={
        liveUrl ? (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 rounded-md border border-slate-200 text-xs hover:bg-slate-50 flex items-center gap-1.5"
          >
            <span>Visit live</span>
            <span aria-hidden>↗</span>
          </a>
        ) : null
      }
    >
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {error ? (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
            {error}
          </div>
        ) : null}

        {site ? (
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="h-14 w-14 rounded-xl flex items-center justify-center text-white text-xl font-semibold shrink-0"
                style={{ background: siteColor(site.id) }}
              >
                {site.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-slate-900 truncate">
                  {site.name}
                </h1>
                <div className="text-sm text-slate-500 font-mono truncate">
                  {site.domain}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-14 w-full max-w-md bg-slate-200 animate-pulse rounded mb-8" />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                Pages
              </h2>
              <button
                type="button"
                onClick={createPage}
                disabled={busy}
                className="h-8 px-3 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                + New page
              </button>
            </div>

            {pages === null ? (
              <ul className="bg-white border rounded-xl overflow-hidden">
                {Array.from({ length: 3 }).map((_, i) => (
                  <li
                    key={i}
                    className="px-4 py-3 border-b last:border-b-0 animate-pulse"
                  >
                    <div className="h-3 w-40 bg-slate-200 rounded mb-1.5" />
                    <div className="h-2 w-24 bg-slate-100 rounded" />
                  </li>
                ))}
              </ul>
            ) : pages.length === 0 ? (
              <div className="bg-white border rounded-xl p-10 text-center">
                <div className="h-12 w-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  📄
                </div>
                <div className="font-semibold text-slate-900 mb-1">
                  No pages yet
                </div>
                <div className="text-sm text-slate-500 mb-4">
                  Create a page to start editing.
                </div>
                <button
                  type="button"
                  onClick={createPage}
                  disabled={busy}
                  className="h-9 px-4 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
                >
                  Create first page
                </button>
              </div>
            ) : (
              <ul className="bg-white border rounded-xl overflow-hidden divide-y">
                {pages.map((p) => (
                  <li
                    key={p.id}
                    className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    <Link
                      href={`/editor/${p.id}`}
                      className="flex-1 min-w-0 flex flex-col"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-900 truncate">
                          {p.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${statusColor(
                            pageStatusLabel(p),
                          )}`}
                        >
                          {pageStatusLabel(p)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono truncate">
                        /{p.slug}
                        {p.status === "published" ? (
                          <span className="text-slate-400 font-sans ml-2">
                            · {(p.views ?? 0).toLocaleString()} views
                            {p.lastVisitedAt
                              ? ` · ${formatRelativeTime(p.lastVisitedAt)}`
                              : ""}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      {p.status === "published" && site ? (
                        <a
                          href={publicUrlFor(site.domain, p.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-2 py-1 rounded hover:bg-slate-200"
                          title="Open live"
                        >
                          ↗
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => duplicate(p.id)}
                        disabled={busy}
                        className="text-xs px-2 py-1 rounded hover:bg-slate-200 disabled:opacity-50"
                        title="Duplicate"
                      >
                        ⎘
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p.id, p.title)}
                        disabled={busy}
                        className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <aside className="flex flex-col gap-4">
            <div className="bg-white border rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                Shared layout
              </h3>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/editor/site/${siteId}/header`}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-400">▦</span> Header
                  </span>
                  <span className="text-slate-400">→</span>
                </Link>
                <Link
                  href={`/editor/site/${siteId}/footer`}
                  className="flex items-center justify-between px-3 py-2 rounded-md border border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-slate-400">▥</span> Footer
                  </span>
                  <span className="text-slate-400">→</span>
                </Link>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-4">
              <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
                Quick actions
              </h3>
              <div className="flex flex-col gap-2 text-sm">
                <button
                  type="button"
                  onClick={createPage}
                  disabled={busy}
                  className="text-left px-3 py-2 rounded-md hover:bg-slate-50"
                >
                  + New page
                </button>
                {liveUrl ? (
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-md hover:bg-slate-50"
                  >
                    Visit live site ↗
                  </a>
                ) : null}
                <Link
                  href={pages && pages[0] ? `/editor/${pages[0].id}` : "#"}
                  className={`px-3 py-2 rounded-md hover:bg-slate-50 ${
                    pages && pages[0] ? "" : "pointer-events-none opacity-40"
                  }`}
                >
                  Open theme editor
                </Link>
              </div>
            </div>

            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-xs text-slate-500">
              <div className="font-semibold text-slate-700 mb-1">
                Dev tip
              </div>
              Local public renderer resolves sites by the{" "}
              <code className="bg-white px-1 rounded">Host</code> header.
              Visit{" "}
              {site ? (
                <a
                  className="underline"
                  href={publicUrlFor(site.domain, "")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {publicUrlFor(site.domain, "")}
                </a>
              ) : (
                "the site domain"
              )}{" "}
              to see published content.
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function publicUrlFor(domain: string, slug: string): string {
  try {
    const web = new URL(WEB_URL);
    const host = domain.split(":")[0];
    web.hostname = host || web.hostname;
    web.pathname = slug && slug !== "home" ? `/${slug}` : "/";
    return web.toString();
  } catch {
    return `${WEB_URL}${slug && slug !== "home" ? `/${slug}` : "/"}`;
  }
}

function siteColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 50%), hsl(${(hue + 40) % 360} 70% 45%))`;
}

export default function SiteDashboardPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = use(params);
  return (
    <Suspense fallback={null}>
      <AuthGuard>
        <SiteDashboardInner siteId={siteId} />
      </AuthGuard>
    </Suspense>
  );
}
