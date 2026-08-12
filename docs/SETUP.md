# Local development setup

## Prerequisites

```bash
# Node.js 20.11+ via nvm
nvm install 20.11.0
nvm use

# pnpm
corepack enable
corepack prepare pnpm@9.12.0 --activate

# Docker + Docker Compose v2
docker --version
docker compose version
```

## First-time setup

```bash
# 1. Clone and enter
git clone <repo-url> gsg-logistique
cd gsg-logistique

# 2. Install dependencies (monorepo)
pnpm install

# 3. Start infrastructure
pnpm docker:up
# Wait ~10s for Postgres to be healthy:
docker compose -f infra/docker-compose.yml ps

# 4. Configure API
cd apps/api
cp .env.example .env
# Edit .env if needed (JWT secrets are mandatory)

# 5. Database
pnpm prisma:generate
pnpm prisma:migrate     # creates initial migration
pnpm prisma:seed        # roles + super_admin + sample data

# 6. Run everything
cd ../..
pnpm dev
```

## URLs

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| API health | http://localhost:3000/health |
| Admin SPA | http://localhost:5173 (S2) |
| Tracking SSR | http://localhost:3001 (S4) |
| Scan PWA | http://localhost:5174 (S3) |
| MailHog UI | http://localhost:8025 |
| Prisma Studio | `pnpm --filter @gsg/api prisma:studio` |

## Default credentials

```
Email:    admin@gsglogistique.com
Password: ChangeMeNow!2026
```

⚠️ **Change the password immediately after first login.**

## Common tasks

```bash
# Reset DB (DESTRUCTIVE)
pnpm --filter @gsg/api prisma migrate reset

# Inspect logs
pnpm docker:logs

# Stop infra
pnpm docker:down

# Run only API
pnpm --filter @gsg/api dev

# Type-check everything
pnpm typecheck

# Lint
pnpm lint
```

## Troubleshooting

**"Cannot connect to Postgres"** → `pnpm docker:up` and wait until `pg_isready` passes.

**"JWT_ACCESS_SECRET must be at least 32 chars"** → generate one:
```bash
openssl rand -base64 64
```

**Prisma client out-of-sync** → `pnpm --filter @gsg/api prisma:generate`.
