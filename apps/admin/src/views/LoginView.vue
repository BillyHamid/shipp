<script setup lang="ts">
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  loading.value = true
  error.value = null
  try {
    await auth.login(email.value, password.value)
    router.push((route.query.redirect as string) || '/')
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 401) {
      error.value = 'Identifiants incorrects'
    } else if (isAxiosError(err) && !err.response) {
      error.value = 'Impossible de joindre le serveur. Veuillez réessayer dans un instant.'
    } else {
      error.value = 'Connexion momentanément indisponible. Veuillez réessayer.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- Branded panel — desktop only -->
    <div class="hidden lg:flex lg:w-[45%] admin-login-panel relative overflow-hidden flex-col justify-between p-12">
      <div class="absolute -top-24 -right-16 size-96 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
      <div class="absolute -bottom-32 -left-10 size-72 rounded-full bg-rose-300/10 blur-3xl" aria-hidden="true" />

      <img src="/logo.jpg" alt="Global Shipping Group" class="relative h-14 w-auto rounded-xl bg-white px-2.5 py-1.5 shadow-lg self-start" />

      <div class="relative">
        <p class="text-xs font-bold uppercase tracking-wider text-brand-400">Espace administration</p>
        <h1 class="font-display text-3xl font-extrabold text-white tracking-tight mt-3 leading-tight">
          Pilotez chaque colis, du dépôt à la livraison.
        </h1>
        <p class="text-ink-300 mt-4 max-w-sm">
          Logistique, caisse et suivi en temps réel — toute l'activité GSGLOGISTIQUE
          au même endroit.
        </p>
      </div>

      <p class="relative text-xs text-ink-300">© {{ new Date().getFullYear() }} Global Shipping Group LLC</p>
    </div>

    <!-- Form -->
    <div class="flex-1 flex items-center justify-center bg-[#fbf8f7] px-6 py-12">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8 lg:hidden">
          <img src="/logo.jpg" alt="Global Shipping Group" class="mx-auto h-16 w-auto rounded-xl bg-white px-2.5 py-1.5 shadow" />
        </div>
        <div class="mb-8">
          <h2 class="font-display text-2xl font-extrabold text-ink-900">Connexion</h2>
          <p class="text-sm text-ink-500 mt-1">Entrez vos identifiants pour accéder à l'espace admin.</p>
        </div>

        <form class="card p-6 space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="label">Email</label>
            <input v-model="email" type="email" required autocomplete="username" class="input" />
          </div>
          <div>
            <label class="label">Mot de passe</label>
            <input v-model="password" type="password" required autocomplete="current-password" class="input" />
          </div>
          <p v-if="error" class="flex items-center gap-1.5 text-sm text-red-600">
            <Icon icon="ph:warning-circle-bold" class="size-4 shrink-0" />
            {{ error }}
          </p>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
            <Icon v-if="loading" icon="ph:spinner-gap-bold" class="size-4 animate-spin" />
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
