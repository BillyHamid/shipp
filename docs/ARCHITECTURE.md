# GSGLOGISTIQUE v2 — Architecture

> Reference document. Update this when major design decisions change.

## System topology

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Admin (Vue3) │  │ Tracking     │  │ Scan PWA     │
│   ERP dense  │  │ (Nuxt 3 SSR) │  │ (Vue3 mobile)│
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └───────┬─────────┴─────────┬───────┘
               ▼                   ▼
        ┌──────────────────────────────┐
        │   API NestJS (TS)            │
        │  ├─ HTTP REST (admin+public) │
        │  └─ WebSocket gateway        │
        └──────────┬───────────────────┘
                   │
         ┌─────────┼─────────┬──────────────┐
         ▼         ▼         ▼              ▼
   ┌────────┐ ┌────────┐ ┌────────────┐ ┌────────┐
   │Postgres│ │ Redis  │ │ BullMQ     │ │ S3-like│
   │  (OLTP)│ │(cache/ │ │ (workers:  │ │(photos)│
   │        │ │ ws sub)│ │  notif/QR) │ │        │
   └────────┘ └────────┘ └────────────┘ └────────┘
```

## Guiding principles

1. **Event-driven core** — every parcel state change emits an event persisted in `parcel_events`, broadcast over WS, and triggers side-effects via BullMQ.
2. **Explicit state machine** — transitions are validated against `PARCEL_TRANSITIONS` matrix. No skipping. RBAC checked server-side on every action.
3. **CQRS-lite** — write path: command handlers. Read path: dedicated query handlers + Redis cache.
4. **Public ≠ Admin** — separate apps, separate API endpoints, separate auth (admin uses JWT; tracking page is unauthenticated and rate-limited).
5. **Type-safe end-to-end** — TypeScript everywhere, shared types in `@gsg/shared-types`, Zod schemas, Prisma-generated DB types.
6. **Mobile-first scan** — the agent's PWA is the most polished UX surface.
7. **Real-time by default** — every change → WS broadcast → live UI update.
8. **Append-only audit** — `parcel_events` is immutable. Use compensating events to undo.

## Tech stack

| Layer | Tech |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | NestJS 10 (CQRS, WebSocket, modular DI) |
| ORM | Prisma 5 + PostgreSQL 16 |
| Cache & pub/sub | Redis 7 |
| Jobs | BullMQ |
| Auth | JWT access + rotating refresh tokens (cookie) |
| Hash | Argon2id |
| Validation | Zod (shared with frontends) |
| Admin SPA | Vue 3 + Vite + Pinia + Tailwind + shadcn-vue |
| Public tracking | Nuxt 3 (SSR) |
| Scan PWA | Vue 3 + vite-plugin-pwa + @zxing/browser |
| Real-time | Socket.IO (Redis adapter) |
| QR | `qrcode` (server) + `@zxing/browser` (scan) |
| Logging | Pino + OpenTelemetry |

## Repository layout

```
apps/
  api/             NestJS backend
  admin/           Vue 3 admin SPA
  tracking/        Nuxt 3 public SSR
  scan/            Vue 3 PWA

packages/
  shared-types/    TS types + Zod schemas + permissions

infra/
  docker-compose.yml
  nginx/

docs/
  ARCHITECTURE.md  (this file)
  ADRs/
```

## Domain glossary

| Term | Meaning |
|---|---|
| **Box** | Physical container (CARGO or EXPRESS) carrying multiple parcels |
| **Parcel** | An individual shipment from a sender to a recipient, assigned to one box |
| **Tracking number** | Unique non-sequential ID exposed to public, format `GSG-XX-XXXXXXXX` |
| **State** | Where the parcel is in its lifecycle (10 states, see `domain.ts`) |
| **Transition** | A valid move from one state to another, triggered by an action and gated by role |
| **Event** | An immutable record in `parcel_events` describing what happened |
| **Permission** | A fine-grained capability granted to a role |

## Sprint 1 deliverables (the foundation)

- [x] Monorepo with pnpm + Turborepo
- [x] `@gsg/shared-types` with state machine, permissions, Zod schemas
- [x] NestJS skeleton (main, AppModule, config, Prisma, health)
- [x] Prisma schema + seed (roles + super_admin + cash accounts + pricing rules)
- [x] Auth module (login, refresh, logout, /me, JWT, Argon2, RBAC guards)
- [x] Docker Compose (Postgres, Redis, MailHog)

## Next sprints

- **S2** — Parcels CRUD + state machine + transition handler (with append-only event log)
- **S3** — QR code generation + scan API endpoint
- **S4** — Public tracking endpoint (Nuxt + masked data)
- **S5** — WebSocket real-time
- **S6** — Cash module + pricing quote endpoint
- **S7** — Notifications (WhatsApp + SMS fallback)

## ADRs

See `docs/ADRs/` for the rationale behind each major decision:

- ADR-001 NestJS over Fastify
- ADR-002 Prisma over TypeORM
- ADR-003 Event log instead of full event sourcing
- ADR-004 Nuxt SSR for tracking, SPA for admin
- ADR-005 WhatsApp before email for notifications
