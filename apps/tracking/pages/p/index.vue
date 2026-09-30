<script setup lang="ts">
const route = useRoute()
const value = String(route.query.trackingNumber ?? '').trim().toUpperCase()

if (/^GSG-[A-Z]{2}-[A-Z0-9]{6,10}$/.test(value)) {
  await navigateTo(`/p/${encodeURIComponent(value)}`, { redirectCode: 302 })
}

throw createError({
  statusCode: 400,
  statusMessage: 'Numéro de suivi invalide',
})
</script>

<template><div /></template>
