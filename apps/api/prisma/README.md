# Prisma — database schema

## Common commands

```bash
# Generate Prisma client from schema (after edits)
pnpm prisma:generate

# Create + apply a new migration (dev only)
pnpm prisma:migrate --name describe_change

# Apply existing migrations (production)
pnpm prisma:deploy

# Open visual DB explorer
pnpm prisma:studio

# Seed roles + super_admin + sample data
pnpm prisma:seed

# Reset DB (DESTRUCTIVE — dev only)
pnpm prisma migrate reset
```

## Schema overview

- **Identity** : `roles`, `users`, `refresh_tokens`
- **Logistics** : `boxes`, `parcels`, `parcel_events` (append-only audit), `customers`
- **Finance** : `payments`, `cash_accounts`, `cash_operations`
- **Config** : `pricing_rules`, `exchange_rates`
- **Audit** : `audit_log` (admin actions, separate from parcel timeline)

## Conventions

- All tables use `snake_case` via `@@map` and `@map`
- All IDs are UUIDs (string)
- Money fields use `Decimal` (never `Float`)
- Timestamps are `DateTime` with `@default(now())` and `@updatedAt`
- Soft-delete is **not** used — we rely on `active` flags and compensating events

## Append-only invariant

`parcel_events` is **append-only**: never `UPDATE` or `DELETE` rows. If a transition was wrong, insert a **compensating event** that reverses it. This preserves a complete audit trail.

A future Postgres rule (or row-level lock) will enforce this at the DB level:

```sql
CREATE RULE no_update_parcel_events AS
  ON UPDATE TO parcel_events DO INSTEAD NOTHING;
CREATE RULE no_delete_parcel_events AS
  ON DELETE TO parcel_events DO INSTEAD NOTHING;
```
