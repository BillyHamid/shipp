/**
 * Database seed — idempotent.
 * Creates default roles + a super_admin user + sample cash accounts and pricing rules.
 *
 * Run with: pnpm prisma:seed
 */
import { PrismaClient, Currency } from '@prisma/client'
import * as argon2 from 'argon2'
import { ROLES, ROLE_LABELS } from '@gsg/shared-types/domain'
import { ROLE_PERMISSIONS } from '@gsg/shared-types/permissions'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...\n')

  // ── 1. Roles ──────────────────────────────────────────────────────────────
  console.log('Creating roles...')
  for (const roleName of ROLES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {
        permissions: [...ROLE_PERMISSIONS[roleName]],
        label: ROLE_LABELS[roleName],
      },
      create: {
        name: roleName,
        label: ROLE_LABELS[roleName],
        permissions: [...ROLE_PERMISSIONS[roleName]],
      },
    })
    console.log(`  ✓ Role: ${roleName}`)
  }

  // ── 2. Default super_admin ────────────────────────────────────────────────
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'super_admin' } })
  const defaultPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeNow!2026'
  const passwordHash = await argon2.hash(defaultPassword)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gsglogistique.com' },
    update: {},
    create: {
      email: 'admin@gsglogistique.com',
      passwordHash,
      fullName: 'Super Admin',
      roleId: superAdminRole.id,
      country: null,
      active: true,
    },
  })
  console.log(`\n👤 Super admin: ${admin.email}`)
  console.log(`   Password: ${defaultPassword}  (CHANGE IT)\n`)

  // ── 3. Demo cash accounts ─────────────────────────────────────────────────
  console.log('Creating cash accounts...')
  const usaAccount = await prisma.cashAccount.upsert({
    where: { code: 'ACC-USA-001' },
    update: {},
    create: {
      code: 'ACC-USA-001',
      label: 'Caisse principale USA',
      country: 'US',
      currency: Currency.USD,
      balance: 0,
    },
  })
  const bfAccount = await prisma.cashAccount.upsert({
    where: { code: 'ACC-BF-001' },
    update: {},
    create: {
      code: 'ACC-BF-001',
      label: 'Caisse principale Burkina Faso',
      country: 'BF',
      currency: Currency.XOF,
      balance: 0,
    },
  })
  console.log(`  ✓ ${usaAccount.code} (${usaAccount.currency})`)
  console.log(`  ✓ ${bfAccount.code} (${bfAccount.currency})`)

  // ── 4. Initial exchange rate ──────────────────────────────────────────────
  const rate = Number(process.env.EXCHANGE_RATE_USD_XOF ?? 563)
  await prisma.exchangeRate.upsert({
    where: {
      fromCurrency_toCurrency_validFrom: {
        fromCurrency: Currency.USD,
        toCurrency: Currency.XOF,
        validFrom: new Date('2026-01-01T00:00:00Z'),
      },
    },
    update: { rate },
    create: {
      fromCurrency: Currency.USD,
      toCurrency: Currency.XOF,
      rate,
      validFrom: new Date('2026-01-01T00:00:00Z'),
      source: 'manual',
    },
  })
  console.log(`\n💱 Exchange rate USD → XOF = ${rate}`)

  // ── 5. Sample pricing rules ───────────────────────────────────────────────
  console.log('\nCreating sample pricing rules...')
  const rules = [
    { label: 'Téléphone USA → BF', category: 'PHONE', basePriceUsd: 30, perKgUsd: 20 },
    { label: 'Électronique USA → BF', category: 'ELECTRONICS', basePriceUsd: 25, perKgUsd: 15 },
    { label: 'Ordinateur USA → BF', category: 'COMPUTER', basePriceUsd: 50, perKgUsd: 15 },
    { label: 'Vêtements USA → BF', category: 'CLOTHING', basePriceUsd: 10, perKgUsd: 12 },
    { label: 'Cosmétiques USA → BF', category: 'COSMETICS', basePriceUsd: 15, perKgUsd: 14 },
    { label: 'Alimentaire USA → BF', category: 'FOOD', basePriceUsd: 12, perKgUsd: 10 },
    { label: 'Documents USA → BF', category: 'DOCUMENTS', basePriceUsd: 25, perKgUsd: 5 },
    { label: 'Autres USA → BF', category: 'OTHER', basePriceUsd: 18, perKgUsd: 15 },
  ]
  for (const r of rules) {
    await prisma.pricingRule.create({
      data: {
        label: r.label,
        category: r.category,
        originCountry: 'US',
        destCountry: 'BF',
        basePriceUsd: r.basePriceUsd,
        perKgUsd: r.perKgUsd,
        active: true,
      },
    })
    console.log(`  ✓ ${r.label} (base $${r.basePriceUsd} + $${r.perKgUsd}/kg)`)
  }

  console.log('\n✅ Seed complete.\n')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
