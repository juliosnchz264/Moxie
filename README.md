# Moxie

CMS visual multi-tenant, escalable y gratuito — diseñado para operar bajo los límites de **Cloudflare Pages** o **Vercel Hobby** sin sacrificar la experiencia de edición ni la mantenibilidad del código.

Moxie parte de una corrección filosófica clave sobre los stacks Payload + Next.js típicos: **el acoplamiento no es el backend, es el contrato**. El editor y el sitio público no deben saber que existe Payload — sólo consumen una API REST estable y versionada.

---

## Problemas que Moxie resuelve

| Punto débil del enfoque tradicional | Solución Moxie |
|-------------------------------------|----------------|
| Editor acoplado a Payload vía Local API | Comunicación HTTP REST estricta |
| CSS "bomba" por safelist de Tailwind | Sistema de tokens de diseño pre-mapeados |
| Páginas que se rompen al evolucionar bloques | Contrato de bloques versionado |
| Falta de multi-site | `siteId` en todas las capas de datos |
| Builds ilimitados al publicar | Render SSR + caché CDN (publicar = invalidar) |

Con esto, Moxie cabe en tiers gratuitos manteniendo UX fluida y código sostenible.

---

## Arquitectura

### Estructura del monorepo

```
moxie/
├── apps/
│   ├── api/                 # Payload CMS — Admin + REST API
│   ├── studio/              # Next.js — editor visual + dashboard
│   └── web/                 # Astro — render público multi-tenant
├── packages/@moxie/
│   ├── core/                # Tipos base: Block, Page, ContractVersion
│   ├── contract/            # Zod schemas + versionado (valida tipos de core)
│   ├── engine/              # Lógica de renderizado agnóstica (studio + web)
│   ├── ui/                  # Componentes React base (scaffold)
│   └── tokens/              # Mapeo token → clases Tailwind + theme
└── tooling/
    └── config/              # ESLint, TS, Tailwind v4 compartidos
```

Workspace pnpm único con `pnpm-workspace.yaml` y Turborepo orquestando `build`/`dev`/`lint`/`test`.

### Principios no negociables

1. **HTTP REST, no Local API.** Payload es reemplazable. Sólo los scripts de migración/seed dentro del contenedor de `api` usan Local API.
2. **Contrato versionado.** Los tipos base (`Block`, `Page`) viven en `@moxie/core`. Los Zod schemas + registro de versiones viven en `@moxie/contract` y validan contra esos tipos. Cambiar un bloque implica bumpear la versión.
3. **Tokens, no Tailwind libre.** El panel de props del editor expone tokens (padding, gap, color, radius…), nunca inputs de `className`. Esto acota el JIT y evita safelists.
4. **Multi-tenant por `siteId`.** Atraviesa colecciones, queries, respuestas REST y middleware de Astro.
5. **SSR + CDN.** Publicar = invalidar caché. Nunca rebuild.

---

## Stack

| Capa | Tecnología |
|------|------------|
| CMS / API | Payload 3.83, Next.js 16, Postgres |
| Editor | Next.js 16, React 19, Tailwind v4, `@dnd-kit`, Zustand, TipTap |
| Render público | Astro 6 (SSR), Tailwind v4 |
| Contrato | Zod, TypeScript |
| Hosting objetivo | Cloudflare Pages / Vercel Hobby |

---

## Estado actual

- **Contrato + tokens** (`@moxie/core`, `@moxie/contract`, `@moxie/tokens`, `@moxie/engine`): 11 bloques versionados (hero, text, richtext, image, button, spacer, divider, card, cta, gallery, section, columns). Tokens responsive con breakpoints `base/md/lg`. Theme por sitio (presets, colores, Google Fonts).
- **API multi-tenant** (`apps/api`): colecciones Users/Sites/Pages/Media con `siteId` indexado, validación de bloques en `beforeChange`, endpoint de publish + purge de caché, límites free-tier por env.
- **Editor** (`apps/studio`): DnD desde paleta, inline editing, undo/redo + autosave, device preview, panel de tokens responsive, theme editor, media library, page templates, shortcuts, controles inline, multi-select + grouping.
- **Render público** (`apps/web`): SSR con middleware de dominio → `siteId`, componentes `.astro` por bloque, meta tags completos (OG/Twitter), sitemap.xml, cache headers.
- **Flujo unificado**: login (`/login`), dashboard de sitios (`/sites`), dashboard por sitio (`/sites/[id]`), editor (`/editor/[pageId]`), editor de header/footer (`/editor/site/[id]/[slot]`), AppShell compartido con menú de usuario.

---

## Puesta en marcha

### Requisitos

- **Node** ≥ 22.12
- **pnpm** ^10
- **Postgres** accesible vía `DATABASE_URL`

### Instalación

```bash
pnpm install
```

Copia `.env.example` a `.env` dentro de `apps/api` y configura `DATABASE_URL` (Postgres) + `PAYLOAD_SECRET`.

### Levantar los tres servicios

Desde la raíz:

```bash
pnpm dev:api        # http://localhost:3000/admin
pnpm dev:studio     # http://localhost:3001
pnpm dev:web        # http://localhost:4321
```

O vía Turbo: `pnpm build`, `pnpm lint`, `pnpm test`.

### Flujo de uso

1. Abre `http://localhost:3001` — redirige a `/login`.
2. Crea una cuenta, inicia sesión.
3. En `/sites`, crea un sitio (nombre, slug, dominio — por defecto `{slug}.localhost`).
4. Se crea automáticamente una página `home` y se abre el editor.
5. Usa el botón `Live ↗` del toolbar para ver el resultado en `apps/web` vía el dominio del sitio.

---

## Mapa de puertos en desarrollo

| App | Puerto |
|-----|--------|
| `apps/api` | `:3000` |
| `apps/studio` | `:3001` |
| `apps/web` | `:4321` |

---

## Convenciones

- Package manager: **pnpm 10+**, monorepo con Turborepo.
- TypeScript + ESM en todo.
- Nada de importar `payload` fuera de `apps/api`. El editor y el sitio público hablan **sólo** REST.
- Toda propiedad visual editable pasa por `@moxie/tokens`.
- Todo bloque persistido lleva una versión del contrato.

---

## Guía para Claude Code

Ver [CLAUDE.md](CLAUDE.md) — reglas arquitectónicas, referencia de comandos y estado del monorepo.
