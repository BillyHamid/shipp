# GSGLOGISTIQUE v2

International shipping platform — USA ↔ Burkina Faso.

Event-driven logistics system with state machine workflow, real-time tracking, QR scan, and a public customer tracking experience inspired by DHL/FedEx.

## Architecture

Monorepo (pnpm + Turborepo) with three applications consuming one event-driven API:

```
apps/
  api/         NestJS backend (REST + WebSocket)
  admin/       Vue 3 SPA — back-office ERP
  tracking/    Nuxt 3 SSR — public tracking page
  scan/        Vue 3 PWA — mobile scan app for agents

packages/
  shared-types/  TS types + Zod schemas shared across apps

infra/
  docker-compose.yml  Local dev: Postgres + Redis + MailHog
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full design.

## Prerequisites

- Node.js 20.11+ (`nvm use`)
- pnpm 9+
- Docker + Docker Compose (for Postgres/Redis)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (Postgres, Redis, MailHog)
pnpm docker:up

# 3. Bootstrap database
cd apps/api
cp .env.example .env
pnpm prisma migrate dev
pnpm prisma db seed

# 4. Run all apps in dev mode
cd ../..
pnpm dev
```

Apps will be available at:
- API: http://localhost:3000
- Admin: http://localhost:5173
- Tracking: http://localhost:3001
- Scan PWA: http://localhost:5174
- MailHog UI: http://localhost:8025

## Default admin

After seeding, login with:
- Email: `admin@gsglogistique.com`
- Password: `ChangeMeNow!2026`

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Run all apps in watch mode |
| `pnpm build` | Build all apps for production |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run all tests |
| `pnpm docker:up` | Start Docker infrastructure |
| `pnpm docker:down` | Stop Docker infrastructure |

## License

Proprietary — © Global Shipping Group LLC
