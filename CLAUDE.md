# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Moxie is

Moxie is a free-tier, multi-tenant visual CMS stack built to run on Cloudflare Pages or Vercel Hobby without rebuild-per-publish or CSS-safelist blowups. It is **not** a typical Payload+Next starter — the v2 architecture decouples the editor from the CMS and replaces freeform Tailwind with a token system. See [README.md](README.md) for the full architectural rationale.

## Architecture — non-negotiable rules

Future code must respect these. They override Payload/Next defaults that training data may suggest.

1. **No Payload Local API outside `apps/api`.** `apps/studio` and `apps/web` communicate with Payload **only via HTTP REST**. Treat Payload as a replaceable headless CMS. Local API use is reserved for migration scripts and seeders running inside the api container. Never `import { getPayload } from 'payload'` in studio or web code.
2. **Versioned block contract.** Every block is defined by a Zod schema + TS type in `@moxie/contract` and carries a version. Pages store the version they were authored with so evolving a block does not silently break existing content. When changing a block schema, bump its version.
3. **Design tokens only, no freeform Tailwind in content.** Editable properties (padding, gap, color, radius, etc.) go through `@moxie/tokens`, which maps token keys → a fixed set of Tailwind classes. The Studio props panel exposes tokens, not a class input. This keeps Tailwind's JIT set bounded.
4. **Multi-tenant via `siteId`.** Every data-carrying boundary (collection, query, REST response, Astro request) must thread `siteId`. The public renderer resolves `siteId` from the incoming domain via middleware.
5. **SSR + CDN cache, not rebuilds.** Astro renders on-demand with cache headers; "Publish" invalidates the cache. No static rebuild on content change. Design new features around this.

## Repository layout

Moxie uses a monorepo shape (`apps/`, `packages/`, `tooling/config/`). **There is currently no root workspace wiring** — no root `package.json`, no `pnpm-workspace.yaml`, no Turbo/Nx. `packages/` and `tooling/config/` are empty scaffolding that will be populated per the target layout below. Until workspace wiring exists, run commands from inside the specific app directory and import packages via relative paths or file-links as they are created.

Target layout (fill in as phases land):

```
moxie/
├── apps/
│   ├── api/     # Payload CMS — Admin UI + public REST only
│   ├── studio/  # Next.js visual editor
│   └── web/     # Astro multi-tenant public renderer
├── packages/
│   ├── @moxie/contract/  # Zod schemas, TS types, block versions
│   ├── @moxie/engine/    # Agnostic render logic (used by studio + web)
│   ├── @moxie/ui/        # React base components (studio only)
│   └── @moxie/tokens/    # Token → Tailwind class map
└── tooling/
    └── config/           # Shared ESLint / TS / Tailwind v4 config
```

## Phase plan (where we are)

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| F0 | Contract + tokens | `@moxie/contract`, `@moxie/tokens`, versioning scheme |
| F1 | Multi-tenant API | Payload with `siteId`, public REST endpoints for Astro |
| F2 | Visual editor | Studio with dnd-kit, iframe preview, tokens-only props panel |
| F3 | Astro engine | SSR + cache headers + domain middleware |
| F4 | Publish + limits | Publish = cache invalidation (no rebuild). Free-tier stress tests |

When starting work, ask which phase is active — file state alone may not tell you.

## The three apps

### [apps/api](apps/api/) — Payload CMS (`"backend"`)

Payload 3.83 mounted inside Next.js 16 (App Router). Payload owns `/admin` and `/api/*` REST+GraphQL under [src/app/(payload)/](apps/api/src/app/). The Payload config is at [src/payload.config.ts](apps/api/src/payload.config.ts); collections are in [src/collections/](apps/api/src/collections/).

- **Database:** Postgres via `@payloadcms/db-postgres` (note: `.env.example` still shows a MongoDB URL from the starter — ignore that; `DATABASE_URL` must be a Postgres connection string).
- **Required env:** `DATABASE_URL`, `PAYLOAD_SECRET`.
- **Generated file:** [src/payload-types.ts](apps/api/src/payload-types.ts) is produced by `pnpm generate:types` — regenerate after changing collection schemas, don't hand-edit.
- **Payload skill:** A task→reference table lives at [apps/api/.claude/skills/payload/SKILL.md](apps/api/.claude/skills/payload/SKILL.md). Consult it before writing collections, fields, hooks, access control, or query code.
- **Role in v2:** admin panel + REST API surface. Local API stays inside this app only.

Commands (from `apps/api/`):
```bash
pnpm dev                 # Next dev server on :3000 (admin at /admin)
pnpm devsafe             # wipes .next first
pnpm build && pnpm start # production
pnpm generate:types      # regenerate payload-types.ts
pnpm generate:importmap  # regenerate admin importmap
pnpm payload <cmd>       # any payload CLI command
pnpm lint
pnpm test                # test:int then test:e2e
pnpm test:int            # vitest (tests/int/**/*.int.spec.ts)
pnpm test:e2e            # playwright (tests/e2e/), auto-starts pnpm dev
```

Run a single test:
```bash
pnpm test:int -- tests/int/api.int.spec.ts
pnpm test:e2e -- tests/e2e/admin.e2e.spec.ts -g "can navigate to dashboard"
```

Playwright's `webServer` uses `reuseExistingServer: true`, so an already-running dev server at `http://localhost:3000` will be reused.

### [apps/studio](apps/studio/) — Next.js visual editor (`"editor"`)

Next.js 16 + React 19 + Tailwind v4 + `@dnd-kit`. Entry at [app/page.tsx](apps/studio/app/page.tsx). Currently a create-next-app shell to be fleshed out in Phase 2.

**Critical:** [apps/studio/AGENTS.md](apps/studio/AGENTS.md) warns that this Next.js version has breaking changes vs. training data — read `node_modules/next/dist/docs/` for the relevant API before writing Next.js code here, and heed deprecation notices.

**v2 rules applied here:**
- Fetch content from `apps/api` over HTTP REST. Do not import `payload`.
- The props panel binds to tokens from `@moxie/tokens`. Do not render `className` inputs or let users type raw Tailwind.
- Page/block data must include the contract version from `@moxie/contract`.

Commands (from `apps/studio/`): `pnpm dev` · `pnpm build` · `pnpm start` · `pnpm lint`.

### [apps/web](apps/web/) — Astro multi-tenant renderer (`"public-site"`)

Astro 6 with Tailwind v4 (via `@tailwindcss/vite`). Requires Node ≥ 22.12. Pages in [src/pages/](apps/web/src/pages/).

**v2 rules applied here:**
- Configure for **SSR** with cache headers. No static rebuild on publish.
- Domain middleware resolves `siteId` from the incoming host and passes it into every REST fetch to `apps/api`.
- Render via `@moxie/engine` + `@moxie/tokens` — never read block shapes directly; go through the contract.

Commands (from `apps/web/`): `pnpm dev` (`:4321`) · `pnpm build` · `pnpm preview` · `pnpm astro <cmd>`.

## Cross-cutting conventions

- **Package manager:** pnpm. Each app currently has its own lockfile; that will consolidate when the workspace is wired up.
- **Port map:** api and studio both default to `:3000` — override one (`PORT=3001 pnpm dev`) if running simultaneously. web is `:4321`.
- **TypeScript/ESM throughout.** Use ESM syntax.
- **No root-level scripts.** Always `cd` into the app or package you're working on until workspace wiring lands.
- **Free-tier constraint is load-bearing.** When evaluating designs, cost on Cloudflare Pages / Vercel Hobby is a first-class concern, not an afterthought.
