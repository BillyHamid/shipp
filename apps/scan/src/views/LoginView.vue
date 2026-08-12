<script setup lang="ts">
import { ref } from 'vue'
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
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  } catch {
    error.value = 'Identifiants incorrects'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col justify-center px-6 py-12">
    <div class="text-center mb-10">
      <div class="mx-auto size-16 rounded-2xl bg-brand-500 flex items-center justify-center text-3xl">
        📦
      </div>
      <h1 class="mt-4 text-xl font-semibold text-white">GSG Scan</h1>
      <p class="mt-1 text-sm text-slate-400">Connectez-vous pour scanner des colis</p>
    </div>

    <form class="space-y-3" @submit.prevent="onSubmit">
      <input
        v-model="email"
        type="email"
        placeholder="Email"
        autocomplete="username"
        required
        class="w-full h-14 rounded-2xl bg-slate-900 border border-slate-800 px-5 text-white
               placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />
      <input
        v-model="password"
        type="password"
        placeholder="Mot de passe"
        autocomplete="current-password"
        required
        class="w-full h-14 rounded-2xl bg-slate-900 border border-slate-800 px-5 text-white
               placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <p v-if="error" class="text-sm text-red-400 text-center">{{ error }}</p>

      <button type="submit" class="btn-primary" :disabled="loading">
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
    </form>
  </div>
</template>
