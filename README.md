# Moxie

Un CMS visual multi-tenant, escalable y gratuito — diseñado para operar bajo los límites de **Cloudflare Pages** o **Vercel Hobby** sin sacrificar la experiencia de edición ni la mantenibilidad del código.

Moxie parte de una corrección filosófica clave sobre los stacks Payload + Next.js típicos: **el acoplamiento no es el backend, es el contrato**. El editor y el sitio público no deben saber que existe Payload — sólo consumen una API REST estable y versionada.

---

## Problemas que Moxie v2 resuelve

| Punto débil del enfoque tradicional | Solución Moxie v2 |
|-------------------------------------|-------------------|
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
│   ├── api/                 # Payload CMS — solo Admin + REST API
│   ├── studio/              # Next.js — editor visual
│   └── web/                 # Astro — render público multi-tenant
├── packages/
│   ├── @moxie/contract/     # Zod schemas, tipos TS, versiones de bloques
│   ├── @moxie/engine/       # Lógica de renderizado agnóstica (studio + web)
│   ├── @moxie/ui/           # Componentes React base (studio)
│   └── @moxie/tokens/       # Mapeo token → clases Tailwind
└── tooling/
    └── config/              # ESLint, TS, Tailwind v4 compartidos
```

> `packages/` y `tooling/config/` están vacíos todavía — se poblarán durante las Fases 0 y 1.

### Principios no negociables

1. **HTTP REST, no Local API.** Payload es reemplazable. Sólo los scripts de migración/seed dentro del contenedor de `api` usan Local API.
2. **Contrato versionado.** Los bloques viven en `@moxie/contract` como Zod schemas con versión. Cambiar un bloque implica bumpear la versión.
3. **Tokens, no Tailwind libre.** El panel de props del editor expone tokens (padding, gap, color, radius…), nunca inputs de `className`. Esto acota el JIT y evita safelists.
4. **Multi-tenant por `siteId`.** Atraviesa colecciones, queries, respuestas REST y middleware de Astro.
5. **SSR + CDN.** Publicar = invalidar caché. Nunca rebuild.

---

## Stack

| Capa | Tecnología |
|------|------------|
| CMS / API | Payload 3.83, Next.js 16, Postgres |
| Editor | Next.js 16, React 19, Tailwind v4, `@dnd-kit` |
| Render público | Astro 6 (SSR), Tailwind v4 |
| Contrato | Zod, TypeScript |
| Hosting objetivo | Cloudflare Pages / Vercel Hobby |

---

## Plan de fases

| Fase | Duración | Entregable | Enfoque |
|------|----------|------------|---------|
| **F0** | Sem 1 | Contrato y tokens | Setup de `@moxie/contract`, `@moxie/tokens`, versionado definido |
| **F1** | Sem 2 | API multi-tenant | Payload con `siteId`, endpoints REST públicos para Astro |
| **F2** | Sem 3–4 | Editor visual | Studio + `dnd-kit`, iframe React preview, panel de props con tokens |
| **F3** | Sem 5 | Motor Astro híbrido | SSR con cache headers, middleware de dominio → `siteId` |
| **F4** | Sem 6 | Publicación y límites | Flujo publicar (invalida caché, no rebuild). Estrés en free tier |

---

## Puesta en marcha

Cada app es independiente (lockfile propio, sin workspace root todavía). Ejecutar comandos dentro de cada app.

### Requisitos

- **Node** ≥ 22.12 (requerido por `apps/web`)
- **pnpm** ^9 o ^10
- **Postgres** accesible vía `DATABASE_URL`

### apps/api — Payload CMS

```bash
cd apps/api
cp .env.example .env      # reemplaza DATABASE_URL por una URL Postgres
pnpm install
pnpm dev                  # http://localhost:3000/admin
```

Comandos útiles:

```bash
pnpm generate:types       # regenera src/payload-types.ts
pnpm test:int             # vitest
pnpm test:e2e             # playwright
```

### apps/studio — Editor visual

```bash
cd apps/studio
pnpm install
pnpm dev                  # Next.js dev server (usa PORT=3001 si api ya corre en 3000)
```

### apps/web — Sitio público (Astro)

```bash
cd apps/web
pnpm install
pnpm dev                  # http://localhost:4321
```

---

## Mapa de puertos en desarrollo

| App | Puerto por defecto |
|-----|--------------------|
| `apps/api` | `:3000` |
| `apps/studio` | `:3000` (override con `PORT=3001`) |
| `apps/web` | `:4321` |

---

## Convenciones

- Package manager: **pnpm**.
- TypeScript + ESM en todo.
- Nada de importar `payload` fuera de `apps/api`. El editor y el sitio público hablan **sólo** REST.
- Toda propiedad visual editable debe pasar por `@moxie/tokens`.
- Todo bloque persistido lleva una versión del contrato.

---

## Guía para Claude Code

Ver [CLAUDE.md](CLAUDE.md) — incluye las reglas arquitectónicas que cualquier agente debe respetar y una referencia rápida de comandos por app.
