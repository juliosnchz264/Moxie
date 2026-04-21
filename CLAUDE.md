# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Moxie is

Moxie is a free-tier, multi-tenant visual CMS stack built to run on Cloudflare Pages or Vercel Hobby without rebuild-per-publish or CSS-safelist blowups. The architecture decouples the editor from the CMS and replaces freeform Tailwind with a token system. See [README.md](README.md) for the rationale.

## Architecture — non-negotiable rules

These override Payload/Next defaults that training data may suggest.

1. **No Payload Local API outside `apps/api`.** `apps/studio` and `apps/web` communicate with Payload **only via HTTP REST**. Local API is reserved for migration scripts and seeders inside the api container. Never `import { getPayload } from 'payload'` in studio or web code.
2. **Versioned block contract.** Base TS types (`Block`, `Page`) live in `@moxie/core`. Runtime Zod schemas + the version registry live in `@moxie/contract`. Every persisted Block carries `version: number` — bumped when the block's shape breaks backward compat. `props: unknown` forces callers to narrow via Zod at boundaries; never read `block.props` directly.
3. **Design tokens only, no freeform Tailwind in content.** Editable properties go through `@moxie/tokens`, which maps token keys → a fixed set of Tailwind classes. All class values in token maps are **literal strings** — Tailwind v4's JIT scans for literals, so dynamic template interpolation drops classes from the bundle.
4. **Multi-tenant via `siteId`.** Every data-carrying boundary (collection, query, REST response, Astro request) must thread `siteId`. The public renderer resolves `siteId` from the incoming domain via middleware.
5. **SSR + CDN cache, not rebuilds.** Astro renders on-demand with cache headers; Publish = DB write + cache purge. **Never add a build step on publish** — it's the anti-pattern Moxie exists to avoid.

## Repository layout

pnpm workspace with Turborepo. One `.git` at root.

```
moxie/
├── apps/
│   ├── api/     # Payload CMS — Admin UI + REST only
│   ├── studio/  # Next.js visual editor + dashboard
│   └── web/     # Astro multi-tenant public renderer
├── packages/@moxie/
│   ├── core/       # Base TS types: Block, Page, ContractVersion
│   ├── contract/   # Zod schemas + version registry + migrate helpers
│   ├── engine/     # Agnostic render — component registry + renderTree
│   ├── ui/         # React base components (scaffold)
│   └── tokens/     # Token → Tailwind class map + theme
└── tooling/config/ # Shared ESLint / TS / Tailwind config (empty)
```

**Workspace globs** (in [pnpm-workspace.yaml](pnpm-workspace.yaml)): `apps/*`, `packages/@moxie/*`, `tooling/config/*`. Aliases `@moxie/*` resolve via pnpm symlinks in `node_modules`, not tsconfig `paths`. Native build scripts (`sharp`, `esbuild`, `unrs-resolver`) are whitelisted at the root `package.json` under `pnpm.onlyBuiltDependencies` — never add that field to app-level `package.json`.

## Current state

### Packages

- **`@moxie/core`** — `Block { id, type, version, props: unknown, children? }`, `Page { id, siteId, slug, title, blocks, status, description?, metaImage?, ... }`, `ContractVersion`. Zero runtime deps.
- **`@moxie/contract`** — `createRegistry()`, `validateBlock`/`validatePage` (migrate + Zod validate, throws on failure), `migrateProps`. Ships schemas for all 11 block types. Every block schema **must** call `.passthrough()` — Zod strips unknown keys by default, which silently drops token props.
- **`@moxie/tokens`** — closed token system: `spacing`, `color`, `radius`, `typography`, `shadow`, `border`, `borderColor`, `maxWidth`. Responsive via `ResponsiveValue<T> = T | Partial<Record<"base"|"md"|"lg", T>>`. `resolveTokens(props, { activeBp? })`: with `activeBp` emits un-prefixed classes (studio preview), without emits full prefixed set `p-4 md:p-6 lg:p-8` (public site). Colors use CSS vars (`bg-primary` etc.) so per-site theme overrides in `@theme` propagate without rebuild.
- **`@moxie/engine`** — generic over renderer output type `T`. `createComponentRegistry<T>()`, `resolveBlock`, `renderTree`. Host (studio / web) plugs in components; engine runs validate+migrate and computes token className.

### Block catalogue (11 types)

`hero`, `text` (v2), `richtext` (TipTap JSON), `image`, `button`, `spacer`, `divider`, `card`, `cta`, `gallery`, `section`, `columns`. Container blocks (`section`, `columns`, `card`, `hero`, `cta`) use `block.children`; the engine recurses automatically.

### apps/api (Payload CMS)

Collections at [apps/api/src/collections/](apps/api/src/collections/):

- **Users** — auth collection; CORS + CSRF allowlist in [payload.config.ts](apps/api/src/payload.config.ts) covers `:3001` + `:4321` (override via `CORS_ORIGINS`).
- **Sites** — `name/slug/domain` (unique+indexed), `theme` (JSON), `header`/`footer` (JSON block arrays validated in `beforeChange`). Open read, auth-gated writes. Site limit enforced via `beforeValidate`.
- **Pages** — `title/slug/site/status/layout/description/metaImage/publishedAt/views/lastVisitedAt`. Compound unique `(site, slug)`. `beforeValidate` enforces page-per-site + layout-size limits. `beforeChange` runs `assertLayoutSize` + `validateBlock` on every root block (migrate + validate). `afterChange` triggers cache purge on publish transitions. Custom endpoints: `GET /api/pages/preview/:id` (auth), `POST /api/pages/:id/publish`.
- **Media** — `{alt, site, upload: true}`, image-only mime whitelist, auto-generated `thumbnail` (320×320) + `card` (768w) sizes via sharp.

Free-tier limits from env: `MOXIE_MAX_SITES` (5), `MOXIE_MAX_PAGES_PER_SITE` (20), `MOXIE_MAX_BLOCKS_PER_PAGE` (100), `MOXIE_MAX_LAYOUT_BYTES` (262144). Cache purge via `CACHE_PURGE_URL` + optional `CACHE_PURGE_TOKEN` (POSTs `{urls: [...]}`); no-op when unset.

**Payload skill:** [apps/api/.claude/skills/payload/SKILL.md](apps/api/.claude/skills/payload/SKILL.md) — consult before writing collections, fields, hooks, or access control.

After schema changes: `pnpm generate:types` inside `apps/api`.

### apps/studio (Next.js editor)

Next.js 16 + React 19 + Tailwind v4 + Zustand + `@dnd-kit` + TipTap. Talks to `apps/api` over HTTP only. Auth via Payload `/api/users/login` (cookie-based) surfaced through [lib/use-auth.ts](apps/studio/lib/use-auth.ts) using `useSyncExternalStore`.

**Routes:**

| Path | Purpose |
|------|---------|
| `/` | Auth-aware redirect (`/sites` if authed, `/login` otherwise) |
| `/login` | Login + register (split-panel, auto-redirects `?next=`) |
| `/sites` | Sites dashboard: grid, empty-state wizard, create-site modal |
| `/sites/[siteId]` | Per-site dashboard: pages list, shared layout shortcuts, quick actions |
| `/editor/[pageId]` | Block editor (AuthGuarded) |
| `/editor/site/[siteId]/[slot]` | Header/Footer editor (slot ∈ {header, footer}) |
| `/preview/[pageId]` | Iframe preview target |

**Key modules** under [apps/studio/lib/](apps/studio/lib/):

- `api-client.ts` — thin `fetch` wrapper with `credentials: "include"`. Exports `api.{login,logout,me,register,listSites,createSite,getSite,updateSite,listPages,createPage,deletePage,updatePage,duplicatePage,preview,publishPage,listMedia,uploadMedia,...}` and `API_URL`/`WEB_URL`. `adaptPayloadPage(doc)` normalizes Payload shape → `@moxie/core` `Page`.
- `store.ts` — single Zustand store: `page`, `site`, `selectedId`, `selectedIds`, `editingId`, `dirty`, `saveStatus`, `past`/`future` (undo/redo, limit 100), `device`/`activeBreakpoint`, `mode` (`"page"|"header"|"footer"`). Every mutating action pushes prior `page` onto `past` and clears `future`. Theme state lives separately (`themeDirty`, `themeSaveStatus`) — not tracked in page history.
- `use-auth.ts`, `use-autosave.ts` (1500ms debounce, branches per mode), `use-shortcuts.ts` (Cmd+Z/Y/Shift+Z, `?`, Esc, Cmd+G group, Cmd+Shift+G ungroup), `use-toast.ts` (module-singleton, not Zustand).
- `templates.ts` (palette block templates + presets), `page-templates.ts` (5 starter pages: saas-landing, portfolio, blog-post, about, contact), `smart-defaults.ts` (context-aware token fallbacks on insert), `layout-context.ts` (`_auto: string[]` metadata for flow-driven props).
- `responsive-props.ts`, `canvas-viewport.ts` (IntersectionObserver culling with 800px margin), `onboarding.ts`, `page-status.ts`, `richtext-html.ts` (JSON → HTML walker mirroring the one in `apps/web`).

**Components** under [apps/studio/components/](apps/studio/components/):

- `app/` — `AuthGuard`, `AppShell` (sticky header, breadcrumbs, user menu, right-slot actions).
- `blocks/` — one React component per block type (+ registry; `RichText` and `Gallery` lazy-loaded via `React.lazy`).
- `editor/` — `Editor`, `Toolbar` (save indicator, undo/redo, device switch, templates/theme/preview/publish/live-link), `Canvas` (viewport-cull host, drop slots, fresh-id enter animation), `BlockItem` (per-id Zustand subscription, draggable, hover toolbar, leave animation), `BlockPalette` (draggable + click-to-add, preset chips), `PropsPanel` (tokens-only responsive selects + page-meta when no selection), `InlineText` / `InlineControls` / `RichTextToolbar`, `DeviceSwitch`, `ThemeEditor`, `GoogleFontsLoader`, `MediaPicker`, `PagesSidebar`, `PageTemplatePicker`, `ShortcutsModal`, `WelcomeModal`, `MultiSelectBar`, `Toasts`.

**Non-obvious guardrails:**
- Canvas/BlockItem subscribe per-id via `useShallow` — do not reintroduce whole-`page` subscriptions; it re-renders every block on every keystroke.
- `RichText` commits to Zustand **on blur only** (diffs `editor.getJSON()`), so TipTap's own history handles keystroke-level undo and Cmd+Z in the Zustand stack reverts the whole edit session.
- Image + gallery `<img>` warnings are intentional (no `next/image` for Payload-origin media).

### apps/web (Astro public renderer)

Astro 6 + Tailwind v4 (`@tailwindcss/vite`). `output: "server"`, `@astrojs/node` placeholder adapter (swap to `@astrojs/cloudflare` / `@astrojs/vercel` at deploy).

- [apps/web/src/middleware.ts](apps/web/src/middleware.ts) — strips port from `Host`, calls `fetchSiteByDomain` (TTL-memoized), writes `siteId` + `site` onto `Astro.locals`.
- [apps/web/src/lib/api.ts](apps/web/src/lib/api.ts) — REST client: `fetchSiteByDomain`, `fetchPageBySlug` (enforces `status=published` + `site=siteId`), `fetchPublishedPages` (sitemap). Site lookups memoized 5min in-process.
- [apps/web/src/pages/[...slug].astro](apps/web/src/pages/[...slug].astro) — catch-all: full meta tags (title/description/canonical/OG/Twitter), theme `<style>:root{...}</style>` injection, optional Google Fonts link, `<header>`/`<footer>` from `site.header`/`site.footer`, main `<BlockRenderer>` loop over `page.blocks`, cache `public, s-maxage=60, stale-while-revalidate=3600`. Empty slug → `home`.
- [apps/web/src/components/BlockRenderer.astro](apps/web/src/components/BlockRenderer.astro) — runs `validateBlock`, resolves token className, dispatches to per-block `.astro` component. Unknown block types render nothing (forward compat).
- [apps/web/src/components/blocks/](apps/web/src/components/blocks/) — one `.astro` per block type. Container blocks recurse via `BlockRenderer`.
- [apps/web/src/pages/sitemap.xml.ts](apps/web/src/pages/sitemap.xml.ts) — cached 5min.
- [apps/web/src/styles/global.css](apps/web/src/styles/global.css) — Tailwind `@theme` defaults + `@source inline("{,md:,lg:}{...}")` safelist. When adding a new token value, extend both the token map and this safelist.

## Commands

Root (via Turbo): `pnpm dev:api`, `pnpm dev:studio`, `pnpm dev:web`, `pnpm build`, `pnpm lint`, `pnpm test`.

Per app (cd into the app):

```bash
# apps/api
pnpm dev | devsafe | build | start
pnpm generate:types            # regenerate src/payload-types.ts
pnpm generate:importmap
pnpm test | test:int | test:e2e
pnpm test:int -- tests/int/api.int.spec.ts                # single test
pnpm test:e2e -- tests/e2e/admin.e2e.spec.ts -g "name"    # single e2e

# apps/studio
pnpm dev | build | start | lint

# apps/web
pnpm dev | build | preview | astro <cmd>
```

Playwright uses `reuseExistingServer: true` at `:3000`.

## Cross-cutting conventions

- **Package manager:** pnpm 10+, single root `pnpm-lock.yaml`.
- **Ports:** api `:3000`, studio `:3001`, web `:4321`. Override with `PORT=` / `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WEB_URL` / `PAYLOAD_API_URL`.
- **TypeScript/ESM throughout.**
- **Free-tier constraint is load-bearing.** When evaluating designs, Cloudflare Pages / Vercel Hobby cost is a first-class concern.
- **Next.js version in `apps/studio` has breaking changes vs. training data.** Read `node_modules/next/dist/docs/` for the relevant API before writing Next.js code; heed deprecation notices. See [apps/studio/AGENTS.md](apps/studio/AGENTS.md).

## When adding things

- **New block type:** define Zod schema with `.passthrough()` in `@moxie/contract/src/blocks/`, register in `default-registry.ts`, add studio component + web `.astro` component + palette template (optionally presets + smart-defaults). Add literal Tailwind classes to the web safelist if the block emits new ones.
- **New token value:** add to the token map in `@moxie/tokens`, add literal classes to [apps/web/src/styles/global.css](apps/web/src/styles/global.css) `@source inline` (with `{,md:,lg:}` brace expansion if responsive).
- **Breaking block shape change:** bump `version`, add `migrate(prev)` in the new version def. `validateBlock` will auto-migrate on read.
- **New Payload collection/field:** write it, then `pnpm generate:types` inside `apps/api`.
