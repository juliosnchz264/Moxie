"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type PayloadSiteDoc, WEB_URL } from "@/lib/api-client";
import { AuthGuard } from "@/components/app/AuthGuard";
import { AppShell } from "@/components/app/AppShell";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function SitesInner() {
  const router = useRouter();
  const [sites, setSites] = useState<PayloadSiteDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .listSites()
      .then((res) => {
        if (!cancelled) setSites(res.docs);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const create = async (data: {
    name: string;
    slug: string;
    domain: string;
  }) => {
    setCreating(true);
    try {
      const site = await api.createSite(data);
      const home = await api.createPage({
        title: "Home",
        slug: "home",
        site: site.id,
      });
      setShowCreate(false);
      router.push(`/editor/${home.id}`);
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  };

  return (
    <AppShell
      breadcrumbs={[{ label: "Sites" }]}
      right={
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="h-8 px-3 rounded-md bg-slate-900 text-white text-xs font-medium hover:bg-slate-800"
        >
          + New site
        </button>
      }
    >
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Your sites
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pick one to edit, or spin up a fresh one in seconds.
            </p>
          </div>
        </div>

        {error ? (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">
            {error}
          </div>
        ) : null}

        {sites === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-xl p-5 bg-white animate-pulse h-44"
              />
            ))}
          </div>
        ) : sites.length === 0 ? (
          <EmptyState onCreate={() => setShowCreate(true)} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sites.map((s) => (
              <SiteCard key={s.id} site={s} />
            ))}
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-sm text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-white transition-colors flex flex-col items-center justify-center gap-2 min-h-44"
            >
              <span className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-lg">
                +
              </span>
              New site
            </button>
          </div>
        )}
      </div>

      {showCreate ? (
        <CreateSiteModal
          busy={creating}
          onClose={() => setShowCreate(false)}
          onCreate={create}
        />
      ) : null}
    </AppShell>
  );
}

function SiteCard({ site }: { site: PayloadSiteDoc }) {
  return (
    <Link
      href={`/sites/${site.id}`}
      className="group border rounded-xl bg-white p-5 flex flex-col justify-between hover:border-slate-400 hover:shadow-sm transition-all min-h-44"
    >
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div
            className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-semibold"
            style={{ background: siteColor(site.id) }}
          >
            {site.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate">
              {site.name}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {site.domain}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500 mt-4">
        <span>Updated {formatDate(site.updatedAt)}</span>
        <span className="text-slate-400 group-hover:text-slate-700">
          Open →
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 flex flex-col items-center text-center bg-white">
      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl mb-4">
        ✨
      </div>
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Create your first site
      </h2>
      <p className="text-sm text-slate-500 max-w-sm mb-5">
        A site holds pages, media, and theme. We&apos;ll create a starter home
        page so you can begin editing right away.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="h-10 px-5 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
      >
        Create site
      </button>
      <div className="mt-4 text-xs text-slate-400">
        Public renderer at{" "}
        <code className="bg-slate-100 px-1 rounded">{WEB_URL}</code>
      </div>
    </div>
  );
}

function CreateSiteModal({
  busy,
  onClose,
  onCreate,
}: {
  busy: boolean;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    slug: string;
    domain: string;
  }) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [domainTouched, setDomainTouched] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const autoSlug = slugify(name);
  const effectiveSlug = slugTouched ? slug : autoSlug;
  const effectiveDomain =
    domainTouched ? domain : autoSlug ? `${autoSlug}.localhost` : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !effectiveSlug || !effectiveDomain || busy) return;
    await onCreate({
      name,
      slug: effectiveSlug,
      domain: effectiveDomain,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b">
          <h2 className="font-semibold text-slate-900">New site</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Basics now. Fine-tune theme, header, footer from the editor.
          </p>
        </header>
        <form onSubmit={submit} className="px-5 py-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Name</span>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Marketing"
              className="h-10 px-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Slug</span>
            <input
              required
              value={effectiveSlug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              placeholder="acme"
              className="h-10 px-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
            <span className="text-[11px] text-slate-400">
              Used internally. Lowercase letters, numbers, hyphens.
            </span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-600">Domain</span>
            <input
              required
              value={effectiveDomain}
              onChange={(e) => {
                setDomainTouched(true);
                setDomain(e.target.value.trim().toLowerCase());
              }}
              placeholder="acme.localhost"
              className="h-10 px-3 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
            />
            <span className="text-[11px] text-slate-400">
              The host the public renderer matches. Use{" "}
              <code className="bg-slate-100 px-1 rounded">
                {autoSlug || "name"}.localhost
              </code>{" "}
              for local dev.
            </span>
          </label>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-3 rounded-md text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="h-9 px-4 rounded-md bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create site"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function siteColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 70% 50%), hsl(${(hue + 40) % 360} 70% 45%))`;
}

export default function SitesPage() {
  return (
    <AuthGuard>
      <SitesInner />
    </AuthGuard>
  );
}
